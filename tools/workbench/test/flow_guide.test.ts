import test from "node:test";
import assert from "node:assert/strict";
import * as F from "../src/flows.ts";
import * as G from "../src/flow_guide.ts";

test("every flow has a guide, and every section of every flow has a goal and questions (no missing or stale keys)", () => {
  for (const d of F.flowDefs()) {
    const g = G.guideOf(d.id); assert.ok(g, `${d.id} has a guide`);
    assert.ok(g!.purpose && g!.start && g!.finish, `${d.id} purpose, start and finish`);
    const keys = F.flowSections(d).map((s) => s.key).filter((k) => k !== "driving-reason" && k !== "files-and-evidence");
    assert.deepEqual(Object.keys(g!.sections).sort(), [...keys].sort(), `${d.id} guide sections match the form`);
    for (const k of keys) { assert.ok(g!.sections[k]!.goal, `${d.id} ${k} goal`); assert.ok(g!.sections[k]!.ask.length, `${d.id} ${k} questions`); }
  }
});

test("a guide walks every section in order and names every field, required mark and table of the form", () => {
  for (const d of F.flowDefs()) {
    const text = G.renderGuide(d), secs = F.flowSections(d);
    assert.match(text, new RegExp(`^mdseGuide: ${d.id}$`, "m"));
    assert.match(text, new RegExp(`^generatedBy: ${G.GUIDE_MARK}$`, "m"));
    let at = 0;
    secs.forEach((s, i) => { const h = `\n## ${i + 1}. ${s.title}\n`; const p = text.indexOf(h); assert.ok(p > at, `${d.id} section ${s.title} in order`); at = p; });
    for (const s of secs) for (const b of s.blocks) {
      for (const f of b.fields ?? []) assert.ok(text.includes(`| ${f.label.replace(/\|/g, "\\|")} | ${f.req && f.kind !== "read" ? "Yes" : ""} |`), `${d.id} field ${f.label}`);
      if (b.t === "table" && b.title) assert.ok(text.includes(`**Table: ${b.title}**`), `${d.id} table ${b.title}`);
    }
  }
  const chg = G.renderGuide(F.flowDef("CHG")!);
  assert.match(chg, /\| Material \| Yes \| Choose: Aluminum 6061, .*\|/);
  assert.match(chg, /Shown only when the element type is mechanical/);
  assert.match(chg, /\| Affected part or assembly \| Yes \| Filled from the selected note; a change shows the old value\./);
  assert.match(chg, /Filled from the model: the parents that use the selected element\./);
  assert.equal(G.guidePath(F.flowDef("CHG")!), "99_System/07_Guides/Flows/Change flow guide.md");
});

test("the tool writes a guide when it is missing or an out-of-date generated copy, never over a hand-kept one", () => {
  const wanted = G.renderGuide(F.flowDef("RDL")!);
  assert.equal(G.guideNeedsWrite(undefined, wanted), true);
  assert.equal(G.guideNeedsWrite(wanted, wanted), false);
  assert.equal(G.guideNeedsWrite(wanted.replace("## 1. Driving reason", "## 1. Driving reason (old)"), wanted), true);
  assert.equal(G.guideNeedsWrite("# Our own redline guide\n", wanted), false);
  assert.equal(G.allGuides().size, 11);
});
