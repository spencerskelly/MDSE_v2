import test from "node:test";
import assert from "node:assert/strict";
import { buildIndex } from "../src/index.ts";
import { internalCanvas, refreshCanvas, autoLayout, cardAction, cardNotePath, isInternalId, MAX_PARTS } from "../src/canvas.ts";
import type { CanvasDoc, CanvasNode } from "../src/canvas.ts";
import { classes } from "./harness.ts";

const note = (id: string, title: string, sym: string, body: string): string => `---\ntype: Object\nsubtype: part\nid: ${id}\nuid: u${id}\nstatus: Draft\nsourceRole: authoritative-model\nprimarySymbol: ${sym}\n---\n# ${title}\n\n## SysML v2\n\n\`\`\`sysml\n${body}\n\`\`\`\n`;
const vault = (charger: string): Map<string, string> => new Map([
  ["Models/Charger.md", note("OBJ-1", "Charger", "OBJ_1::Charger", `package OBJ_1 {\n part def Charger {\n${charger}\n }\n}`)],
  ["Models/Board.md", note("OBJ-2", "Board", "OBJ_2::Board", "package OBJ_2 {\n part def Board {\n  port pout : OBJ_4::DcPort;\n  port ctl : OBJ_4::DcPort;\n }\n}")],
  ["Models/Cable.md", note("OBJ-3", "Cable", "OBJ_3::Cable", "package OBJ_3 {\n part def Cable {\n  port pin : OBJ_4::DcPort;\n  port pthru : OBJ_4::DcPort;\n }\n}")],
  ["Models/DcPort.md", note("OBJ-4", "DcPort", "OBJ_4::DcPort", "package OBJ_4 {\n port def DcPort;\n}")],
  ["Models/Lid.md", note("OBJ-5", "Lid", "OBJ_5::Lid", "package OBJ_5 {\n part def Lid {\n }\n}")],
]);
const full = "  port dcOut : OBJ_4::DcPort;\n  part board : OBJ_2::Board;\n  part cable : OBJ_3::Cable;\n  part lid : OBJ_5::Lid;\n  connect board.pout to cable.pin;\n  bind dcOut = cable.pthru;";
const ix = buildIndex(vault(full), { classes });
const r = internalCanvas(ix, "Models/Charger.md"), d = r.doc;
const byId = (id: string): CanvasNode => d.nodes.find((n) => n.id === id)!;
const container = d.nodes[0]!, cards = d.nodes.filter((n) => /^ic\d+$/.test(n.id) && n !== container), ports = d.nodes.filter((n) => /^ip\d+$/.test(n.id));
const partCard = (name: string): CanvasNode => cards.find((n) => n.text!.startsWith(`**[[Models/${name}|`) || n.text!.startsWith(`**[[Models/${name}|`))!;
const inside = (a: CanvasNode, o: CanvasNode): boolean => a.x >= o.x && a.y >= o.y && a.x + a.width <= o.x + o.width && a.y + a.height <= o.y + o.height;

test("the note is one large card with each part as a card inside it (D-0097)", () => {
  assert.equal(container.id, "ic0"); assert.match(container.text!, /^\*\*\[\[Models\/Charger\|Charger\]\]\*\*/);
  assert.equal(cards.length, 3, "one card per part");
  for (const c of cards) assert.ok(inside(c, container), `${c.text} is inside the note's card`);
  assert.equal(cardNotePath(partCard("Board")), "Models/Board.md", "a typed part's card is its type's note, so clicking it selects that note");
  assert.equal(r.saveFolder, "Models", "Save offers the folder of the object first");
  assert.equal(r.fileName, "Internal - Charger.canvas");
  assert.ok(isInternalId(container.id) && isInternalId("ip3") && isInternalId("iw0") && !isInternalId("n3") && !isInternalId("a2"));
});

test("every port is a small card on the edge of the card that owns it, half in and half out (D-0097)", () => {
  const owners = [container, ...cards];
  for (const p of ports) {
    const o = owners.find((q) => (Math.abs(p.x + p.width / 2 - q.x) < 1 || Math.abs(p.x + p.width / 2 - (q.x + q.width)) < 1) && p.y >= q.y && p.y + p.height <= q.y + q.height);
    assert.ok(o, `port "${p.text}" sits on a left or right edge of one card`);
  }
  assert.equal(ports.length, 1 + 2 + 2 + 1, "dcOut, Board 2, Cable 2, Lid's placeholder");
  const text = (n: CanvasNode) => n.text!;
  assert.ok(ports.some((p) => /dcOut : DcPort/.test(text(p)) && /\[\[Models\/DcPort\|/.test(text(p))), "a typed port links its port definition");
  const bp = (name: string, owner: CanvasNode) => ports.find((p) => text(p).includes(name) && Math.abs(p.y - owner.y) < owner.height && p.x + p.width / 2 >= owner.x - 1 && p.x + p.width / 2 <= owner.x + owner.width + 1)!;
  assert.ok(bp("pout", partCard("Board")) && bp("pthru", partCard("Cable")));
  for (let i = 0; i < ports.length; i++) for (let j = i + 1; j < ports.length; j++) { const a = ports[i]!, b = ports[j]!; assert.ok(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y, "no two ports overlap"); }
});

test("an object with no port gets a placeholder port, so every object has at least one; nothing is written (D-0097)", () => {
  const lid = partCard("Lid"), mine = ports.filter((p) => p.y >= lid.y && p.y + p.height <= lid.y + lid.height && (Math.abs(p.x + p.width / 2 - lid.x) < 1 || Math.abs(p.x + p.width / 2 - (lid.x + lid.width)) < 1));
  assert.equal(mine.length, 1); assert.equal(mine[0]!.text, "_no port_");
  assert.equal(r.placeholders, 1, "only the Lid lacked a port");
  const bare = internalCanvas(buildIndex(vault("  part lid : OBJ_5::Lid;"), { classes }), "Models/Charger.md");
  assert.equal(bare.placeholders, 2, "the note itself and the Lid");
  assert.ok(bare.doc.nodes.filter((n) => n.text === "_no port_").length === 2);
  const none = internalCanvas(buildIndex(vault(""), { classes }), "Models/Charger.md");
  assert.equal(none.doc.nodes.filter((n) => /^ip/.test(n.id)).length, 1, "a note with no parts still has one port");
});

test("wires are lines between port cards; binds and connects have no arrowhead, flows do", () => {
  assert.equal(d.edges.length, 2); assert.equal(r.unresolved, 0);
  const ends = d.edges.map((e) => [byId(e.fromNode).text, byId(e.toNode).text]);
  assert.ok(ends.some(([a, b]) => /pout/.test(a!) && /pin/.test(b!)), "connect board.pout to cable.pin joins those two port cards");
  assert.ok(ends.some(([a, b]) => /dcOut/.test(a!) && /pthru/.test(b!)), "bind dcOut = cable.pthru joins the note's port to the cable's");
  assert.ok(d.edges.every((e) => e.toEnd === "none" && /^iw\d+$/.test(e.id)));
  const withFlow = internalCanvas(buildIndex(vault(full + "\n  flow of OBJ_4::DcPort from board.pout to cable.pin;"), { classes }), "Models/Charger.md");
  assert.ok(withFlow.doc.edges.some((e) => e.toEnd === "arrow"));
  const broken = internalCanvas(buildIndex(vault(full + "\n  connect board.nope to cable.pin;"), { classes }), "Models/Charger.md");
  assert.equal(broken.unresolved, 1, "a wire to a port that does not exist is counted, not drawn");
});

test("parts a wire joins are three card widths apart, other parts one (D-0096 inside a note)", () => {
  const b = partCard("Board"), c = partCard("Cable"), l = partCard("Lid");
  assert.equal(c.x - (b.x + b.width), 3 * 280, "Board and Cable are joined");
  assert.ok(l.y > b.y, "the Lid is on the next row");
  assert.equal(l.y - Math.max(b.y + b.height, c.y + c.height), 90, "no wire to the Lid, so one height below the row above");
});

test("Refresh, Auto-layout and Collapse leave an internal canvas as it is", () => {
  const pos = JSON.stringify(d.nodes.map((n) => [n.id, n.x, n.y, n.width, n.height, n.text]));
  const f = refreshCanvas(d, ix); assert.equal(f.redrawn, 0); assert.equal(JSON.stringify(f.doc.nodes.map((n) => [n.id, n.x, n.y, n.width, n.height, n.text])), pos);
  const a = autoLayout(d, ix); assert.equal(a.moved, 0); assert.equal(JSON.stringify(a.doc.nodes.map((n) => [n.id, n.x, n.y, n.width, n.height, n.text])), pos);
  for (const kind of ["toggle", "collapseAll", "collapseLayer", "expandAll"] as const) assert.equal(cardAction(d, ix, "Models/Board.md", kind).action, "none", kind);
});

test("a missing note gives an empty canvas, and a very large definition is capped", () => {
  assert.equal(internalCanvas(ix, "Nope.md").doc.nodes.length, 0);
  const many = Array.from({ length: MAX_PARTS + 5 }, (_, i) => `  part p${i} : OBJ_5::Lid;`).join("\n");
  const big = internalCanvas(buildIndex(vault(many), { classes }), "Models/Charger.md");
  assert.equal(big.capped, true); assert.equal(big.doc.nodes.filter((n) => /^ic\d+$/.test(n.id)).length, MAX_PARTS + 1);
});

test("Objects with no port are counted on the dashboard and in Review, as a low item, not an error (D-0097)", async () => {
  const { dashboard, reviewQueue } = await import("../src/views.ts");
  const d1 = dashboard(buildIndex(vault(full), { classes }));
  assert.equal(d1.noPort, 2, "the Lid and the port definition DcPort have no port of their own");
  const q = reviewQueue(buildIndex(vault(full), { classes })).filter((i) => i.category === "objects-without-port");
  assert.equal(q.length, 1); assert.equal(q[0]!.severity, "low"); assert.match(q[0]!.message, /^2 objects have no port/);
});
