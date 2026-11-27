import test from "node:test";
import assert from "node:assert/strict";
import { buildIndex } from "../src/index.ts";
import * as F from "../src/flows.ts";
import * as D from "../src/flow_db.ts";
import * as FU from "../src/flows_ui.ts";
import { loadSqlJsNode } from "../../core/src/sqljs_node.ts";
import { classes } from "./harness.ts";

const SQL = await loadSqlJsNode();
const fm = (o: Record<string, string>): string => Object.entries(o).map(([k, v]) => `${k}: ${v}`).join("\n");
const part = (id: string, pn: string): string => `---\n${fm({ type: "Object", subtype: "part", id, uid: "u" + id, status: "Draft", partNumber: pn, revision: "A01" })}\n---\n# ${pn}\n`;
const files = (): Map<string, string> => new Map([["P/SCR-1.md", part("OBJ-00010", "SCR-1")], ["P/BRK-1.md", part("OBJ-00011", "BRK-1")]]);
const AUTHOR = "SkellySpencer", NOW = new Date(2026, 10, 26, 16, 0, 0, 0);
const def = (id: string): F.FlowDef => F.flowDef(id)!;
const submitted = (d: F.FlowDef, r: F.FlowRecord): F.FlowRecord => {
  r.vals["rs.type"] = "Issue or defect"; r.vals["rs.stmt"] = "Synthetic"; r.vals["rs.econo"] = "ECO-00001";
  const x = F.submitSection(d, r, "driving-reason", AUTHOR, NOW); assert.ok("rec" in x); return x.rec;
};
const save = (f: Map<string, string>, d: F.FlowDef, r: F.FlowRecord): void => { f.set(F.flowPath(r.flowId), F.renderFlowNote(d, r)); };

test("the index is rebuilt from the flow records: flows, sections, events, approvals and claims", () => {
  const f = files(), ix = buildIndex(f, { classes }), db = D.openWorkbenchDb(SQL);
  const chg = submitted(def("CHG"), F.startFlow(def("CHG"), ix, "P/SCR-1.md", AUTHOR, NOW, []));
  chg.rows["appr"]![0]!["a"] = "Mech Lead";
  save(f, def("CHG"), chg);
  const iss = submitted(def("ISS"), F.startFlow(def("ISS"), ix, "P/SCR-1.md", AUTHOR, NOW, [chg]));
  save(f, def("ISS"), iss);
  assert.equal(D.rebuildFlowIndex(db, f), 2);
  assert.deepEqual(db.all("SELECT flow_id, status, sections_submitted, eco, started FROM flows ORDER BY flow_id"), [
    { flow_id: "CHG-2611-0001", status: "open", sections_submitted: 1, eco: "ECO-00001", started: NOW.toISOString() },
    { flow_id: "ISS-2611-0001", status: "open", sections_submitted: 1, eco: "ECO-00001", started: NOW.toISOString() }]);
  assert.equal(db.all("SELECT * FROM events").length, 4);
  assert.deepEqual(D.openFlowsOn(db, "P/SCR-1.md", chg.guid).map((x) => x.flow_id), ["ISS-2611-0001"], "the other open flow on the same part");
  assert.deepEqual(D.awaitingApproval(db, "mech lead").map((x) => x.flow_id), ["CHG-2611-0001"]);
  assert.deepEqual(D.flowsInEco(db, "ECO-00001").length, 2);
  // a record removed from the vault leaves the index on the next rebuild
  f.delete(F.flowPath(iss.flowId));
  D.rebuildFlowIndex(db, f);
  assert.deepEqual(D.openFlowsOn(db, "P/SCR-1.md").map((x) => x.flow_id), ["CHG-2611-0001"]);
});

test("drafts survive a rebuild and a reopened file; a never-submitted flow is listed as a draft", () => {
  const f = files(), ix = buildIndex(f, { classes }), db = D.openWorkbenchDb(SQL);
  const r = F.startFlow(def("RDL"), ix, "P/BRK-1.md", AUTHOR, NOW, []);
  r.vals["d.summary"] = "Typed but not submitted";
  D.saveDraft(db, r, NOW);
  D.rebuildFlowIndex(db, f);
  const again = D.openWorkbenchDb(SQL, db.export());
  assert.equal(again.opened, "opened");
  assert.equal(D.loadDraft(again, r.guid)!.rec.vals["d.summary"], "Typed but not submitted");
  assert.deepEqual(D.unsavedDrafts(again).map((x) => x.guid), [r.guid]);
  save(f, def("RDL"), submitted(def("RDL"), r));
  D.rebuildFlowIndex(again, f);
  assert.deepEqual(D.unsavedDrafts(again), [], "once a record exists, the draft is not listed as unsaved");
});

test("reopening a record restores newer unsaved edits from this computer, and drops older ones", () => {
  const f = files(), ix = buildIndex(f, { classes }), db = D.openWorkbenchDb(SQL);
  const d = def("ISS"), rec = submitted(d, F.startFlow(d, ix, "P/SCR-1.md", AUTHOR, NOW, []));
  save(f, d, rec);
  const store: FU.FlowStore = {
    saveDraft: (x) => D.saveDraft(db, x, new Date(NOW.getTime() + 60_000)), loadDraft: (g) => D.loadDraft(db, g), removeDraft: (g) => D.removeDraft(db, g),
    unsaved: () => D.unsavedDrafts(db), openOn: (e, x) => D.openFlowsOn(db, e, x),
  };
  const host = { files: () => f, author: () => AUTHOR, applyPlan: async () => ({ message: "", undo: async () => "" }), store };
  const edited: F.FlowRecord = JSON.parse(JSON.stringify(rec)); edited.vals["d.title"] = "Edited after the submit";
  store.saveDraft(edited);
  assert.equal(FU.openFlowRecord(F.flowPath(rec.flowId), host), "");
  assert.equal(FU.currentFlow()!.rec.vals["d.title"], "Edited after the submit");
  D.saveDraft(db, edited, new Date(NOW.getTime() - 60_000));            // older than the record's last event
  assert.equal(FU.openFlowRecord(F.flowPath(rec.flowId), host), "");
  assert.equal(FU.currentFlow()!.rec.vals["d.title"] ?? "", "");
  assert.equal(D.loadDraft(db, rec.guid), null, "a stale draft is removed");
  FU.closeFlow();
});
