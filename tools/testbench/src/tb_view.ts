/* The Testbench screen (D-0170): Plan (test cases, the Test plan flow, runs in progress, evidence search) and Run (one
 * run, step by step, with evidence from the phone, the capture inbox or a dropped file). Plain DOM; vault strings as text.
 * The host (the Obsidian shell) does file and network access; this file holds the screen and its state. */
import { h } from "./dom.ts";
import type { Child } from "./dom.ts";
import type { ModelIndex, Note } from "../../workbench/src/index.ts";
import type { EditPlan } from "../../workbench/src/edit.ts";
import type { MdseDb } from "../../core/src/mdse_db.ts";
import type { PairSession, PairUpload } from "./tb_pair.ts";
import * as R from "./tb_run.ts";
import * as D from "./tb_db.ts";
import { summarizeCsv } from "./tb_csv.ts";
import * as FU from "../../workbench/src/flows_ui.ts";
import { authorName } from "../../workbench/src/flows.ts";

export interface TbSettings { reportFolder: string; inboxFolder: string; keepOriginals: boolean; port: number; minutes: number; testedBy: string }
export interface InboxFile { name: string; path: string; size: number; mtime: number }
export interface TbHost {
  ix(): ModelIndex | null; files(): Map<string, string>; author(): string; settings(): TbSettings; db(): MdseDb | null;
  open(path: string): void;
  applyPlan(plan: EditPlan): Promise<{ message: string; undo: () => Promise<string> }>;
  /** create a binary file in the vault (folders made as needed); a taken name gets a number. Returns the path written. */
  writeEvidence(path: string, bytes: Uint8Array): Promise<string>;
  sha256(bytes: Uint8Array): Promise<string>;
  saveDbLater(): void;
  /** files in the capture inbox newer than `since` (ms); null when no inbox is set or it cannot be read */
  inbox(since: number): Promise<InboxFile[] | null>;
  inboxRead(f: InboxFile): Promise<Uint8Array>;
  /** start a phone capture session (desktop only); the host keeps at most one open */
  pair?(label: string, onFile: (u: PairUpload) => Promise<string>): Promise<PairSession>;
  qr?(text: string): string;
  /** a displayable URL for a vault image (thumbnails) */
  resourceUrl?(path: string): string;
  /** the model note last opened in Obsidian, for starting a test plan from it */
  selected(): string;
  /** open a flow's guide note (D-0171) */
  openGuide?(def: import("../../workbench/src/flows.ts").FlowDef, heading?: string): Promise<void>;
}

export const TB_STYLE = `
.mdtb{font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--text-normal,#1d2330);padding:12px 16px;max-width:1100px;margin:0 auto;--line:var(--background-modifier-border,#d7dbe3);--bg2:var(--background-secondary,#f4f5f7);--acc:var(--interactive-accent,#2557d6);--mut:var(--text-muted,#5b6475)}
.mdtb .top{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}.mdtb .top h2{margin:0 12px 0 0;font-size:20px}
.mdtb button{cursor:pointer}.mdtb .tab{padding:6px 14px;border:1px solid var(--line);border-radius:999px;background:var(--bg2)}.mdtb .tab[aria-pressed=true]{background:var(--acc);color:#fff;border-color:var(--acc)}
.mdtb .msg{border:1px solid var(--line);border-radius:8px;padding:6px 10px;margin:6px 0;background:var(--bg2);display:flex;gap:8px;align-items:center}
.mdtb .card{border:1px solid var(--line);border-radius:10px;padding:12px;margin:10px 0}.mdtb .card h3{margin:0 0 8px;font-size:16px}
.mdtb .mut{color:var(--mut);font-size:12.5px}.mdtb .err{color:#b3261e}.mdtb .okc{color:#1b7a3a}
.mdtb table{border-collapse:collapse;width:100%;font-size:13px}.mdtb th,.mdtb td{border-top:1px solid var(--line);padding:4px 6px;text-align:left;vertical-align:top}
.mdtb .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}.mdtb label.f{display:block;font-size:12px;color:var(--mut);margin-bottom:2px}
.mdtb input[type=text],.mdtb input[type=date],.mdtb select,.mdtb textarea{width:100%;box-sizing:border-box;font-size:14px}.mdtb textarea{min-height:52px}
.mdtb .chips{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}.mdtb .chip{min-width:34px;padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--bg2);font-weight:600}
.mdtb .chip.Pass{background:#e7f5ec;border-color:#9fd3b1;color:#1b7a3a}.mdtb .chip.Fail{background:#fde8e6;border-color:#f0a59d;color:#b3261e}.mdtb .chip.NA{background:#eef0f4;color:var(--mut)}.mdtb .chip.cur{outline:3px solid var(--acc)}
.mdtb .step{border:2px solid var(--acc);border-radius:12px;padding:14px;margin:10px 0}.mdtb .step .act{font-size:17px;font-weight:600;margin:4px 0 8px}
.mdtb .res{display:flex;gap:8px;margin:10px 0}.mdtb .res button{flex:1;padding:14px;font-size:17px;font-weight:700;border-radius:10px;border:2px solid var(--line);background:var(--bg2)}
.mdtb .res button[aria-pressed=true].Pass{background:#1b7a3a;color:#fff;border-color:#1b7a3a}.mdtb .res button[aria-pressed=true].Fail{background:#b3261e;color:#fff;border-color:#b3261e}.mdtb .res button[aria-pressed=true].NA{background:#5b6475;color:#fff;border-color:#5b6475}
.mdtb .meas{display:grid;grid-template-columns:2fr 1fr;gap:8px}.mdtb .meas input{font-size:18px;padding:8px}
.mdtb .ev{border:2px dashed var(--line);border-radius:10px;padding:10px;margin-top:10px}.mdtb .ev.drag{border-color:var(--acc);background:var(--bg2)}
.mdtb .evb{display:flex;gap:8px;flex-wrap:wrap}.mdtb .evb button{padding:12px 16px;font-size:15px;font-weight:600;border-radius:10px;border:1px solid var(--acc);background:var(--background-primary,#fff);color:var(--acc)}
.mdtb .thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px}.mdtb .thumb{border:1px solid var(--line);border-radius:8px;padding:6px;font-size:12px}
.mdtb .thumb img{width:100%;height:110px;object-fit:cover;border-radius:6px;background:#eee}.mdtb .thumb .ic{height:110px;display:flex;align-items:center;justify-content:center;background:var(--bg2);border-radius:6px;font-size:28px}
.mdtb .pair{display:flex;gap:16px;align-items:center;border:2px solid var(--acc);border-radius:12px;padding:12px;margin:10px 0;background:var(--bg2)}.mdtb .pair img{width:180px;height:180px;image-rendering:pixelated;background:#fff;border-radius:8px}
.mdtb .nav{display:flex;gap:8px;justify-content:space-between;margin-top:10px}.mdtb .nav button,.mdtb .pri{padding:10px 18px;font-size:15px;border-radius:10px}
.mdtb .pri{background:var(--acc);color:#fff;border:0;font-weight:600}.mdtb .bar{position:sticky;top:0;z-index:2;background:var(--background-primary,#fff);padding:6px 0;border-bottom:1px solid var(--line)}
`;

type Mode = "plan" | "run";
interface State { mode: Mode; run: R.RunRecord | null; step: number; all: boolean; msg: string; undo: (() => Promise<string>) | null; filter: string; evq: string; pair: PairSession | null; pairStep: number; inbox: InboxFile[] | null; inboxSince: number; ignored: Set<string>; busy: boolean; planFlow: boolean }

export function mountTestbench(root: HTMLElement, host: TbHost): { refresh(): void; openRun(path: string): string; destroy(): void } {
  const S: State = { mode: "plan", run: null, step: 1, all: false, msg: "", undo: null, filter: "", evq: "", pair: null, pairStep: 0, inbox: null, inboxSince: Date.now(), ignored: new Set(), busy: false, planFlow: false };
  const style = h("style"); style.textContent = TB_STYLE + FU.FLOW_STYLE;
  const wrap = h("div", { class: "mdtb" });
  root.replaceChildren(style, wrap);
  let draftTimer: ReturnType<typeof setTimeout> | null = null, inboxTimer: ReturnType<typeof setInterval> | null = null, flowEl: HTMLElement | null = null;

  const say = (m: string, u: (() => Promise<string>) | null = null): void => { S.msg = m; S.undo = u; draw(); };
  const touched = (): void => {
    const db = host.db(), run = S.run; if (!db || !run) return;
    if (draftTimer) clearTimeout(draftTimer);
    draftTimer = setTimeout(() => { draftTimer = null; D.saveRunDraft(db, run); host.saveDbLater(); }, 600);
  };
  const scrollKeep = (fn: () => void): void => { let e: HTMLElement | null = wrap.parentElement; while (e && e.scrollHeight <= e.clientHeight) e = e.parentElement; const t = e?.scrollTop ?? 0; fn(); if (e) e.scrollTop = t; };
  function draw(): void { scrollKeep(() => wrap.replaceChildren(...[top(), S.msg ? msgBar() : null, S.mode === "plan" ? planView() : runView()].filter((x): x is HTMLElement => !!x))); }
  // Typing never rebuilds the screen (that would lose focus or swallow the next click); buttons and menus redraw.

  function top(): HTMLElement {
    return h("div", { class: "top" }, h("h2", {}, "Testbench"),
      h("button", { class: "tab", "aria-pressed": S.mode === "plan" ? "true" : "false", onclick: () => { S.mode = "plan"; draw(); } }, "Plan"),
      h("button", { class: "tab", "aria-pressed": S.mode === "run" ? "true" : "false", onclick: () => { S.mode = "run"; draw(); } }, S.run ? `Run ${S.run.runId}` : "Run"),
      h("span", { class: "mut" }, host.db() ? "" : "Database unavailable: runs are not kept between sessions until it loads."));
  }
  function msgBar(): HTMLElement {
    return h("div", { class: "msg" }, h("span", {}, S.msg), S.undo ? h("button", { onclick: async () => { const u = S.undo!; S.undo = null; try { say(await u()); } catch (e) { say("Undo failed: " + String((e as Error)?.message ?? e)); } } }, "Undo") : null,
      h("button", { onclick: () => { S.msg = ""; S.undo = null; draw(); }, "aria-label": "Dismiss" }, "×"));
  }

  /* ---- Plan ---- */
  function planView(): HTMLElement {
    const ix = host.ix(), db = host.db(), out = h("div", {});
    if (!ix) { out.append(h("div", { class: "card" }, "Reading the vault…")); return out; }
    // the Test plan flow (D-0169), hosted here because validation owns the plan
    out.append(h("div", { class: "card" }, h("h3", {}, "Test plan"),
      h("div", { class: "mut" }, "Build or reopen a test plan with the Test plan flow. Select a test case or ECO note in Obsidian first if the plan starts from one."),
      h("div", { class: "evb", style: "margin-top:8px" },
        h("button", { onclick: () => { const err = FU.beginFlow("TPL", ix, host.selected(), flowHost()); if (err) say(err); else { S.planFlow = true; flowEl = null; draw(); } } }, "New test plan"),
        ...FU.flowMenu(host.files()).open.filter((o) => o.label.startsWith("TPL-")).slice(0, 6).map((o) => h("button", { onclick: () => { const err = FU.openFlowRecord(o.path, flowHost()); if (err) say(err); else { S.planFlow = true; flowEl = null; draw(); } } }, o.label))),
      S.planFlow && FU.currentFlow() ? (flowEl ??= FU.flowView({ getIx: () => host.ix(), host: flowHost(), open: (p) => host.open(p), done: (m, u) => { if (!FU.currentFlow()) { S.planFlow = false; flowEl = null; } say(m, u); } })) : null));
    // runs in progress on this computer
    const drafts = db ? D.draftRuns(db) : [];
    if (drafts.length) out.append(h("div", { class: "card" }, h("h3", {}, "Runs in progress on this computer"), h("table", {}, h("tbody", {}, ...drafts.map((d) => h("tr", {},
      h("td", {}, h("b", {}, d.run_id)), h("td", {}, d.case_title), h("td", { class: "mut" }, `saved ${d.saved_at.slice(0, 16).replace("T", " ")}${d.saved ? "" : " · not yet in the vault"}`),
      h("td", {}, h("button", { class: "pri", onclick: () => { const r = D.loadRunDraft(db!, d.guid); if (r) { setRun(r.run); } } }, "Resume"))))))));
    // test cases
    const stats = db ? D.caseStats(db) : new Map<string, D.CaseStats>();
    const q = S.filter.toLowerCase(), cases = R.testCases(ix).filter(({ note, requirements }) => !q || [note.title, note.id, note.subtype, ...requirements.map((r) => r.id + " " + r.title)].join(" ").toLowerCase().includes(q));
    const fi = h("input", { type: "text", placeholder: "Filter test cases by name, ID, method or requirement, then Enter", "aria-label": "Filter test cases" }) as HTMLInputElement;
    fi.value = S.filter; fi.addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter") { S.filter = fi.value; draw(); } }); fi.addEventListener("change", () => { S.filter = fi.value; });
    out.append(h("div", { class: "card" }, h("h3", {}, `Test cases (${cases.length})`), fi,
      cases.length ? h("table", { style: "margin-top:8px" }, h("thead", {}, h("tr", {}, ...["Test case", "Method", "Verifies", "Runs", "Last result", ""].map((x) => h("th", {}, x)))),
        h("tbody", {}, ...cases.slice(0, 300).map(({ note, requirements }) => { const st = stats.get(note.path); return h("tr", {},
          h("td", {}, h("a", { href: "#", onclick: (e: Event) => { e.preventDefault(); host.open(note.path); } }, note.title), h("div", { class: "mut" }, note.id)),
          h("td", {}, note.subtype || "—"), h("td", {}, requirements.map((r) => r.id || r.title).join(", ") || h("span", { class: "mut" }, "none linked")),
          h("td", {}, String(st?.runs ?? 0)),
          h("td", {}, st ? h("a", { href: "#", class: st.last_result === "Pass" ? "okc" : st.last_result === "Fail" ? "err" : "", onclick: (e: Event) => { e.preventDefault(); host.open(st.last_report); } }, `${st.last_result || "in progress"} · ${st.last_date}`) : "—"),
          h("td", {}, h("button", { class: "pri", onclick: () => startRun(note) }, "Start run"))); })))
      : h("div", { class: "mut", style: "margin-top:8px" }, "No Verification notes match. Create test cases in the Workbench (Verify → + New… → Verification case).")));
    // evidence search
    if (db) {
      const ei = h("input", { type: "text", placeholder: "Search evidence: caption, file, test case or unit serial, then Enter", "aria-label": "Search evidence" }) as HTMLInputElement;
      ei.value = S.evq; ei.addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter") { S.evq = ei.value; draw(); } }); ei.addEventListener("change", () => { S.evq = ei.value; });
      const hits = S.evq ? D.findEvidence(db, S.evq) : [];
      out.append(h("div", { class: "card" }, h("h3", {}, "Find evidence"), ei, S.evq ? h("table", { style: "margin-top:8px" }, h("tbody", {}, ...(hits.length ? hits.slice(0, 60).map((x) => h("tr", {},
        h("td", {}, h("a", { href: "#", onclick: (e: Event) => { e.preventDefault(); host.open(x.file); } }, x.file.slice(x.file.lastIndexOf("/") + 1))), h("td", {}, x.caption), h("td", {}, x.kind),
        h("td", {}, h("a", { href: "#", onclick: (e: Event) => { e.preventDefault(); host.open(x.report_path); } }, `${x.run_id} step ${x.step || "setup"}`)))) : [h("tr", {}, h("td", { class: "mut" }, "Nothing found."))]))) : null));
    }
    return out;
  }
  function flowHost(): FU.FlowHost { const fh: FU.FlowHost = { files: () => host.files(), author: () => host.author(), applyPlan: (p) => host.applyPlan(p) }; if (host.openGuide) fh.openGuide = host.openGuide; return fh; }
  function startRun(c: Note): void {
    const author = host.author(); if (!author) { say("Register your author code first: a run is signed with it."); return; }
    const runs = R.listRuns(host.files()).map((x) => x.run), db = host.db();
    const inDb = db ? D.draftRuns(db).map((d) => ({ runId: d.run_id })) : [];
    const testedBy = host.settings().testedBy || authorName(host.files(), author);
    const run = R.startRun(host.ix(), c.path, author, new Date(), [...runs, ...inDb as R.RunRecord[]], host.settings().reportFolder, testedBy);
    setRun(run); touched();
  }
  function setRun(run: R.RunRecord): void { S.run = run; S.mode = "run"; S.step = 1; S.inboxSince = Date.now() - 10 * 60_000; S.ignored.clear(); void closePair(); draw(); pollInbox(); }

  /* ---- Run ---- */
  function runView(): HTMLElement {
    const run = S.run, out = h("div", {});
    if (!run) { out.append(h("div", { class: "card" }, "No run open. Start one from a test case in Plan, or resume a run in progress.")); return out; }
    const c = R.stepCounts(run), probs = R.runProblems(run, today()), saved = host.files().has(R.runReportPath(run));
    out.append(h("div", { class: "bar" },
      h("div", { style: "display:flex;gap:10px;align-items:center;flex-wrap:wrap" }, h("b", { style: "font-size:17px" }, run.runId), h("a", { href: "#", onclick: (e: Event) => { e.preventDefault(); host.open(run.casePath); } }, run.caseTitle || "(no case)"),
        h("span", { class: "mut" }, `${run.status} · ${c.pass} pass · ${c.fail} fail · ${c.na} n/a · ${c.open} to do · ${run.attachments.length} evidence file${run.attachments.length === 1 ? "" : "s"}`),
        h("span", { style: "flex:1" }),
        saved ? h("button", { onclick: () => host.open(R.runReportPath(run)) }, "Open report") : null,
        h("button", { onclick: () => void save("saved") }, "Save to vault"),
        h("button", { class: "pri", title: probs.length ? probs.join(" ") : "Write the report note", onclick: () => void save("submitted") }, run.status === "submitted" ? "Submit again" : "Submit report"),
        h("button", { onclick: () => { void closePair(); S.run = null; S.mode = "plan"; draw(); } }, "Close")),
      h("div", { class: "chips" }, h("button", { class: "chip" + (S.step === 0 ? " cur" : ""), onclick: () => { S.step = 0; S.all = false; draw(); } }, "Setup"),
        ...run.steps.map((s) => h("button", { class: `chip ${s.result === "N/A" ? "NA" : s.result}` + (S.step === s.n && !S.all ? " cur" : ""), title: s.action, onclick: () => { S.step = s.n; S.all = false; draw(); } }, String(s.n))),
        h("button", { class: "chip" + (S.step === -1 ? " cur" : ""), onclick: () => { S.step = -1; S.all = false; draw(); } }, "Conclusion"),
        h("label", { class: "mut", style: "margin-left:auto" }, cb(S.all, (v) => { S.all = v; draw(); }), " Show all steps"))));
    if (S.pair) out.append(pairCard());
    if (S.all) { out.append(setupCard(run)); for (const s of run.steps) out.append(stepCard(run, s)); out.append(conclusionCard(run)); }
    else if (S.step === 0) out.append(setupCard(run));
    else if (S.step === -1) out.append(conclusionCard(run));
    else { const s = run.steps.find((x) => x.n === S.step) ?? run.steps[0]; if (s) out.append(stepCard(run, s)); }
    if (probs.length) out.append(h("div", { class: "card" }, h("b", {}, "Before you submit"), h("ul", {}, ...probs.map((p) => h("li", { class: "err" }, p)))));
    return out;
  }
  const today = (): string => new Date().toISOString().slice(0, 10);
  function cb(v: boolean, on: (v: boolean) => void): HTMLElement { const e = h("input", { type: "checkbox", checked: v || undefined }) as HTMLInputElement; e.addEventListener("change", () => on(e.checked)); return e; }
  function txt(label: string, get: () => string, set: (v: string) => void, o: { area?: boolean; ph?: string; type?: string; big?: boolean } = {}): HTMLElement {
    const inp = (o.area ? h("textarea", { "aria-label": label, placeholder: o.ph ?? "" }) : h("input", { type: o.type ?? "text", "aria-label": label, placeholder: o.ph ?? "" })) as HTMLInputElement;
    inp.value = get(); inp.addEventListener("input", () => { set(inp.value); touched(); }); inp.addEventListener("change", () => { set(inp.value); touched(); });
    return h("div", {}, h("label", { class: "f" }, label), inp);
  }
  function setupCard(run: R.RunRecord): HTMLElement {
    const eq = h("table", {}, h("thead", {}, h("tr", {}, h("th", {}, "Equipment"), h("th", {}, "ID"), h("th", {}, "Calibration due"), h("th", {}, ""))),
      h("tbody", {}, ...run.equipment.map((e, i) => h("tr", {},
        h("td", {}, txt("Name", () => e.name, (v) => { e.name = v; })), h("td", {}, txt("Asset ID", () => e.id, (v) => { e.id = v; })),
        h("td", {}, txt("Due", () => e.calDue, (v) => { e.calDue = v; }, { type: "date" }), e.calDue && e.calDue < today() ? h("div", { class: "err" }, "Calibration overdue") : null),
        h("td", {}, h("button", { onclick: () => { run.equipment.splice(i, 1); touched(); draw(); } }, "×"))))));
    return h("div", { class: "card" }, h("h3", {}, "Unit and setup"),
      h("div", { class: "grid" }, txt("Unit serial number *", () => run.unit.serial, (v) => { run.unit.serial = v; }), txt("Hardware rev *", () => run.unit.hw, (v) => { run.unit.hw = v; }),
        txt("Firmware version *", () => run.unit.fw, (v) => { run.unit.fw = v; }), txt("Test date *", () => run.date, (v) => { run.date = v; }, { type: "date" }),
        txt("Tested by *", () => run.testedBy, (v) => { run.testedBy = v; }), txt("Test plan flow ID", () => run.plan, (v) => { run.plan = v; }, { ph: "TPL-…" })),
      txt("Setup description", () => run.setup, (v) => { run.setup = v; }, { area: true, ph: "Fixtures, connections, load, ambient conditions" }),
      h("div", { style: "margin-top:8px" }, eq, h("button", { onclick: () => { run.equipment.push({ name: "", id: "", calDue: "" }); touched(); draw(); } }, "Add equipment")),
      evidence(run, 0, "Setup photos and files"),
      h("div", { class: "nav" }, h("span", {}), run.steps.length ? h("button", { class: "pri", onclick: () => { S.step = run.steps[0]!.n; draw(); } }, "Start step 1 →") : null));
  }
  function stepCard(run: R.RunRecord, s: R.RunStep): HTMLElement {
    const idx = run.steps.indexOf(s), res = (r: R.StepResult, label: string, cls: string): HTMLElement =>
      h("button", { class: cls, "aria-pressed": s.result === r ? "true" : "false", onclick: () => { s.result = s.result === r ? "" : r; touched(); draw(); } }, label);
    return h("div", { class: "step" },
      h("div", { class: "mut" }, `Step ${s.n} of ${run.steps.length}`),
      h("div", { class: "act" }, s.action || "(describe the step)"),
      s.expected ? h("div", {}, h("b", {}, "Expected: "), s.expected) : null,
      h("details", {}, h("summary", { class: "mut" }, "Edit the step text"), txt("Action", () => s.action, (v) => { s.action = v; }, { area: true }), txt("Expected", () => s.expected, (v) => { s.expected = v; })),
      h("div", { class: "meas", style: "margin-top:10px" }, txt("Measured", () => s.measured, (v) => { s.measured = v; }, { ph: "Value or observation" }), txt("Unit", () => s.unit, (v) => { s.unit = v; }, { ph: "V, A, s, °C…" })),
      h("div", { class: "res" }, res("Pass", "Pass", "Pass"), res("Fail", "Fail", "Fail"), res("N/A", "N/A", "NA")),
      txt("Note", () => s.note, (v) => { s.note = v; }, { ph: "Anything seen that is not in the measurement" }),
      evidence(run, s.n, "Evidence for this step"),
      S.all ? null : h("div", { class: "nav" },
        h("button", { onclick: () => { S.step = idx > 0 ? run.steps[idx - 1]!.n : 0; draw(); } }, "← Back"),
        h("span", { style: "display:flex;gap:8px" },
          h("button", { onclick: () => { run.steps.splice(idx + 1, 0, R.blankStep(0)); run.steps.forEach((x, i) => { x.n = i + 1; }); S.step = idx + 2; touched(); draw(); } }, "Insert a step after"),
          run.steps.length > 1 ? h("button", { onclick: () => { if (run.attachments.some((a) => a.step === s.n)) { say("Move or remove this step's evidence first."); return; } run.steps.splice(idx, 1); renumber(run, idx); S.step = Math.min(idx + 1, run.steps.length); touched(); draw(); } }, "Remove step") : null),
        h("button", { class: "pri", onclick: () => { S.step = idx < run.steps.length - 1 ? run.steps[idx + 1]!.n : -1; draw(); } }, idx < run.steps.length - 1 ? "Next step →" : "Conclusion →")));
  }
  function renumber(run: R.RunRecord, removedIdx: number): void {
    const map = new Map<number, number>(); run.steps.forEach((x, i) => { map.set(x.n, i + 1); x.n = i + 1; });
    for (const a of run.attachments) if (a.step > removedIdx) a.step = map.get(a.step) ?? a.step;
  }
  function conclusionCard(run: R.RunRecord): HTMLElement {
    const sel = h("select", { "aria-label": "Overall result" }, ...R.OVERALL.map((o) => h("option", { value: o, selected: run.overall === o || undefined }, o || "—"))) as HTMLSelectElement;
    sel.addEventListener("change", () => { run.overall = sel.value as R.RunRecord["overall"]; touched(); draw(); });
    const c = R.stepCounts(run);
    return h("div", { class: "card" }, h("h3", {}, "Conclusion"),
      h("div", {}, `${c.pass} passed, ${c.fail} failed, ${c.na} not applicable, ${c.open} not run.`),
      h("div", { class: "grid", style: "margin-top:8px" }, h("div", {}, h("label", { class: "f" }, "Overall result *"), sel), txt("Issue flow ID", () => run.issue, (v) => { run.issue = v; }, { ph: "ISS-… if a failure was raised" }),
        txt("Reviewed by", () => run.reviewedBy, (v) => { run.reviewedBy = v; })),
      txt("Deviations from the procedure", () => run.deviations, (v) => { run.deviations = v; }, { area: true, ph: "None, or what differed and why" }),
      h("div", { class: "nav" }, h("button", { onclick: () => { S.step = run.steps.length ? run.steps[run.steps.length - 1]!.n : 0; draw(); } }, "← Back"), h("button", { class: "pri", onclick: () => void save("submitted") }, "Submit report")));
  }

  /* ---- evidence ---- */
  function evidence(run: R.RunRecord, step: number, title: string): HTMLElement {
    const list = R.attachmentsFor(run, step);
    const pick = h("input", { type: "file", multiple: true, hidden: true }) as HTMLInputElement;
    pick.addEventListener("change", () => { void addFiles([...(pick.files ?? [])], step, "pick"); pick.value = ""; });
    const box = h("div", { class: "ev" }, h("b", {}, title), h("div", { class: "mut" }, "Take photos with your phone, attach files from the capture inbox, or drop files here."),
      h("div", { class: "evb", style: "margin-top:8px" },
        host.pair ? h("button", { onclick: () => void openPair(step) }, S.pair && S.pairStep === step ? "Phone connected ✓" : "📱 Phone") : null,
        h("button", { onclick: () => { void pollInbox(true); } }, `📥 Inbox${S.inbox ? ` (${S.inbox.filter((f) => !S.ignored.has(f.path)).length})` : ""}`),
        h("button", { onclick: () => pick.click() }, "＋ File"), pick),
      inboxList(step),
      list.length ? h("div", { class: "thumbs" }, ...list.map((a) => thumb(run, a))) : null);
    box.addEventListener("dragover", (e) => { e.preventDefault(); box.classList.add("drag"); });
    box.addEventListener("dragleave", () => box.classList.remove("drag"));
    box.addEventListener("drop", (e) => { e.preventDefault(); box.classList.remove("drag"); const fl = [...((e as DragEvent).dataTransfer?.files ?? [])]; if (fl.length) void addFiles(fl, step, "drop"); });
    box.addEventListener("paste", (e) => { const fl = [...((e as ClipboardEvent).clipboardData?.files ?? [])]; if (fl.length) { e.preventDefault(); void addFiles(fl, step, "drop"); } });
    box.tabIndex = 0;
    return box;
  }
  function thumb(run: R.RunRecord, a: R.RunAttachment): HTMLElement {
    const cap = h("input", { type: "text", placeholder: "Caption", "aria-label": "Caption" }) as HTMLInputElement; cap.value = a.caption;
    cap.addEventListener("change", () => { a.caption = cap.value; touched(); });
    const src = a.kind === "image" && host.resourceUrl ? host.resourceUrl(a.file) : "";
    return h("div", { class: "thumb" },
      src ? h("img", { src, alt: a.caption || a.name, loading: "lazy" }) : h("div", { class: "ic" }, a.kind === "csv" ? "📈" : "📄"),
      h("div", { style: "margin:4px 0;word-break:break-all" }, a.file.slice(a.file.lastIndexOf("/") + 1)),
      a.summary && a.summary.columns.length ? h("div", { class: "mut" }, `${a.summary.rows} rows · ${a.summary.columns.map((c) => `${c.name} ${c.min}…${c.max}`).slice(0, 3).join(" · ")}`) : null,
      cap, h("div", { style: "display:flex;gap:6px;margin-top:4px" }, h("button", { onclick: () => host.open(a.file) }, "Open"),
        h("button", { title: "Remove from the run. The file stays in the run folder.", onclick: () => { run.attachments.splice(run.attachments.indexOf(a), 1); touched(); say(`Removed ${a.name} from the run; the file stays in ${R.runDir(run)}.`); } }, "Remove")));
  }
  async function attach(bytes: Uint8Array, name: string, type: string, step: number, source: R.RunAttachment["source"], caption = ""): Promise<string> {
    const run = S.run; if (!run) throw new Error("No run is open.");
    let b = bytes, n = name, t = type;
    if (R.kindOf(name, type) === "image" && !host.settings().keepOriginals) ({ bytes: b, name: n, type: t } = await shrink(bytes, name, type));
    const taken = new Set([...host.files().keys(), ...run.attachments.map((x) => x.file)]);
    const path = await host.writeEvidence(R.evidencePath(run, step, n, taken), b);
    const kind = R.kindOf(n, t);
    let summary = null;
    if (kind === "csv" || /\.(csv|tsv|txt)$/i.test(n)) { try { const s = summarizeCsv(new TextDecoder().decode(b)); if (s.columns.length) summary = s; } catch { /* not a table */ } }
    run.attachments.push({ file: path, name, kind: summary ? "csv" : kind, step, caption, sha256: await host.sha256(b), bytes: b.length, added: new Date().toISOString(), by: host.author(), source, summary });
    touched();
    return path;
  }
  async function addFiles(fl: File[], step: number, source: R.RunAttachment["source"]): Promise<void> {
    let n = 0;
    for (const f of fl) { try { await attach(new Uint8Array(await f.arrayBuffer()), f.name || "pasted.png", f.type, step, source); n++; } catch (e) { say(`Could not add ${f.name}: ${String((e as Error)?.message ?? e)}`); return; } }
    say(`Added ${n} file${n === 1 ? "" : "s"} to ${step ? "step " + step : "the setup"}.`);
  }
  /** Shrink a photo to 2000 px on its long side as JPEG; anything that cannot be decoded is kept as it is. */
  async function shrink(bytes: Uint8Array, name: string, type: string): Promise<{ bytes: Uint8Array; name: string; type: string }> {
    try {
      if (typeof createImageBitmap !== "function" || !/^image\/(jpeg|png|webp)$/.test(type || (/\.png$/i.test(name) ? "image/png" : /\.jpe?g$/i.test(name) ? "image/jpeg" : ""))) return { bytes, name, type };
      const bmp = await createImageBitmap(new Blob([bytes as BlobPart], { type: type || "image/jpeg" })), m = 2000, s = Math.min(1, m / Math.max(bmp.width, bmp.height));
      if (s >= 1) return { bytes, name, type };
      const c = document.createElement("canvas"); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
      c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85)); if (!blob) return { bytes, name, type };
      return { bytes: new Uint8Array(await blob.arrayBuffer()), name: name.replace(/\.[^.]+$/, "") + ".jpg", type: "image/jpeg" };
    } catch { return { bytes, name, type }; }
  }

  /* ---- phone ---- */
  async function openPair(step: number): Promise<void> {
    const run = S.run; if (!run || !host.pair) return;
    if (S.pair && S.pairStep === step) { draw(); return; }
    await closePair();
    try {
      S.pair = await host.pair(`${run.runId} · ${run.caseTitle} · ${step ? "Step " + step : "Setup"}`, async (u) => {
        const p = await attach(u.bytes, u.name, u.type, S.pairStep, "phone", u.caption); draw(); return p;
      });
      S.pairStep = step; draw();
    } catch (e) { say("Could not start phone capture: " + String((e as Error)?.message ?? e) + ". Check that this computer allows incoming connections, or use the capture inbox."); }
  }
  async function closePair(): Promise<void> { const p = S.pair; S.pair = null; if (p) await p.close().catch(() => {}); }
  function pairCard(): HTMLElement {
    const p = S.pair!, left = Math.max(0, Math.round((p.expires - Date.now()) / 60000));
    return h("div", { class: "pair" }, host.qr ? h("img", { src: host.qr(p.url), alt: "QR code for phone capture" }) : null,
      h("div", {}, h("div", { style: "font-size:17px;font-weight:700" }, `Phone capture: ${S.pairStep ? "Step " + S.pairStep : "Setup"}`),
        h("div", {}, "Scan with the phone camera, then tap Take photo. Photos arrive here as they are sent."),
        h("div", { class: "mut", style: "margin-top:6px;word-break:break-all" }, p.urls.length > 1 ? "Links: " + p.urls.join("  ·  ") : p.url),
        h("div", { class: "mut" }, `${p.received.length} received · closes in ${left} min · the phone must be on the same network`),
        h("div", { class: "evb", style: "margin-top:8px" }, h("button", { onclick: () => { void closePair().then(draw); } }, "Stop phone capture"))));
  }

  /* ---- capture inbox ---- */
  // The inbox is polled every few seconds; the screen is redrawn only when its list changed, so a poll never
  // rebuilds the form under the engineer's cursor. One poll at a time.
  let inboxKey = "", polling = false;
  async function pollInbox(show = false): Promise<void> {
    if (polling && !show) return;
    polling = true;
    try { S.inbox = await host.inbox(S.inboxSince); } catch { S.inbox = null; } finally { polling = false; }
    const key = S.inbox === null ? "none" : S.inbox.map((f) => `${f.path}|${f.mtime}|${f.size}`).join("\n");
    if (show && S.inbox === null) say("No capture inbox is set, or it cannot be read. Set the folder your scope or DAQ saves to in Settings → Testbench.");
    else if (show || key !== inboxKey) draw();
    inboxKey = key;
  }
  function inboxList(step: number): HTMLElement | null {
    const files = (S.inbox ?? []).filter((f) => !S.ignored.has(f.path) && !(S.run?.attachments ?? []).some((a) => a.name === f.name && a.source === "inbox"));
    if (!files.length) return null;
    return h("table", { style: "margin-top:8px" }, h("tbody", {}, ...files.slice(0, 12).map((f) => h("tr", {},
      h("td", {}, "📥 ", f.name), h("td", { class: "mut" }, `${new Date(f.mtime).toLocaleTimeString()} · ${Math.max(1, Math.round(f.size / 1024))} KB`),
      h("td", {}, h("button", { class: "pri", onclick: async () => { try { await attach(await host.inboxRead(f), f.name, "", step, "inbox"); say(`Attached ${f.name} to ${step ? "step " + step : "the setup"}.`); } catch (e) { say(`Could not attach ${f.name}: ${String((e as Error)?.message ?? e)}`); } } }, `Attach to ${step ? "step " + step : "setup"}`)),
      h("td", {}, h("button", { onclick: () => { S.ignored.add(f.path); draw(); } }, "Ignore"))))));
  }

  /* ---- save and submit ---- */
  async function save(how: "saved" | "submitted"): Promise<void> {
    const run = S.run; if (!run || S.busy) return;
    const m = R.markRun(run, how, host.author(), new Date());
    if ("error" in m) { say(m.error); return; }
    const plan = R.planSaveReport(m.run, host.files());
    if (plan.problems.length) { say(plan.problems[0]!); return; }
    S.busy = true;
    try {
      const res = await host.applyPlan(plan);
      S.run = m.run; const db = host.db(); if (db) { D.saveRunDraft(db, m.run); if (how === "submitted") D.removeRunDraft(db, m.run.guid); host.saveDbLater(); }
      say(`${res.message} ${how === "submitted" ? "Report submitted." : "Saved; the run stays in progress."}`, res.undo);
    } catch (e) { say("Could not save: " + String((e as Error)?.message ?? e)); }
    finally { S.busy = false; }
  }

  inboxTimer = setInterval(() => { if (S.mode === "run" && S.run) void pollInbox(); }, 4000);
  draw();
  return {
    refresh: () => { draw(); },
    openRun(path: string): string {
      const t = host.files().get(path), r = t ? R.parseReport(t) : null; if (!r) return `${path} is not a Testbench report.`;
      const db = host.db(), d = db ? D.loadRunDraft(db, r.guid) : null;
      setRun(d && d.savedAt > (r.events[r.events.length - 1]?.at ?? "") ? d.run : r); return "";
    },
    destroy: () => { if (inboxTimer) clearInterval(inboxTimer); if (draftTimer) clearTimeout(draftTimer); void closePair(); },
  };
}
