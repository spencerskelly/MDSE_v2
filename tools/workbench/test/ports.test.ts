import test from "node:test";
import assert from "node:assert/strict";
import { scanSysml } from "../src/sysml_scan.ts";

const BLOCK = `package PWR {
    item def Current;
    port def DcPort {
        in item inCurrent : Current;
        out attribute voltage;
        inout port ctl : CtlPort [2] ordered;
    }
    port def CtlPort;
    interface def DcLink {
        end supplier : DcPort;
        end consumer : ~DcPort;
        flow of Current from supplier.inCurrent to consumer.inCurrent;
    }
    part def Charger {
        port dcOut : DcPort;
        port dcIn : ~DcPort [1..2];
        ref port ext : DcPort :> dcOut;
        port tap :>> dcOut;
    }
    part def Station {
        part charger : Charger;
        part battery : Charger;
        interface link : DcLink connect supplier ::> charger.dcOut to consumer ::> battery.dcIn;
        interface connect charger.dcOut to battery.dcIn;
        connection c1 : Wire connect charger.dcOut to battery.dcIn;
        connect charger.dcOut to battery.dcIn;
        flow of Current from charger.dcOut to battery.dcIn;
        bind charger.ext = battery.ext;
    }
}`;

test("port definitions keep their directed features; conjugated, reference, subsetting and redefining ports are structured", () => {
  const r = scanSysml(BLOCK), by = (n: string) => r.defs.find((d) => d.name === n)!;
  assert.deepEqual(r.warnings, []);
  const dc = by("DcPort");
  assert.deepEqual(dc.usages.map((u) => [u.kind, u.dir, u.name, u.type ?? "", u.mult ?? "", (u.mods ?? []).join("+")]), [["item", "in", "inCurrent", "Current", "", ""], ["attribute", "out", "voltage", "", "", ""], ["port", "inout", "ctl", "CtlPort", "[2]", "ordered"]]);
  const ch = by("Charger");
  assert.deepEqual(ch.usages.map((u) => [u.name, u.type ?? "", !!u.conj, u.mult ?? "", !!u.ref, (u.subsets ?? []).join(), (u.redefines ?? []).join()]),
    [["dcOut", "DcPort", false, "", false, "", ""], ["dcIn", "DcPort", true, "[1..2]", false, "", ""], ["ext", "DcPort", false, "", true, "dcOut", ""], ["tap", "", false, "", false, "", "dcOut"]]);
});

test("interface definitions keep their ends (one conjugated); connections keep form, definition and end names; flows and bindings are statements", () => {
  const r = scanSysml(BLOCK), by = (n: string) => r.defs.find((d) => d.name === n)!;
  const link = by("DcLink");
  assert.deepEqual(link.usages.map((u) => [u.kind, !!u.end, u.name, u.type, !!u.conj]), [["end", true, "supplier", "DcPort", false], ["end", true, "consumer", "DcPort", true]]);
  assert.deepEqual(link.stmts.map((s) => [s.kind, s.type, s.a, s.b]), [["flow", "Current", "supplier.inCurrent", "consumer.inCurrent"]]);
  const st = by("Station").stmts.map((s) => ({ k: s.kind, f: s.form, n: s.name, t: s.type, a: s.a, b: s.b, ea: s.endA, eb: s.endB }));
  assert.deepEqual(st, [
    { k: "connect", f: "interface", n: "link", t: "DcLink", a: "charger.dcOut", b: "battery.dcIn", ea: "supplier", eb: "consumer" },
    { k: "connect", f: "interface", n: undefined, t: undefined, a: "charger.dcOut", b: "battery.dcIn", ea: undefined, eb: undefined },
    { k: "connect", f: "connection", n: "c1", t: "Wire", a: "charger.dcOut", b: "battery.dcIn", ea: undefined, eb: undefined },
    { k: "connect", f: "plain", n: undefined, t: undefined, a: "charger.dcOut", b: "battery.dcIn", ea: undefined, eb: undefined },
    { k: "flow", f: undefined, n: undefined, t: "Current", a: "charger.dcOut", b: "battery.dcIn", ea: undefined, eb: undefined },
    { k: "bind", f: undefined, n: undefined, t: undefined, a: "charger.ext", b: "battery.ext", ea: undefined, eb: undefined },
  ]);
});

test("relations may follow the multiplicity: `port a : P[2] :> q;`", () => {
  const r = scanSysml(`package X { part def A { port a : P[2] :> q; port b : P :> q [2] ordered; end e : ~P[3] :>> z; } }`);
  assert.deepEqual(r.defs[0]!.usages.map((u) => [u.name, u.type, u.mult, (u.subsets ?? []).join(), (u.redefines ?? []).join(), !!u.conj, (u.mods ?? []).join()]),
    [["a", "P", "[2]", "q", "", false, ""], ["b", "P", "[2]", "q", "", false, "ordered"], ["e", "P", "[3]", "", "z", true, ""]]);
});
