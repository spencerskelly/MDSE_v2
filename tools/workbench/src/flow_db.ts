/* The Workbench database (D-0170): flow tracking for this user, in `.mdse/workbench.db` (never committed).
 * Everything except `drafts` is rebuilt from the flow records in `_ops/Flows` (WKB-077); drafts are this computer's
 * unsaved edits between submits. Dates are derived from the recorded events: started = first submit, completed = the
 * flow's last `completed` event (decisions record of 2026-11-26). */
import { MdseDb } from "../../core/src/mdse_db.ts";
import type { SqlStatic } from "../../core/src/mdse_db.ts";
import type { DbSchema } from "../../core/src/mdse_db.ts";
import type { FlowRecord } from "./flows.ts";
import * as F from "./flows.ts";

export const WB_DB_PATH = ".mdse/workbench.db";
export const WB_DB_SCHEMA: DbSchema = {
  name: "mdse-workbench", version: 1,
  tables: [
    { name: "flows", columns: ["guid TEXT PRIMARY KEY", "flow_id TEXT", "flow TEXT", "name TEXT", "status TEXT", "pick TEXT", "pick_title TEXT", "author TEXT",
      "created TEXT", "started TEXT", "completed TEXT", "eco TEXT", "reason_type TEXT", "record_path TEXT", "sections_total INTEGER", "sections_submitted INTEGER", "schema_version INTEGER"] },
    { name: "sections", columns: ["guid TEXT", "key TEXT", "title TEXT", "state TEXT", "submitted_at TEXT", "submitted_by TEXT", "hash TEXT"], constraints: ["PRIMARY KEY (guid, key)"] },
    { name: "events", columns: ["guid TEXT", "seq INTEGER", "at TEXT", "by_user TEXT", "ev TEXT", "section TEXT"], constraints: ["PRIMARY KEY (guid, seq)"] },
    { name: "approvals", columns: ["guid TEXT", "seq INTEGER", "role TEXT", "who TEXT", "needed TEXT", "decision TEXT", "note TEXT"], constraints: ["PRIMARY KEY (guid, seq)"] },
    { name: "claims", columns: ["guid TEXT", "element TEXT", "why TEXT"], constraints: ["PRIMARY KEY (guid, element)"] },
    { name: "drafts", kept: true, columns: ["guid TEXT PRIMARY KEY", "flow_id TEXT", "flow TEXT", "pick_title TEXT", "saved_at TEXT", "author TEXT", "json TEXT"] },
  ],
  indexes: ["CREATE INDEX IF NOT EXISTS claims_element ON claims (element)", "CREATE INDEX IF NOT EXISTS approvals_who ON approvals (who)"],
};

export function openWorkbenchDb(SQL: SqlStatic, bytes?: Uint8Array | null): MdseDb { return new MdseDb(SQL, WB_DB_SCHEMA, bytes); }

/** Rebuild every derived table from the flow records in the working tree. Returns the number of flows indexed. */
export function rebuildFlowIndex(db: MdseDb, files: Map<string, string>): number {
  const recs = F.listFlows(files);
  db.tx(() => {
    db.clearDerived();
    for (const { path, rec } of recs) indexRecord(db, rec, path);
  });
  db.setMeta("rebuilt_at", new Date().toISOString());
  return recs.length;
}
function indexRecord(db: MdseDb, rec: FlowRecord, path: string): void {
  const def = F.flowDef(rec.flow); if (!def) return;
  const secs = F.flowSections(def).filter(F.submittable);
  const started = rec.events.find((e) => e.ev === "section_submitted")?.at ?? "";
  const completed = rec.status === "complete" ? ([...rec.events].reverse().find((e) => e.ev === "completed")?.at ?? "") : "";
  db.put("flows", { guid: rec.guid, flow_id: rec.flowId, flow: rec.flow, name: def.name, status: rec.status, pick: rec.pick, pick_title: rec.pickTitle, author: rec.author,
    created: rec.created, started, completed, eco: rec.vals["rs.econo"] ?? "", reason_type: rec.vals["rs.type"] ?? "", record_path: path,
    sections_total: secs.length, sections_submitted: secs.filter((s) => F.sectionState(def, rec, s) === "submitted").length, schema_version: rec.schema });
  for (const s of secs) {
    const sub = rec.sub[s.key];
    db.put("sections", { guid: rec.guid, key: s.key, title: s.title, state: F.sectionState(def, rec, s), submitted_at: sub?.at ?? null, submitted_by: sub?.by ?? null, hash: sub?.hash ?? null });
  }
  rec.events.forEach((e, i) => db.put("events", { guid: rec.guid, seq: i, at: e.at, by_user: e.by, ev: e.ev, section: e.section ?? null }));
  // Approver tables: Change (d: discipline, a: approver, n: needed) and Review and approve (fn, who, dec, note).
  let seq = 0;
  for (const r of rec.rows["appr"] ?? []) {
    const role = r["d"] ?? r["fn"] ?? "", who = (r["a"] ?? r["who"] ?? "").trim();
    if (!who) continue;
    db.put("approvals", { guid: rec.guid, seq: seq++, role, who, needed: r["n"] ?? "Yes", decision: r["dec"] ?? (rec.vals["rel.dec"] || rec.vals["a.final"] || "Pending"), note: r["note"] ?? "" });
  }
  // Claims: the element the flow works on, and the parents a Change says it includes (advisory, decisions record §3).
  if (rec.pick) db.put("claims", { guid: rec.guid, element: rec.pick, why: "works on" });
}

/* ---- drafts (kept: not in the vault) ---- */
export function saveDraft(db: MdseDb, rec: FlowRecord, now = new Date()): void {
  db.put("drafts", { guid: rec.guid, flow_id: rec.flowId, flow: rec.flow, pick_title: rec.pickTitle, saved_at: now.toISOString(), author: rec.author, json: JSON.stringify(rec) });
}
export function loadDraft(db: MdseDb, guid: string): { rec: FlowRecord; savedAt: string } | null {
  const r = db.one<{ json: string; saved_at: string }>("SELECT json, saved_at FROM drafts WHERE guid = ?", [guid]);
  if (!r) return null;
  try { return { rec: JSON.parse(r.json) as FlowRecord, savedAt: r.saved_at }; } catch { return null; }
}
export function removeDraft(db: MdseDb, guid: string): void { db.run("DELETE FROM drafts WHERE guid = ?", [guid]); }
/** Drafts of flows that have no record yet (never submitted). */
export function unsavedDrafts(db: MdseDb): Array<{ guid: string; label: string; savedAt: string }> {
  return db.all<{ guid: string; flow_id: string; flow: string; pick_title: string; saved_at: string }>(
    "SELECT d.guid, d.flow_id, d.flow, d.pick_title, d.saved_at FROM drafts d LEFT JOIN flows f ON f.guid = d.guid WHERE f.guid IS NULL ORDER BY d.saved_at DESC")
    .map((r) => ({ guid: r.guid, savedAt: r.saved_at, label: `${r.flow_id} · ${F.flowDef(r.flow)?.name ?? r.flow}${r.pick_title ? " · " + r.pick_title : ""} (draft, not submitted)` }));
}

/* ---- queries the folder of notes cannot answer quickly ---- */
export interface FlowRow { guid: string; flow_id: string; name: string; status: string; pick: string; pick_title: string; record_path: string; sections_submitted: number; sections_total: number; author: string }
export function openFlowsOn(db: MdseDb, element: string, exceptGuid = ""): FlowRow[] {
  return db.all<FlowRow>("SELECT f.* FROM flows f JOIN claims c ON c.guid = f.guid WHERE c.element = ? AND f.status <> 'complete' AND f.guid <> ? ORDER BY f.created DESC", [element, exceptGuid]);
}
export function awaitingApproval(db: MdseDb, who: string): FlowRow[] {
  return db.all<FlowRow>("SELECT DISTINCT f.* FROM flows f JOIN approvals a ON a.guid = f.guid WHERE lower(a.who) = lower(?) AND a.decision = 'Pending' AND a.needed <> 'No' ORDER BY f.created", [who]);
}
export function flowsInEco(db: MdseDb, eco: string): FlowRow[] { return db.all<FlowRow>("SELECT * FROM flows WHERE eco = ? ORDER BY created", [eco]); }
export function recentFlows(db: MdseDb, limit = 25): FlowRow[] { return db.all<FlowRow>("SELECT * FROM flows ORDER BY created DESC LIMIT ?", [limit]); }
/** Start and end of each flow, from its events (for later reporting; not shown per person by default). */
export function flowDates(db: MdseDb, guid: string): { started: string; completed: string } | null {
  return db.one<{ started: string; completed: string }>("SELECT started, completed FROM flows WHERE guid = ?", [guid]);
}
