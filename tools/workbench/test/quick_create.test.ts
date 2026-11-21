import test from "node:test";
import assert from "node:assert/strict";
import { QUICK_TEMPLATES, quickTemplatesFor, quickTemplate, planPlainNote, contextLinkChoices, previewContextLinks } from "../src/quick_create.ts";
import { planAddElement, planAddRelationship } from "../src/edit.ts";
import { buildIndex } from "../src/index.ts";
import { buildBaseVault } from "../../base-vault/src/base_vault.ts";
import { classes } from "./harness.ts";

test("each MDSE workflow offers contextual, governed or ordinary creation templates", () => {
  for (const area of ["document", "define", "structure", "verify"] as const) {
    const available = quickTemplatesFor(area);
    assert.ok(available.length >= 3, area + " needs multiple useful creation choices");
    assert.ok(available.every((t) => t.area === area));
  }
  assert.equal(new Set(QUICK_TEMPLATES.map((x) => x.id)).size, QUICK_TEMPLATES.length, "template IDs unique");
  assert.equal(quickTemplate("meeting")?.kind, "plain");
  assert.equal(quickTemplate("requirement")?.type, "Requirement");
  assert.deepEqual(quickTemplatesFor("define").filter(t => ["design", "state"].includes(t.id)).map(t => [t.id, t.type, t.subtype]),
    [["design", "Condition", "design"], ["state", "Condition", "state"]]);
  assert.ok(quickTemplatesFor("verify").some(t => t.id === "verify-requirement" && t.type === "Requirement" && t.subtype === "functional"));
  assert.ok(quickTemplatesFor("define").some(t => t.id === "requirement"), "Define retains its Requirement action");
  assert.equal(quickTemplate("verification-case")?.subtype, "test");
  assert.equal(quickTemplate("unknown"), undefined);
  for (const t of QUICK_TEMPLATES.filter((x) => x.kind === "governed")) {
    const cls = classes[t.type! as keyof typeof classes];
    assert.ok(cls, t.id + " must use a governed class");
    assert.ok(!t.subtype || cls.subtype.includes(t.subtype), t.id + " must use an approved subtype");
  }
});

test("ordinary Markdown creation never assigns SysML or model identity", () => {
  const t = quickTemplate("meeting")!;
  const p = planPlainNote(t, "Engineering design review", "Documents/Meetings", new Set());
  assert.deepEqual(p.problems, []);
  assert.equal(p.writes[0]?.path, "Documents/Meetings/Engineering design review.md");
  const body = p.writes[0]!.after;
  assert.match(body, /^# Engineering design review\n/);
  assert.match(body, /## Agenda/);
  assert.match(body, /## Actions/);
  assert.doesNotMatch(body, /uid:|id:|## SysML v2|status: Draft/);
  assert.equal(planPlainNote(t, "Journal", "", new Set()).writes[0]?.path, "Journal.md");
  assert.ok(planPlainNote(t, "Engineering design review", "Documents/Meetings",
    new Set(["documents/meetings/engineering design review.md"])).problems.length);
  for (const [name, folder] of [["../unsafe", "Docs"], ["test", "../outside"], ["a/b", "Docs"], ["", "Docs"]]) {
    assert.ok(planPlainNote(t, name, folder, new Set()).problems.length, "reject " + name + " in " + folder);
  }
  assert.ok(planPlainNote(quickTemplate("requirement")!, "Not plain", "", new Set()).problems.length);
});

test("governed contextual creation uses the existing ID, UID and SysML writer", () => {
  const ix = buildIndex(new Map());
  for (const id of ["stakeholder-need", "use-case", "requirement", "function", "design", "state", "verify-requirement", "part", "interface",
    "verification-case", "test-plan", "test-procedure", "governed-document"]) {
    const t = quickTemplate(id)!;
    const p = planAddElement(ix, classes, { type: t.type!, subtype: t.subtype ?? "", title: "Example",
      folder: "Draft", author: "skellyspencer", now: new Date("2026-11-20T12:30:00") });
    assert.deepEqual(p.problems, [], id);
    assert.equal(p.writes.length, 1);
    assert.match(p.writes[0]!.after, /^---\ntype: /);
    assert.match(p.writes[0]!.after, /\nuid: \d{17}skellyspencer\n/);
    if (["part", "interface", "requirement", "verify-requirement", "design", "state", "stakeholder-need", "function", "use-case", "verification-case"].includes(id))
      assert.match(p.writes[0]!.after, /## SysML v2/, id + " must generate native SysML");
    if (id === "design" || id === "state")
      assert.match(p.writes[0]!.after, /state def Example;/, id + " must use a state definition, not invent a DesignDefinition");
    if (id === "verify-requirement")
      assert.match(p.writes[0]!.after, /requirement def Example;/, "Verify requirement uses the native requirement writer");
  }
});

test("Base Vault ships plain note templates matching the quick-create catalog", () => {
  const vault = buildBaseVault({ root: process.cwd(), release: "test", classes, plugins: [] });
  for (const t of QUICK_TEMPLATES.filter((x) => x.kind === "plain")) {
    const file = vault["99_System/05_Templates/Template - " + t.label + ".md"];
    assert.ok(file, "base vault must ship " + t.label);
    assert.ok(file!.includes("<% tp.file.title %>"));
    assert.ok(!file!.includes("## SysML v2") && !file!.includes("uid:"));
    for (const section of t.sections ?? []) assert.ok(file!.includes("## " + section));
  }
});

test("contextual creation does not create SysML relationships without a separate approved plan", () => {
  const author = "skellyspencer", now = new Date("2026-11-20T12:30:00");
  const original = new Map<string, string>();
  const parent = planAddElement(buildIndex(original, { classes }), classes,
    { type: "Requirement", subtype: "functional", title: "Output safe", folder: "20_Model", author, now });
  assert.deepEqual(parent.problems, []);
  const source = parent.writes[0]!;
  original.set(source.path, source.after);
  const child = planAddElement(buildIndex(original, { classes }), classes,
    { type: "Verification", subtype: "test", title: "Output safe test", folder: "70_Verify", author, now });
  assert.deepEqual(child.problems, []);
  const added = child.writes[0]!;
  assert.equal(child.writes.length, 1, "creation only writes its own new file");
  assert.equal(original.get(source.path), source.after, "creation planning never modifies the selected parent");
  assert.deepEqual(contextLinkChoices(buildIndex(original, { classes }), original, source.path, added.path), [],
    "uncommitted new notes have no writable relationship choices");

  const saved = new Map(original); saved.set(added.path, added.after);
  const ix = buildIndex(saved, { classes }), snapshot = new Map(saved);
  const choices = contextLinkChoices(ix, saved, source.path, added.path);
  assert.ok(choices.length, "saving the note enables independent relationship proposals");
  const verify = choices.find((c) => c.rel === "verify");
  assert.ok(verify, "verification case to requirement has native verify available");
  assert.equal(verify!.from, added.path, "the direction must be from verification to requirement");
  assert.equal(verify!.to, source.path);
  assert.ok(!choices.some((c) => c.rel === "verify" && c.from === source.path),
    "invalid reverse verification direction is not shown");
  assert.deepEqual(saved, snapshot, "listing proposals does not edit the vault");

  const link = planAddRelationship(ix, saved, { rel: verify!.rel, from: verify!.from, to: verify!.to });
  assert.deepEqual(link.problems, []);
  assert.equal(link.writes.length, 1, "relationship approval writes separately");
  assert.equal(link.writes[0]!.path, added.path, "the native statement is owned by the verification note");
  assert.notEqual(link.writes[0]!.after, saved.get(added.path));
  assert.equal(saved.get(added.path), added.after, "even relationship preview makes no edit until Apply");

  const plain = planPlainNote(quickTemplate("meeting")!, "Test meeting", "Documents", new Set(saved.keys()));
  saved.set(plain.writes[0]!.path, plain.writes[0]!.after);
  assert.deepEqual(contextLinkChoices(buildIndex(saved, { classes }), saved, source.path, plain.writes[0]!.path), [],
    "ordinary Markdown is not silently promoted to a governed model relationship");
  assert.deepEqual(contextLinkChoices(ix, saved, source.path, source.path), [], "self links are not proposed");
});

test("pre-create context preview inspects a virtual governed note and never writes relationships", () => {
  const author = "skellyspencer", now = new Date("2026-11-20T12:30:00");
  const files = new Map<string, string>();
  const parent = planAddElement(buildIndex(files, { classes }), classes, {
    type: "Requirement", subtype: "functional", title: "Safety threshold",
    folder: "20_Model", author, now,
  });
  assert.deepEqual(parent.problems, []);
  files.set(parent.writes[0]!.path, parent.writes[0]!.after);
  const origin = parent.writes[0]!.path;
  const ix = buildIndex(files, { classes });
  const child = planAddElement(ix, classes, {
    type: "Verification", subtype: "test", title: "Safety threshold verification",
    folder: "70_Verify", author, now,
  });
  const frozen = [...files.entries()];
  const proposals = previewContextLinks(ix, files, origin, child);
  assert.equal(proposals.createdPath, child.writes[0]!.path);
  assert.ok(proposals.choices.length > 0);
  assert.equal(proposals.choices[0]!.rel, "verify", "a native verify relationship is emphasized over generic dependencies");
  const verifies = proposals.choices.filter((c) => c.rel === "verify");
  assert.equal(verifies.length, 1);
  assert.equal(verifies[0]!.from, child.writes[0]!.path);
  assert.equal(verifies[0]!.to, origin);
  assert.deepEqual([...files.entries()], frozen, "in-memory preview does not change vault file contents");
  assert.equal(ix.notes.has(child.writes[0]!.path), false, "the original model index is not mutated");
  assert.ok(!files.has(child.writes[0]!.path), "preview does not create the note");
  assert.deepEqual(child.writes.map((w) => w.path), [child.writes[0]!.path],
    "the creation plan contains no link writes");

  const repeated = previewContextLinks(ix, files, origin, child);
  assert.deepEqual(repeated, proposals, "repeated preview stays deterministic with the same plan and files");
  const noScan = new Map(files);
  Object.defineProperty(noScan, Symbol.iterator, { value: () => { throw new Error("Full-vault scan is forbidden in a modal preview"); } });
  assert.deepEqual(previewContextLinks(ix, noScan, origin, child), proposals,
    "pre-create preview reads only the two relevant notes and does not iterate the complete vault");
  assert.deepEqual(previewContextLinks(ix, files, "", child).choices, [], "no selected governed source, no link proposals");
  assert.deepEqual(previewContextLinks(ix, files, origin,
    { writes: [], problems: ["invalid"] }).choices, [], "invalid creation plan gives no proposals");
  const existing = new Map(files); existing.set(child.writes[0]!.path, child.writes[0]!.after);
  assert.deepEqual(previewContextLinks(ix, existing, origin, child).choices, [],
    "a note already in the file map must not be treated as hypothetical");
  const plain = planPlainNote(quickTemplate("meeting")!, "Safety meeting", "Documents", new Set(files.keys()));
  assert.deepEqual(previewContextLinks(ix, files, origin, plain).choices, [],
    "ordinary Markdown cannot acquire a native SysML relationship in creation preview");
});
