/* Flow guides (D-0171, WKB-079): one Markdown note per flow that walks a new user through it section by section.
 * The goals and questions are written here; the fields, required marks, options and tables are read from the flow
 * definitions (flow_defs.ts), so a guide always matches the form it explains. The Workbench writes the notes into
 * `99_System/07_Guides/Flows/` and opens them from the ? button on an open flow. */
import * as F from "./flows.ts";

export interface SectionGuide { goal: string; ask: string[]; done?: string }
export interface FlowGuide { purpose: string; start: string; finish: string; tips?: string[]; sections: Record<string, SectionGuide> }

export const GUIDES_DIR = "99_System/07_Guides/Flows";
export const GUIDE_MARK = "mdse-workbench flow guide";

const G_COMMON: Record<string, SectionGuide> = {
  "driving-reason": {
    goal: "Record why this work is being done, so every reviewer, the ECO and the ECN carry the same reason.",
    ask: ["What is driving this work: a requirement change, an issue, a test result, field feedback, a supplier, a regulation, obsolescence, an improvement?",
      "Can you say it in one or two sentences someone outside your team would understand?",
      "Is there a record it comes from (issue, requirement, redline or test ID)? Put its ID in Source reference.",
      "Does it belong to an ECO? Choose Add to an existing ECO and type the ECO number, Start a new ECO, or Standalone."],
    done: "Reason type and Reason statement are filled in. Tick Submitted; this first submit saves the flow and gives it its record note.",
  },
  "files-and-evidence": {
    goal: "See what this flow is for in files, and where its record is kept.",
    ask: ["Which of the listed files does your change need? Make them with the Edit lens, the ECO tab or by hand; this version of the tool writes only the flow record."],
    done: "Nothing to submit here. The flow is complete when every other section shows Submitted.",
  },
};

export const FLOW_GUIDES: Record<string, FlowGuide> = {
  CHG: {
    purpose: "Change a released part or assembly: raise the request, scope the impact, open the ECO, change the design, verify it, check operations, plan the change tasks and release.",
    start: "Select the part or assembly note in the Workbench, then Flow → Start: Change → Change. The part's number, revision, description, element type and make/buy are filled in from the note.",
    finish: "All nine sections show Submitted and the Lead Engineer's decision is recorded. The flow record holds the evidence; the ECO itself is approved in Jira.",
    tips: ["Work top to bottom; later sections build on earlier ones, but you can submit them in any order.",
      "Where used and BOM lines are read from the model. If a parent or child is missing, fix the model first or add the row by hand and say why in the notes."],
    sections: {
      "raise-the-request": { goal: "State the problem against the right part and revision.", ask: ["Is the affected part and revision correct (filled from the note)?", "What is wrong, or what should change? Describe the symptom, not the fix.", "Where did it come from: field, production, design review, maintenance, value engineering?"] },
      "scope-the-impact": { goal: "Decide how far the change reaches before anyone redesigns anything.", ask: ["Which parents use this part (Where used)? Set In this change to No for any you are leaving out, and say why.", "Which product lines are affected?", "How many linked requirements have no test? Those need a test before release.", "Is there already an open ECO on this part? If so, talk to its owner first."] },
      "create-the-eco": { goal: "Open the ECO with a clear reason, scope and approvers.", ask: ["Why is the change needed (the reason the approvers read)?", "Does it affect form, fit or function? If Yes or Review needed, the revision letter rolls (CL1).", "When does it take effect: next build, a serial or lot, or on approval?", "Who approves for each discipline? Name them now; the author cannot be the only approver."], done: "Reason for change is filled in and the approver table names a person for every discipline marked Needed." },
      "change-the-design": { goal: "Record the part's new values. CAD stays in PDM; this holds the link and revision only.", ask: ["What is the new revision?", "Is the element type right? Mechanical parts must have a material; electrical, circuit, firmware and software parts show firmware fields.", "Part or assembly? Assemblies show their BOM lines: check quantity, revision and reference designators.", "What changed on the part itself? Use Change notes."], done: "Changed fields are outlined in blue with their old value; check each one is intended, then submit." },
      "verify-the-change": { goal: "Pick only the tests the change affects, for the revision under test.", ask: ["Which design revision is being tested?", "Targeted or full regression?", "Which tests run, and why each one (the requirement or change that triggers it)?", "Is pre-compliance needed?"] },
      "check-system-and-operations": { goal: "Confirm the change still fits the system and can still be built and supplied.", ask: ["Which hardware and firmware combinations must still work together, per product line?", "New supplier? Long-lead items?", "Does a line or station change?", "What must manufacturing, logistics, quality or service know?"] },
      "eca-tasks-and-documents": { goal: "Turn the change into owned tasks and make sure every document is at the release revision.", ask: ["One task per affected item: who owns it and what is its status?", "For each document (drawing, schematic, firmware notes, test report, review record): link in PDM, revision, present?"] },
      "release-and-close-the-loop": { goal: "Show the release is ready and record the decision.", ask: ["Are all readiness checks passed? Record the result of each.", "Do the ERP lines match the change?", "Who approves, what is the decision, and on what date?"], done: "Approver and Release date are filled in. Approval itself is given in Jira and recorded here." },
    },
  },
  NEW: {
    purpose: "Create a new part or assembly, optionally starting from an existing one, and take it through requirements, design, verification, operations and release.",
    start: "To copy an existing part, select its note first, then Flow → Start: Change → New part; its definition fields are copied in and marked as source values. To start blank, select nothing (or set Start from to Blank).",
    finish: "All eight sections show Submitted. The part number is reserved by the person merging.",
    sections: {
      "start-from": { goal: "Decide whether this part starts from an existing one, and what carries over.", ask: ["Blank, or an existing part or assembly?", "How does the new part relate to the source: derived from, variant of, replaces?", "Which groups carry over: definition fields, BOM lines, requirement links, test links, document links?"] },
      "identify-the-part": { goal: "Give the new part its identity and the choices that control form, fit and function.", ask: ["What is it (description)?", "Which element type and part type?", "Mechanical: which material, finish and colour (from the lists)?", "Make or buy? Manufacturer and manufacturer part number if bought.", "Which product line uses it?"] },
      "requirements-and-concept": { goal: "Tie the part to the function it delivers and the requirements it satisfies before designing it.", ask: ["Which function does it deliver?", "Are there similar parts already? Review before creating a new one.", "Summarise the concept.", "Which requirements does it satisfy, of what type, and how will each be verified?"] },
      "design-the-part": { goal: "Record the design outputs (links and revisions only; CAD stays in PDM).", ask: ["Drawing or spec link and revision?", "Firmware version and target hardware, if it has firmware?", "BOM lines, if it is an assembly?", "Has the DFMEA been reviewed?"] },
      "verify-the-part": { goal: "Plan the verification of the new part.", ask: ["Which revision is tested?", "Which tests, by which method?", "Pre-compliance needed? Which units (DUT plan)?"] },
      "check-operations": { goal: "Make sure the part can be bought and built.", ask: ["New supplier?", "Long-lead items?", "Line or station impact?", "Notes for manufacturing, logistics, quality or service?"] },
      "documents-and-release": { goal: "Have every document at the release revision and record the decision.", ask: ["For each document: link, revision, present?", "Do the ERP lines look right?", "Approver, decision and release date?"] },
    },
  },
  RDL: {
    purpose: "Mark up a drawing quickly, send the redline out, and keep it on the deviation list until the team incorporates or cancels it.",
    start: "Select the drawing's Document note, then Flow → Start: Change → Redline.",
    finish: "The first five sections are submitted when the redline goes out. Incorporate or cancel is done later, at the deviation review; the flow completes then.",
    sections: {
      "identify-the-drawing": { goal: "Make sure you are marking up the right drawing at the right revision.", ask: ["Which drawing and revision (shown from the note)?", "Why the redline: drawing error, manufacturing issue, supplier request, field fix, other?", "How urgent?", "Are there open deviations on this drawing already?"] },
      "make-the-markup-copy": { goal: "Mark up an uncontrolled, stamped copy, never the released drawing.", ask: ["Which tool (Inkling ships in the vault)?", "Where is the marked-up file (vault path or link)?", "Which sheets are marked?"] },
      "describe-the-deviations": { goal: "List every change on the markup so others can act on it without the picture.", ask: ["Summarise the redline in a sentence.", "Does it affect form, fit or function?", "Does it apply to this build or lot only, until the drawing is revised, or permanently?", "For each item: zone, type, what changes, from, to."] },
      "send-it-out": { goal: "Get approval and send the redline to whoever builds or buys to it.", ask: ["Who approves, and what is the decision?", "Who receives it (supplier, production, contract manufacturer), by what method, and when?"] },
      "add-to-the-deviation-list": { goal: "Put the redline on the team's deviation list with an owner.", ask: ["Who owns it until it is closed?", "By when must it be reviewed?", "Planned disposition: incorporate, cancel or undecided?", "Notify the team?"] },
      "incorporate-or-cancel": { goal: "Close each deviation: incorporated into a drawing revision, or cancelled with a reason.", ask: ["For each item: incorporate or cancel, why, and by whom?", "Who reviewed, and when?"], done: "Submit this section at the deviation review, often weeks later. Incorporated items start a Change flow." },
    },
  },
  ISS: {
    purpose: "Record a problem against an element, decide the resolution and track it to closure.",
    start: "Select the element the problem is on (part, function, requirement, any model note), then Flow → Start: Change → Issue.",
    finish: "All four sections show Submitted and the issue status is Closed.",
    sections: {
      "identify-the-element": { goal: "Attach the issue to the right element and check it is not already reported.", ask: ["Where was it found: design review, test, production, field, supplier, other?", "Is it already in the open issues listed for this element?"] },
      "describe-the-issue": { goal: "Describe it so someone else could reproduce it.", ask: ["Short title?", "Severity and lifecycle risk?", "What happens, and what was expected?", "How to reproduce, which build or lot, which evidence file or link, who found it?"] },
      "resolution": { goal: "Decide what will be done and who does it.", ask: ["Resolution type: change, deviation, use as is, rework, no fault found, other?", "What will be done, by whom, by when?", "Does the fix need verification?", "Which follow-up flows are needed (Change, Redline, Test plan…)?"] },
      "status-and-close": { goal: "Close the issue with the evidence that it is resolved.", ask: ["Status?", "Resolved in which revision?", "Verified by which test or report?", "Closed on which date?"] },
    },
  },
  REV: {
    purpose: "Review an ongoing effort (usually an ECO) in one place and record each function's decision.",
    start: "Select the ECO note, then Flow → Start: Change → Review and approve. The flows recorded against that ECO are listed.",
    finish: "All three sections show Submitted and every function's decision is recorded. The ECO is approved in Jira; this records the review.",
    sections: {
      "select-the-effort": { goal: "Confirm you are reviewing the right effort and see everything in it.", ask: ["Is this the right ECO (reason, owner, opened date)?", "Which flows belong to it, and are their sections submitted?"] },
      "review-the-details": { goal: "Read the evidence for your function before deciding.", ask: ["What changes (item, from, to, what)?", "What is still open, and who owns it?", "Have you reviewed the evidence? As which role?"] },
      "approve": { goal: "Record each function's decision.", ask: ["For each function: who, decision, note?", "Overall decision, conditions, date?"], done: "Every needed function has a decision. Remember the author cannot be the only approver." },
    },
  },
  OPT: {
    purpose: "Find, compare and select a substitute part or assembly against the requirements, and record it as an approved alternate.",
    start: "Select the part or assembly that needs a substitute, then Flow → Start: Change → Options and alternates.",
    finish: "All three sections show Submitted. The selection is recorded in the flow; a Change or New part flow makes it real.",
    sections: {
      "what-needs-a-substitute": { goal: "Know what the substitute must meet before looking at candidates.", ask: ["Lifecycle and where used (shown)?", "Which requirements must a substitute meet (filled from the model)?", "Does it apply to all uses, one assembly, or one build or lot?"] },
      "candidates-and-specs": { goal: "List the candidates and compare them on the specs that matter.", ask: ["For each candidate: name, type, does it meet the requirements, form-fit-function status, notes?", "For each spec: what is needed, the current part's value, and each candidate's value?"] },
      "select": { goal: "Choose and justify.", ask: ["Which candidate (or keep the current part)?", "What decided it?", "Record it as an approved alternate?", "What starts next: a Change flow, a New part flow, or nothing yet?"] },
    },
  },
  SPC: {
    purpose: "Improve the definition of a function or element: its function statement, its design, and testable requirements.",
    start: "Select the function or element note, then Flow → Start: Define → Specify.",
    finish: "All four sections show Submitted and every requirement passes the three quality checks.",
    sections: {
      "choose-what-to-specify": { goal: "See what exists today and where the gaps are.", ask: ["Class, parent, current design and requirements (shown)?", "What is missing or vague?"] },
      "define-the-function": { goal: "Say what the function does, measurably.", ask: ["Name and statement (verb + object)?", "Performance, with value and unit?", "Trigger or mode, inputs, outputs?"] },
      "define-the-design": { goal: "Say how the design delivers the function, and its interfaces.", ask: ["Design name and approach?", "Constraints (size, power, standards)?", "Each interface: with what, type, protocol?"] },
      "write-the-requirements": { goal: "Write requirements a tester can verify.", ask: ["For each requirement: ID, statement (\"The system shall…\"), subtype, verification method, source?", "Is each one a single testable statement, with a verification method, traced to a function or need?"] },
    },
  },
  FWC: {
    purpose: "Release a firmware change with its properties visible line by line, its compatibility stated and its notes written.",
    start: "Select the firmware part's note, then Flow → Start: Define → Firmware.",
    finish: "All four sections show Submitted. The YAML preview shows every changed property against the starting value.",
    sections: {
      "identify-the-firmware": { goal: "Confirm the firmware and where it is built from.", ask: ["Which firmware, which release state, which hardware does it run on (shown)?", "Which working branch?"] },
      "set-the-properties": { goal: "Set each property of the release. Changed lines are highlighted in the YAML preview with the value they replace.", ask: ["Version and target hardware?", "Bootloader, protocol, CAN database, config schema?", "Feature settings: wireless load management, fault report limit, over-the-air update, log level?"] },
      "compatibility-and-requirements": { goal: "State what the release works with and how it reaches units.", ask: ["Backward compatible?", "Needs a hardware revision?", "How it reaches units (over the air, service tool, production only)?", "Rollback available?", "Which requirements does it touch?"] },
      "release-notes-and-verification": { goal: "Tell installers what changed and link the verification.", ask: ["Release notes, for whoever installs it?", "Release tag?", "Which Test plan flow verifies it, and which issue does it fix?"] },
    },
  },
  TPL: {
    purpose: "Plan the tests a change needs: what is changing, which test cases, grouped by setup, and issue the plan.",
    start: "Select the ECO (or a test case) note, then Flow → Start: Verify → Test plan, or in Testbench, Plan → New test plan.",
    finish: "All four sections show Submitted and the plan status is Issued. Each included test case is then run in Testbench.",
    sections: {
      "what-is-changing": { goal: "Know what the plan must cover.", ask: ["Which items change, at which revision?", "Which requirements do they touch, and how is each verified today?"] },
      "choose-the-test-cases": { goal: "Include the tests that cover the change, and no more.", ask: ["For each case: include it? why? which setup? which verification type?", "Is any touched requirement left without a case?"] },
      "set-up-the-canvas": { goal: "Name the plan and its boundaries. Included cases are grouped by setup.", ask: ["Plan name and level?", "Entry and exit criteria?", "Planned start and end, and the plan owner?"] },
      "issue-the-plan": { goal: "Issue the plan so the runs can start.", ask: ["Draft or Issued?", "Reviewer signs off in Review and approve."] },
    },
  },
  TRP: {
    purpose: "Record one run of a test case as a report. For bench work with photos and instrument files, use the Testbench Run instead; it produces the same kind of report with the evidence attached.",
    start: "Select the verification case note, then Flow → Start: Verify → Test report.",
    finish: "All five sections show Submitted and the overall result is recorded.",
    sections: {
      "select-the-test": { goal: "Confirm the test case, its requirement, setup and method.", ask: ["Which requirement does it verify, on which setup and unit, from which plan, by which method (shown)?"] },
      "record-the-setup": { goal: "Make the run repeatable.", ask: ["Unit serial, hardware revision, firmware version?", "Test date and tester?", "Each instrument: name, asset ID, calibration date?"] },
      "procedure-and-results": { goal: "Record each step's measured value and result.", ask: ["For each step: value, Pass or Fail, note?"] },
      "pictures": { goal: "Attach the pictures that prove the result.", ask: ["For each picture: file, step, caption?"] },
      "conclusion": { goal: "State the overall result.", ask: ["Overall result?", "Deviations from the procedure?", "Issue flow raised for a failure?", "Reviewed by?"] },
    },
  },
  DOC: {
    purpose: "Find the documentation a change affects, decide what changes, and draft the new and revised documents.",
    start: "Select the ECO note, then Flow → Start: Define → Document.",
    finish: "All four sections show Submitted and every draft is linked.",
    sections: {
      "find-the-documentation": { goal: "Find the documents the change touches.", ask: ["Which documents were found and which are flagged for update (shown)?", "Who owns the documentation for this change?"] },
      "decide-what-changes": { goal: "Decide, document by document, what to do.", ask: ["For each existing document: action (revise, retire, no change)?", "What in the change affects the documents?", "When are they needed?"] },
      "new-and-revised-documents": { goal: "List every new or revised document with an owner.", ask: ["For each: name, type, action, owner, summary of the change?"] },
      "draft-and-link": { goal: "Put the drafts where reviewers will find them.", ask: ["Where are the drafts?", "Released with what (this ECO, a later one, independently)?", "Notes for the reviewer?"] },
    },
  },
};

/* ---- the guide note ---------------------------------------------------------------------------------------- */
const gEsc = (s: string): string => String(s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
function whatToEnter(f: F.FlowField): string {
  if (f.kind === "read") return f.dyn ? "Shown by the tool (read only)." : `For reference: ${f.v ?? ""}`;
  const parts: string[] = [];
  if (f.from) parts.push("Filled from the selected note; a change shows the old value.");
  if (f.kind === "select") { const o = (f.opts ?? []).filter(Boolean); parts.push(o.length && o.length <= 9 ? "Choose: " + o.join(", ") + "." : "Choose from the list."); if (f.optsFrom) parts.push("The list also offers the rows you enter in the table above."); }
  if (f.hint) parts.push(f.hint);
  else if (f.ph && f.kind !== "select") parts.push(/^\[.*\]$/.test(f.ph) ? `For example ${f.ph.slice(1, -1)}.` : f.ph.replace(/\s*$/, "") + (/[.?!…]$/.test(f.ph) ? "" : "."));
  if (f.v && f.kind !== "select" && !f.from) parts.push(`Starts as ${f.v}.`);
  return parts.join(" ") || "Free text.";
}
const G_SHOW: Record<string, string> = { mech: "Shown only when the element type is mechanical.", fw: "Shown only for electrical, circuit, firmware and software element types.", asm: "Shown only when the part type is Assembly.", copy: "Shown only when starting from an existing part." };
const G_SRC: Record<string, string> = { whereUsed: "Filled from the model: the parents that use the selected element.", children: "Filled from the model: the selected assembly's direct children.",
  requirements: "Filled from the model: the requirements linked to the selected element.", issues: "Filled from the vault: open Issue notes that link the selected element.",
  ecoFlows: "Filled from the flow records that name this ECO in Driving reason.", verifications: "Filled from the model: verification cases that verify the selected element.", files: "Listed by the flow; read only." };

export function guideOf(id: string): FlowGuide | undefined { return FLOW_GUIDES[id]; }
export const guidePath = (def: F.FlowDef): string => `${GUIDES_DIR}/${def.name} flow guide.md`;

/** The guide note for a flow, generated from its definition and the goals above. */
export function renderGuide(def: F.FlowDef): string {
  const g = FLOW_GUIDES[def.id], secs = F.flowSections(def), sec = (k: string): SectionGuide | undefined => g?.sections[k] ?? G_COMMON[k];
  const out: string[] = ["---", `mdseGuide: ${def.id}`, `flow: ${JSON.stringify(def.name)}`, `generatedBy: ${GUIDE_MARK}`, "---", "",
    `# ${def.name} flow — how to complete it`, "",
    `> Written by the MDSE Workbench from the flow definition, so the fields below match the form. The Workbench replaces this note when it changes; to keep your own version, delete the \`generatedBy\` line.`, ""];
  out.push("## What this flow is for", "", g?.purpose ?? "", "", `**Start it on:** ${def.pick}.`, "", g?.start ?? "", "", `**You are finished when:** ${g?.finish ?? "every section shows Submitted."}`, "");
  if (g?.tips?.length) out.push(...g.tips.map((t) => `- ${t}`), "");
  out.push("## How every flow works", "",
    "- **Open:** the Flow drop-down beside Document, Define, Structure and Verify. *Start* begins a flow on the note selected in the Workbench; *Open a saved flow* and *Drafts on this computer* bring one back.",
    "- **Sections:** expand a section by clicking its title. Fields marked * are required. Fields filled from the selected note are outlined in blue when you change them and show the old value.",
    "- **Submitted:** tick it at the end of a section when you have checked it and the values are correct. It cannot be ticked while a required field is empty. Changing a value afterwards marks the section *Edited since submitted*; tick it again.",
    "- **Saving:** each submit saves the whole flow to its record note in `_ops/Flows`, with Undo in the status line. Anything you type between submits is kept on this computer and restored when you reopen the flow.",
    "- **Other open flows:** if another open flow works on the same element, the flow lists it. Talk to its owner; the two may collide at merge.",
    "- **Close flow** leaves the record as saved. **?** opens this guide.", "");
  out.push("## Sections at a glance", "", "| # | Section | Who | Required before you can submit |", "| --- | --- | --- | --- |",
    ...secs.map((s, i) => { const req = s.blocks.flatMap((b) => b.fields ?? []).filter((f) => f.req && f.kind !== "read").map((f) => f.label); return `| ${i + 1} | [[#${i + 1}. ${s.title}\\|${gEsc(s.title)}]] | ${gEsc(s.head.who ?? "")} | ${F.submittable(s) ? gEsc(req.join(", ") || "Nothing required") : "No Submitted box"} |`; }), "");
  secs.forEach((s, i) => {
    const sg = sec(s.key);
    out.push(`## ${i + 1}. ${s.title}`, "");
    const meta = [s.head.who ? `**Who:** ${s.head.who}` : "", s.head.codes ? `**Process step:** ${s.head.codes}` : ""].filter(Boolean).join(" · ");
    if (meta) out.push(meta, "");
    if (sg?.goal) out.push(`**Goal:** ${sg.goal}`, "");
    if (s.head.intro) out.push(`*On the form:* ${s.head.intro}`, "");
    if (sg?.ask.length) out.push("**Questions to answer**", "", ...sg.ask.map((q) => `- ${q}`), "");
    for (const b of s.blocks) {
      if (b.t === "group" && b.fields?.length) {
        out.push(`**${b.label ?? "Fields"}**${b.crit ? " (critical)" : ""}${b.show ? " — " + G_SHOW[b.show] : ""}`, "");
        if (b.caption) out.push(b.caption, "");
        out.push("| Field | Required | What to enter |", "| --- | --- | --- |", ...b.fields.map((f) => `| ${gEsc(f.label)} | ${f.req && f.kind !== "read" ? "Yes" : ""} | ${gEsc(whatToEnter(f))} |`), "");
      } else if (b.t === "table") {
        out.push(`**Table: ${b.title ?? b.id}**${b.show ? " — " + G_SHOW[b.show] : ""}`, "");
        if (b.note) out.push(b.note + ".", "");
        out.push(b.src ? G_SRC[b.src] ?? "Filled by the tool." : (b.rows?.length ? "Starts with template rows; fill the editable columns." : "Starts empty: use Add row, and × to remove a row."), "",
          `Columns: ${(b.cols ?? []).map((c) => c.label + (c.opts ? ` (${c.opts.filter(Boolean).join(" / ")})` : "")).join("; ")}.`, "");
      } else if (b.t === "yaml") out.push(`**${b.title}:** a live preview of the properties file. Changed lines are highlighted and show the value they replace.`, "");
      else if (b.t === "canvas") out.push(`**${b.title}:** included test cases grouped by setup, updated as you include or reassign tests.`, "");
    }
    if (F.submittable(s)) out.push(`**Done when:** ${sg?.done ?? "the questions above are answered and every required field is filled. Tick Submitted."}`, "");
    else if (sg?.done) out.push(`**Done when:** ${sg.done}`, "");
  });
  out.push("## When you get stuck", "", "- **Submitted will not tick:** the hint beside it lists the empty required fields.",
    "- **A table is empty:** the tool found nothing in the model for the selected note. Check you selected the right note, or add the rows by hand.",
    "- **Wrong note:** close the flow and start again on the right note; a flow keeps the note it started on.",
    "- **Someone else's flow on the same element:** open it from the warning and agree who goes first.", "");
  return out.join("\n");
}
/** Every guide, by path. */
export function allGuides(): Map<string, string> { return new Map(F.flowDefs().map((d) => [guidePath(d), renderGuide(d)])); }
/** Whether the tool may (re)write this guide: missing, or still carrying the generated mark and out of date. */
export function guideNeedsWrite(current: string | undefined, wanted: string): boolean {
  if (current === undefined) return true;
  if (current === wanted) return false;
  return current.includes(`generatedBy: ${GUIDE_MARK}`);
}
