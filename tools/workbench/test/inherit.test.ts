import test from "node:test";
import assert from "node:assert/strict";
import { buildIndex } from "../src/index.ts";
import { inheritedMembers } from "../src/views.ts";
import { classes } from "./harness.ts";

const note = (id: string, title: string, sym: string, body: string): string => `---\ntype: Object\nsubtype: part\nid: ${id}\nuid: u${id}\nstatus: Draft\nsourceRole: authoritative-model\nprimarySymbol: ${sym}\n---\n# ${title}\n\n## SysML v2\n\n\`\`\`sysml\n${body}\n\`\`\`\n`;
const vault = new Map<string, string>([
  ["M/Port.md", note("OBJ-1", "Port", "OBJ_1::Pd", "package OBJ_1 {\n port def Pd;\n}")],
  ["M/General.md", note("OBJ-2", "General", "OBJ_2::General", "package OBJ_2 {\n part def General {\n  port gp : OBJ_1::Pd;\n  part gpart : OBJ_3::Child;\n }\n}")],
  ["M/Child.md", note("OBJ-3", "Child", "OBJ_3::Child", "package OBJ_3 {\n part def Child {\n  port cp : OBJ_1::Pd;\n  part leaf : OBJ_6::Leaf;\n }\n}")],
  ["M/Special.md", note("OBJ-4", "Special", "OBJ_4::Special", "package OBJ_4 {\n part def Special :> OBJ_2::General {\n  port sp : OBJ_1::Pd;\n  part c : OBJ_3::Child;\n }\n}")],
  ["M/Sub.md", note("OBJ-5", "Sub", "OBJ_5::Sub", "package OBJ_5 {\n part def Sub :> OBJ_4::Special {\n  port subp : OBJ_1::Pd;\n }\n}")],
  ["M/Leaf.md", note("OBJ-6", "Leaf", "OBJ_6::Leaf", "package OBJ_6 {\n part def Leaf {\n  port lp : OBJ_1::Pd;\n }\n}")],
  ["M/Asm.md", note("OBJ-7", "Asm", "OBJ_7::Asm", "package OBJ_7 {\n part def Asm {\n  port ap : OBJ_1::Pd;\n  part s : OBJ_4::Special;\n }\n}")],
]);
const ix = buildIndex(vault, { classes });
const names = (m: ReturnType<typeof inheritedMembers>): string[] => m.map((x) => `${x.kind} ${x.route ? x.route + "." : ""}${x.name} <${x.from}:${ix.notes.get(x.source)!.title}>`).sort();

test("nothing is inherited unless a direction is asked for (D-0101)", () => { assert.deepEqual(inheritedMembers(ix, "M/Special.md", []), []); });

test("from general: the members of every note it specializes, nearest first", () => {
  assert.deepEqual(names(inheritedMembers(ix, "M/Sub.md", ["general"])), ["part c <general:Special>", "part gpart <general:General>", "port gp <general:General>", "port sp <general:Special>"]);
  const d = inheritedMembers(ix, "M/Sub.md", ["general"]); assert.equal(d.find((x) => x.name === "sp")!.depth, 1); assert.equal(d.find((x) => x.name === "gp")!.depth, 2);
});

test("from specific: the members of the notes that specialize it", () => {
  assert.deepEqual(names(inheritedMembers(ix, "M/General.md", ["specific"])), ["port sp <specific:Special>", "port subp <specific:Sub>", "part c <specific:Special>"].sort());
});

test("from parent: the members of the assemblies it is a part of", () => {
  assert.deepEqual(names(inheritedMembers(ix, "M/Special.md", ["parent"])), ["part s <parent:Asm>", "port ap <parent:Asm>"]);
});

test("from child: the members of its parts, rolled up through the layers, with the route through the parts", () => {
  assert.deepEqual(names(inheritedMembers(ix, "M/Asm.md", ["child"])), ["part s.c <child:Special>", "part s.c.leaf <child:Child>", "port s.c.cp <child:Child>", "port s.c.leaf.lp <child:Leaf>", "port s.sp <child:Special>"]);
});

test("specialization and assembly are separate, and both ways can be asked at once; a name the note has is not repeated", () => {
  const both = inheritedMembers(ix, "M/Special.md", ["general", "specific", "parent", "child"]);
  assert.deepEqual([...new Set(both.map((x) => x.from))].sort(), ["child", "general", "parent", "specific"]);
  assert.ok(!both.some((x) => x.from === "general" && x.name === "sp"), "its own port sp is not inherited");
  assert.ok(both.some((x) => x.from === "child" && x.route === "c" && x.name === "cp"), "the port of its part c is rolled up as c.cp");
  assert.ok(both.some((x) => x.from === "child" && x.route === "c.leaf" && x.name === "lp"), "...and a layer further down");
});

test("a specialization cycle does not loop", () => {
  const v = new Map(vault); v.set("M/General.md", note("OBJ-2", "General", "OBJ_2::General", "package OBJ_2 {\n part def General :> OBJ_5::Sub {\n  port gp : OBJ_1::Pd;\n }\n}"));
  const x = buildIndex(v, { classes }); assert.ok(inheritedMembers(x, "M/Sub.md", ["general", "specific"]).length > 0);
});

import { internalCanvas } from "../src/canvas.ts";
import { lensTables } from "../src/views.ts";

test("the internal canvas draws inherited ports on the note's edge and inherited parts inside it, marked with their direction (D-0101)", () => {
  const plain = internalCanvas(ix, "M/Special.md").doc.nodes;
  assert.ok(!plain.some((n) => n.color === "6"), "nothing is inherited unless asked");
  const d = internalCanvas(ix, "M/Special.md", ["general", "parent"]).doc.nodes, box = d[0]!;
  assert.match(box.text!, /· \d+ inherited/);
  const gp = d.find((n) => n.id.startsWith("ip") && /gp : Port.*from general/.test(n.text!))!; assert.equal(gp.color, "6"); assert.match(gp.text!, /↑ from general · \[\[M\/General\|General\]\]/);
  assert.ok(Math.abs(gp.x + gp.width / 2 - box.x) < 1 || Math.abs(gp.x + gp.width / 2 - (box.x + box.width)) < 1, "on the edge of the note's card");
  const gpart = d.find((n) => n.id.startsWith("ic") && n !== box && /gpart/.test(n.text!))!; assert.equal(gpart.color, "6");
  assert.ok(gpart.x >= box.x && gpart.y >= box.y && gpart.x + gpart.width <= box.x + box.width && gpart.y + gpart.height <= box.y + box.height, "inside the note's card");
  assert.ok(d.some((n) => /↑ from parent assembly · \[\[M\/Asm\|Asm\]\]/.test(n.text!)), "assembly members are marked as such");
  assert.ok(!d.some((n) => n.text === "_no port_" && n.x < box.x + 1 && n.y < box.y + 1), "no placeholder when ports are inherited");
});

test("the Internal lens lists inherited members in separate tables for specialization and assembly", () => {
  const ts = lensTables(ix, "internal", "M/Special.md", { inherit: ["general", "child"] });
  const spec = ts.find((t) => t.id === "inherit-spec")!, asm = ts.find((t) => t.id === "inherit-asm")!;
  assert.ok(spec && asm); assert.ok(spec.rows.every((r) => r.dir === "from general")); assert.ok(asm.rows.every((r) => r.dir === "from child part"));
  assert.ok(!lensTables(ix, "internal", "M/Special.md", { inherit: ["general"] }).some((t) => t.id === "inherit-asm"));
  assert.ok(!lensTables(ix, "internal", "M/Special.md", {}).some((t) => t.id.startsWith("inherit")));
});
