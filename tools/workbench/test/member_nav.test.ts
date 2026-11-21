import test from "node:test";
import assert from "node:assert/strict";
import { buildIndex } from "../src/index.ts";
import { planAddElement } from "../src/edit.ts";
import { memberDetails } from "../src/member_nav.ts";
import { memberConnectionCanvas, MEMBER_CANVAS_PREFIX, MEMBER_CANVAS_LIMIT } from "../src/member_canvas.ts";
import { cardNotePath } from "../src/canvas.ts";
import { classes } from "./harness.ts";

/** Synthetic, governed native SysML. No customer data, UI mocks or extra store. */
function fixture(sourceBody: string) {
  const author = "skellyspencer", now = new Date("2026-11-20T12:30:00");
  const files = new Map<string, string>();
  const add = (title: string) => {
    const plan = planAddElement(buildIndex(files, { classes }), classes,
      { type: "Object", subtype: "part", title, folder: "20_Model", author, now });
    assert.deepEqual(plan.problems, []);
    const w = plan.writes[0]!;
    files.set(w.path, w.after);
    return w.path;
  };
  const controller = add("Controller");
  files.set(controller, files.get(controller)!.replace("part def Controller;",
    "part def Controller {\n        port signal;\n    }"));
  const symbol = buildIndex(files).notes.get(controller)!.def!.symbol;
  const system = add("System");
  files.set(system, files.get(system)!.replace("part def System;",
    "part def System {\n" + sourceBody.replace(/__CONTROLLER__/g, symbol) + "\n    }"));
  const ix = buildIndex(files, { classes });
  assert.deepEqual(ix.notes.get(system)?.warnings, []);
  return { files, ix, controller, system };
}

test("member inspector keeps usage identity distinct from typed definition and traces explicit endpoints", () => {
  const { files, ix, controller, system } = fixture([
    "        part ctrl : __CONTROLLER__;",
    "        port input;",
    "        port output;",
    "        port missingType;",
    "        connect input to ctrl.signal;",
    "        bind input = output;",
    "        flow of Message from input to output;",
    "        connect input to ctrl.absent;",
    "        connect input to external.signal;",
  ].join("\n"));
  const before = JSON.stringify([...files]);
  const members = memberDetails(ix, system);
  assert.equal(members.length, 4);
  const ctrl = members.find((m) => m.name === "ctrl")!;
  assert.equal(ctrl.kind, "part");
  assert.equal(ctrl.typePath, controller, "typing resolves to the single reusable definition");
  assert.notEqual(ctrl.owner, ctrl.typePath, "the usage is not its definition note");
  assert.match(ctrl.head, /part ctrl/);
  assert.equal(ctrl.connections.length, 2, "both valid and unresolved explicit connections remain visible");
  assert.equal(ctrl.connections[0]!.thisEnd.text, "ctrl.signal");
  assert.equal(ctrl.connections[0]!.thisEnd.resolved, true, "typed port exists on the controller");
  assert.equal(ctrl.connections[1]!.thisEnd.text, "ctrl.absent");
  assert.equal(ctrl.connections[1]!.thisEnd.resolved, false, "nonexistent ports remain visible as unresolved");
  assert.equal(ctrl.connections[0]!.otherEnd.text, "input");
  assert.equal(ctrl.connections[0]!.otherEnd.resolved, true);
  const input = members.find((m) => m.name === "input")!;
  assert.deepEqual(input.connections.map((c) => c.kind), ["connect", "bind", "flow", "connect", "connect"]);
  assert.equal(input.connections[0]!.otherEnd.usage, "ctrl");
  assert.equal(input.connections[0]!.otherEnd.resolved, true);
  assert.equal(input.connections[3]!.otherEnd.resolved, false, "missing port must be called unresolved");
  assert.equal(input.connections[4]!.otherEnd.usage, null, "unmodeled external endpoint is not a fabricated usage");
  assert.equal(input.connections[4]!.otherEnd.path, null);
  assert.equal(members.find((m) => m.name === "missingType")?.connections.length, 0);
  assert.equal(memberDetails(ix, "absent.md").length, 0);
  assert.equal(JSON.stringify([...files]), before, "inspection never modifies model or vault notes");
});

test("member inspector preserves subsets, redefines and ambiguous names without guessing links", () => {
  const { ix, system } = fixture([
    "        port input;",
    "        port input;",
    "        port output;",
    "        connect input to output;",
  ].join("\n"));
  const members = memberDetails(ix, system);
  assert.equal(members.filter((m) => m.name === "input").length, 2);
  assert.ok(members.filter((m) => m.name === "input").every((m) => m.connections.length === 0),
    "two identical usage names must never be conflated into one member");
  assert.equal(members.find((m) => m.name === "output")?.connections[0]?.otherEnd.resolved, false);
});

test("member inspection reads owner-local statements and does not scan all notes", () => {
  const { ix, system } = fixture([
    "        part ctrl : __CONTROLLER__;",
    "        port p1;",
    "        connect p1 to ctrl.signal;",
  ].join("\n"));
  const forbidden = new Map(ix.notes);
  Object.defineProperty(forbidden, Symbol.iterator, {
    value: () => { throw new Error("Whole-vault iteration is not allowed for member navigation"); },
  });
  const isolated = { ...ix, notes: forbidden };
  assert.equal(memberDetails(isolated, system).find((m) => m.name === "ctrl")!.connections.length, 1);
  assert.ok(memberDetails(isolated, system).find((m) => m.name === "p1")!.connections.length === 1);
});

test("member Canvas shows explicit connect/bind/flow lines without inventing member notes", () => {
  const { files, ix, controller, system } = fixture([
    "        part ctrl : __CONTROLLER__;",
    "        port input;",
    "        port output;",
    "        connect input to ctrl.signal;",
    "        flow of Message from input to ctrl.signal;",
    "        flow of Message from ctrl.signal to output;",
    "        bind input = output;",
    "        connect input to ctrl.absent;",
  ].join("\n"));
  const before = JSON.stringify([...files]);
  const ctrl = memberDetails(ix, system).find((m) => m.name === "ctrl")!;
  const canvas = memberConnectionCanvas(ix, system, ctrl.key);
  const { nodes, edges } = canvas.doc;
  assert.equal(canvas.notes, 1, "only the owner is an actual model note");
  assert.equal(canvas.unresolved, 1);
  assert.equal(canvas.capped, false);
  assert.equal(edges.length, 4, "the chosen part participates in four explicit statements");
  assert.equal(nodes.filter((n) => n.type === "file").length, 1);
  assert.equal(nodes.find((n) => n.type === "file")?.file, system);
  assert.equal(nodes.filter((n) => n.type === "text").length, 5,
    "one selected member card and four distinct endpoint cards including direction-specific sides");
  assert.ok(nodes.every((n) => n.id.startsWith(MEMBER_CANVAS_PREFIX)));
  assert.ok(nodes.filter((n) => n.type === "text").every((n) => cardNotePath(n) === null),
    "member/endpoint cards must not masquerade as model note cards");
  assert.ok(nodes.find((n) => n.id.endsWith("selected"))?.text?.includes("part ctrl"));
  const flowIn = edges.find((e) => e.label?.includes("input → ctrl.signal"))!;
  const flowOut = edges.find((e) => e.label?.includes("ctrl.signal → output"))!;
  assert.ok(flowIn && flowOut);
  assert.equal(flowIn.toEnd, "arrow");
  assert.equal(flowOut.toEnd, "arrow");
  assert.equal(flowIn.toNode, MEMBER_CANVAS_PREFIX + "selected", "incoming flow retains native direction");
  assert.equal(flowOut.fromNode, MEMBER_CANVAS_PREFIX + "selected", "outgoing flow retains native direction");
  assert.equal(edges.filter((e) => e.toEnd === "none").length, 2, "connect and bind are not directional");
  assert.equal(edges.filter((e) => /unresolved/.test(e.label ?? "")).length, 1);
  assert.ok(nodes.some((n) => n.text?.includes("Endpoint: input") && n.type === "text"));
  assert.ok(nodes.some((n) => n.text?.includes("**Endpoint: input**") && n.color === "5"));
  assert.ok(edges.every((e) => nodes.some((n) => n.id === e.fromNode) && nodes.some((n) => n.id === e.toNode)));
  assert.equal(JSON.stringify([...files]), before, "member Canvas must never write to model files");
  assert.equal(ix.notes.size, 2, "no new notes or usages created");
  assert.throws(() => memberConnectionCanvas(ix, system, system + "|deleted"), /no longer exists/);
  assert.equal(memberDetails(ix, system).find((m) => m.name === "ctrl")!.typePath, controller);
});

test("member Canvas bounds large projections and preserves owner-only context", () => {
  const lines = ["        port p;", "        port q;"];
  for (let i = 0; i < 90; i++) lines.push("        connect p to q;");
  const { files, ix, system } = fixture(lines.join("\n"));
  const p = memberDetails(ix, system).find((m) => m.name === "p")!;
  const preview = memberConnectionCanvas(ix, system, p.key);
  assert.equal(preview.doc.edges.length, MEMBER_CANVAS_LIMIT);
  assert.equal(preview.capped, true);
  assert.equal(preview.doc.nodes.filter((n) => n.type === "file").length, 1);
  assert.equal(preview.doc.nodes.filter((n) => n.type === "text").length, 2,
    "multiple statements to one endpoint reuse the same visual card");
  assert.equal(preview.unresolved, 0);
  const expanded = memberConnectionCanvas(ix, system, p.key, 50);
  assert.equal(expanded.doc.edges.length, 50);
  assert.equal(expanded.doc.nodes.length, preview.doc.nodes.length);
  assert.ok(!files.has("Member Connections.canvas"), "the pure builder does not create a file");
  assert.equal(memberConnectionCanvas(ix, system, memberDetails(ix, system).find((m) => m.name === "q")!.key, 0).doc.edges.length, 0);
});
