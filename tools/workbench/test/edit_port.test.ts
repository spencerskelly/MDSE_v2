import test from "node:test";
import assert from "node:assert/strict";
import MDSE from "../../core/src/mdse_core.js";
import { buildIndex } from "../src/index.ts";
import type { ModelIndex } from "../src/index.ts";
import * as P from "../src/edit_port.ts";
import type { EditPlan } from "../src/edit.ts";
import { classes } from "./harness.ts";

const uids = new Set<string>();
const mk = (id: string, title: string, subtype: string, body: string): [string, string] => {
  const type = id.startsWith("IFLOW") ? "Item Flow" : "Object";
  const pkg = id.replace(/-/g, "_"), uid = `20260101000000${String(uids.size).padStart(3, "0")}skellyspencer`;
  uids.add(uid);
  return [`Model/${title}.md`, `---\ntype: ${type}\nsubtype: ${subtype}\nid: ${id}\nuid: ${uid}\nstatus: Draft\ntags: []\nsourceRole: authoritative-model\nprimarySymbol: ${pkg}::${title}\n---\n# ${title}\n\n\n\n${MDSE.renderSysmlSection(`package ${pkg} {\n${body}\n}\n`)}`];
};
const files = new Map<string, string>([
  mk("IFLOW-00001", "Current", "energy", "    item def Current;"),
  mk("OBJ-00002", "DcPort", "electrical", "    port def DcPort {\n        out item flowOut : IFLOW_00001::Current;\n        in attribute sense;\n    }"),
  mk("OBJ-00003", "CtlPort", "electrical", "    port def CtlPort;"),
  mk("OBJ-00004", "DcLink", "interface", "    interface def DcLink {\n        end supplier : OBJ_00002::DcPort;\n        end consumer : ~OBJ_00002::DcPort;\n    }"),
  mk("OBJ-00005", "Charger", "part", "    part def Charger {\n        port dcOut : OBJ_00002::DcPort;\n    }"),
  mk("OBJ-00006", "Battery", "part", "    part def Battery {\n        port dcIn : ~OBJ_00002::DcPort;\n        port ctl : OBJ_00003::CtlPort;\n    }"),
  mk("OBJ-00007", "Station", "part", "    part def Station {\n        part charger : OBJ_00005::Charger;\n        part battery : OBJ_00006::Battery;\n    }"),
]);
const build = (f: Map<string, string>): ModelIndex => buildIndex(f, { classes });
const apply = (f: Map<string, string>, p: EditPlan): Map<string, string> => { assert.deepEqual(p.problems, []); const m = new Map(f); for (const w of p.writes) m.set(w.path, w.after); return m; };
const ix0 = build(files);
const S = "Model/Station.md", D = "Model/DcPort.md";
const sym = (t: string): string => [...ix0.notes.values()].find((n) => n.title === t)!.def!.symbol;

test("the fixture vault scans clean", () => { for (const n of ix0.notes.values()) { assert.deepEqual(n.warnings, [], n.title); assert.deepEqual(n.issues, [], n.title); } });

test("a port definition gets directed features, validated", () => {
  const add = (o: Partial<P.PortSpec>) => P.planPortAdd(ix0, files, D, { kind: "feature", name: "x", ...o });
  const ok = add({ memberKind: "item", dir: "inout", type: sym("Current"), name: "bus", mult: "2", ordered: true });
  assert.match(ok.writes[0]!.after, /inout item bus : IFLOW_00001::Current\[2\] ordered;/);
  const ix2 = build(apply(files, ok));
  assert.deepEqual(ix2.notes.get(D)!.warnings, []);
  assert.deepEqual(ix2.notes.get(D)!.def!.usages.map((u) => u.name), ["flowOut", "sense", "bus"]);
  assert.match(add({ memberKind: "attribute", dir: "out", name: "voltage", type: "ISQ::VoltageValue" }).writes[0]!.after, /out attribute voltage : ISQ::VoltageValue;/);
  assert.match(add({ memberKind: "port", name: "sub", type: sym("CtlPort"), conj: true }).writes[0]!.after, /port sub : ~OBJ_00003::CtlPort;/);
  assert.match(add({ memberKind: "item", name: "flowOut" }).problems[0]!, /already a member/);
  assert.match(add({ memberKind: "port", name: "p" }).problems[0]!, /Pick the port definition/);
  assert.match(add({ memberKind: "port", name: "p", type: sym("Current") }).problems[0]!, /must be a port def/);
  assert.match(add({ memberKind: "item", name: "p", dir: "sideways" }).problems[0]!, /not in, out or inout/);
  assert.match(add({ memberKind: "port", dir: "in", name: "p", type: sym("CtlPort") }).problems[0]!, /Only an item or attribute has a direction/);
  assert.match(add({ memberKind: "item", name: "p", mult: "many" }).problems[0]!, /not like 3/);
  assert.match(P.planPortAdd(ix0, files, S, { kind: "feature", name: "x" }).problems[0]!, /goes in port def/);
});

test("port usages: conjugation, quantity, modifiers, reference", () => {
  const p = P.planPortAdd(ix0, files, "Model/Charger.md", { kind: "port", name: "aux", type: sym("DcPort"), conj: true, mult: "0..1", nonunique: true });
  assert.match(p.writes[0]!.after, /port aux : ~OBJ_00002::DcPort\[0\.\.1\] nonunique;/);
  assert.match(P.planPortAdd(ix0, files, "Model/Charger.md", { kind: "port", name: "ext", type: sym("DcPort"), ref: true }).writes[0]!.after, /ref port ext : OBJ_00002::DcPort;/);
  assert.match(P.planPortAdd(ix0, files, "Model/Charger.md", { kind: "port", name: "dcOut", type: sym("DcPort") }).problems[0]!, /already a member/);
  assert.match(P.planPortAdd(ix0, files, "Model/DcLink.md", { kind: "port", name: "q", type: sym("DcPort") }).problems[0]!, /goes in part def or item def or port def/);
});

test("interface ends", () => {
  const p = P.planPortAdd(ix0, files, "Model/DcLink.md", { kind: "end", name: "tap", type: sym("DcPort"), conj: true, mult: "*" });
  assert.match(p.writes[0]!.after, /end tap : ~OBJ_00002::DcPort\[\*\];/);
  const ix2 = build(apply(files, p));
  assert.deepEqual(ix2.notes.get("Model/DcLink.md")!.def!.usages.map((u) => [u.name, !!u.end, !!u.conj]), [["supplier", true, false], ["consumer", true, true], ["tap", true, true]]);
});

test("connect: plain, connection and interface forms, with end bindings and conjugation checks", () => {
  const c = (o: Partial<P.PortSpec>) => P.planPortAdd(ix0, files, S, { kind: "connect", name: "", ...o });
  const plain = c({ a: "charger.dcOut", b: "battery.dcIn" });
  assert.match(plain.writes[0]!.after, /connect charger\.dcOut to battery\.dcIn;/);
  assert.deepEqual(plain.problems, []);
  const iface = c({ form: "interface", name: "link", def: sym("DcLink"), endA: "supplier", endB: "consumer", a: "charger.dcOut", b: "battery.dcIn" });
  assert.match(iface.writes[0]!.after, /interface link : OBJ_00004::DcLink connect supplier ::> charger\.dcOut to consumer ::> battery\.dcIn;/);
  const ix2 = build(apply(files, iface)), st = ix2.notes.get(S)!.def!.stmts.find((x) => x.kind === "connect")!;
  assert.deepEqual(ix2.notes.get(S)!.warnings, []);
  assert.deepEqual([st.form, st.name, st.endA, st.endB, st.a, st.b], ["interface", "link", "supplier", "consumer", "charger.dcOut", "battery.dcIn"]);
  assert.match(c({ form: "interface", def: sym("DcLink"), a: "charger.dcOut", b: "battery.dcIn" }).summary, /Ends taken in order: supplier, consumer/);
  assert.match(c({ form: "interface", def: sym("DcLink"), endA: "supplier", endB: "consumer", a: "battery.dcIn", b: "charger.dcOut" }).problems.join(), /battery\.dcIn" is conjugated.*end supplier is not conjugated/);
  assert.match(c({ form: "interface", def: sym("DcLink"), endA: "supplier", endB: "consumer", a: "charger.dcOut", b: "battery.ctl" }).problems.join(), /typed .*CtlPort, but end consumer is typed .*DcPort/);
  assert.match(c({ form: "connection", name: "w1", a: "charger", b: "battery" }).writes[0]!.after, /connection w1 connect charger to battery;/);
  assert.match(c({ form: "interface", a: "charger", b: "battery" }).problems.join(), /a part; an interface connects ports/);
  assert.match(c({ a: "charger.nope", b: "battery.dcIn" }).problems[0]!, /"nope" is not a member of Charger/);
  assert.match(c({ a: "charger.dcOut", b: "charger.dcOut" }).problems[0]!, /cannot be connected to itself/);
  assert.match(c({ endA: "x", endB: "y", a: "charger.dcOut", b: "battery.dcIn" }).problems[0]!, /need an interface or connection definition/);
  const same = P.planPortAdd(ix0, apply(files, P.planPortAdd(ix0, files, "Model/Battery.md", { kind: "port", name: "dcIn2", type: sym("DcPort") })), S, { kind: "connect", name: "", a: "charger.dcOut", b: "battery.dcIn" });
  assert.deepEqual(same.problems, []);
});

test("flows follow direction, and a conjugated port reverses it", () => {
  const f = (o: Partial<P.PortSpec>) => P.planPortAdd(ix0, files, S, { kind: "flow", name: "", ...o });
  const ok = f({ item: sym("Current"), a: "charger.dcOut.flowOut", b: "battery.dcIn.flowOut" });
  assert.deepEqual(ok.problems, []);
  assert.match(ok.writes[0]!.after, /flow of IFLOW_00001::Current from charger\.dcOut\.flowOut to battery\.dcIn\.flowOut;/);
  assert.match(f({ a: "charger.dcOut.sense", b: "battery.dcIn.sense" }).problems.join(), /"charger.dcOut.sense" is in: a flow starts at an out/);
  assert.match(f({ a: "battery.dcIn.flowOut", b: "charger.dcOut.flowOut" }).problems.join(), /is out after the port is conjugated|is out: a flow ends/);
  const good = f({ name: "send", item: sym("Current"), a: "charger.dcOut.flowOut", b: "battery.dcIn.flowOut" });
  assert.match(good.writes[0]!.after, /flow send of IFLOW_00001::Current from charger\.dcOut\.flowOut to battery\.dcIn\.flowOut;/);
  const ix2 = build(apply(files, P.planPortAdd(ix0, files, S, { kind: "flow", name: "send", item: sym("Current"), a: "battery.dcIn.sense", b: "charger.dcOut.sense" })));
  const st = ix2.notes.get(S)!.def!.stmts.find((x) => x.kind === "flow")!;
  assert.deepEqual([st.name, st.type, st.a, st.b], ["send", sym("Current"), "battery.dcIn.sense", "charger.dcOut.sense"]);
});

test("bind, replace and remove keep the block scanning clean", () => {
  const b = P.planPortAdd(ix0, files, S, { kind: "bind", name: "", a: "charger.dcOut", b: "battery.ctl" });
  assert.match(b.summary, /different types/);
  const f1 = apply(files, b), ix1 = build(f1);
  assert.deepEqual(ix1.notes.get(S)!.warnings, []);
  const head = "bind charger.dcOut = battery.ctl";
  assert.deepEqual(P.edSpecOfMember(ix1, S, head), { kind: "bind", name: "", a: "charger.dcOut", b: "battery.ctl" });
  const rp = P.planPortReplace(ix1, f1, S, head, { kind: "bind", name: "", a: "charger.dcOut", b: "battery.dcIn" });
  const f2 = apply(f1, rp);
  assert.match(f2.get(S)!, /bind charger\.dcOut = battery\.dcIn;/);
  assert.ok(!/battery\.ctl/.test(f2.get(S)!));
  const rm = apply(f2, P.planPortRemove(build(f2), f2, S, "bind charger.dcOut = battery.dcIn"));
  assert.deepEqual(build(rm).notes.get(S)!.warnings, []);
  assert.ok(!/bind /.test(rm.get(S)!));
  assert.match(P.planPortRemove(ix1, f1, S, "bind nothing = here").problems[0]!, /no longer in the note/);
  // replacing a port keeps its own name allowed; renaming onto another is refused
  const cs = P.edSpecOfMember(ix0, "Model/Battery.md", "port dcIn : ~OBJ_00002::DcPort")!;
  assert.deepEqual([cs.kind, cs.name, cs.conj], ["port", "dcIn", true]);
  const flipOff = P.planPortReplace(ix0, files, "Model/Battery.md", "port dcIn : ~OBJ_00002::DcPort", { ...cs, conj: false, mult: "2" });
  assert.match(flipOff.writes[0]!.after, /port dcIn : OBJ_00002::DcPort\[2\];/);
  assert.match(P.planPortReplace(ix0, files, "Model/Battery.md", "port dcIn : ~OBJ_00002::DcPort", { ...cs, name: "ctl" }).problems[0]!, /already a member/);
});

test("path choices list usages, their ports and the port features, with directions seen from the owner", () => {
  const ch = P.edFeaturePaths(ix0, ix0.notes.get(S)!.def!), by = (p: string) => ch.find((x) => x.path === p)!;
  assert.ok(by("charger.dcOut") && by("battery.dcIn.flowOut"));
  assert.equal(by("charger.dcOut.flowOut").dir, "out");
  assert.equal(by("battery.dcIn.flowOut").dir, "in");
  assert.equal(by("battery.dcIn").conj, true);
});
