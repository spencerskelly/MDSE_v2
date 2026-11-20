import test from "node:test";
import assert from "node:assert/strict";
import { buildIndex } from "../src/index.ts";
import { planAddElement } from "../src/edit.ts";
import { memberDetails } from "../src/member_nav.ts";
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
