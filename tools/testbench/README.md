# testbench

The Obsidian plugin for validation (D-0170, rules TBN-001 to TBN-005): plan the tests, run them step by step at the bench, and capture evidence from a phone, the capture inbox or dropped files. It writes run reports and evidence files only, never a model note.

**State:** source with unit tests and a browser test against a fake Obsidian API. Not yet run in real Obsidian, not in the base vault or the plugin lock. Phone capture has not been tried on the company network.

## Install for a trial

Build (`npm run build:testbench`), then copy `tools/testbench/dist/plugin/` (three files) into the staging vault as `.obsidian/plugins/mdse-testbench/` and enable **MDSE Testbench** in Settings → Community plugins. Desktop only. Bootstrap's plugin lock does not list it yet, so leave Bootstrap's lock check off in the trial vault.

## Use

- **Open:** ribbon flask icon or the command **Open Testbench**. It opens in the main area.
- **Plan:** every Verification note with what it verifies, its run count and last result; **Start run**. **New test plan** opens the Test plan flow (D-0169) here. Runs in progress on this computer can be resumed. **Find evidence** searches captions, file names, cases and unit serials.
- **Run:** the bar shows the run, the case, the counts, **Save to vault**, **Submit report** and the step chips (Setup, 1…n, Conclusion), coloured by result.
  - **Setup:** unit serial, hardware rev, firmware version, date, tester, test plan flow ID, setup description, equipment with calibration due dates, setup photos.
  - **Step:** the action and expected result from the case, Measured and Unit, large Pass / Fail / N/A buttons, a note, and the evidence box.
  - **Evidence:** **📱 Phone** shows a QR code; scan it with the phone camera and tap **Take photo**. Photos are shrunk on the phone and appear under the step within seconds. **📥 Inbox** lists new files in the capture inbox (set in Settings → Testbench to the folder the scope or DAQ saves to) with **Attach to step n**. **＋ File**, drag and drop, or paste a screenshot.
  - **Conclusion:** overall result, deviations, issue flow ID, reviewer. Submit lists anything still missing.
- **Settings:** report folder (default `Test Reports`), capture inbox, tested-by default, keep original photos, phone capture port (0 = any free port) and time limit.

## Where things go

| What | Where | Committed |
|---|---|---|
| Report | `Test Reports/TRP-yymm-nnnn/TRP-yymm-nnnn.md` | Yes |
| Evidence | same folder, `setup-…`, `step-03-…` | Yes (consider Git LFS, see D-0170 item 6) |
| Run index and drafts | `.mdse/testbench.db` | No (`.gitignore`) |

## Source

| File | Holds |
|---|---|
| `src/tb_run.ts` | Run model, steps from the case, evidence file names, checks, report note write and read |
| `src/tb_csv.ts` | Scope and DAQ CSV summary (preamble, header, min, max, mean) |
| `src/tb_db.ts` | Testbench database schema, rebuild from reports, drafts, queries |
| `src/tb_pair.ts` | Phone capture server and page (Node `http` passed in) |
| `src/tb_view.ts` | The screen |
| `src/plugin.ts` | Obsidian shell: vault, database file, writes with Undo, inbox, phone server, QR |

Shared: `tools/workbench/src` index, views, flows; `tools/core/src/mdse_db.ts`; vendored `tools/core/vendor/sqljs` and `qrcode-generator`.

## Tests

`npm run test:testbench` (runs, CSV, phone server over real HTTP, database) and `testing/oracles/test_testbench_plugin.py` (the built plugin in Chromium: start a run, setup photo, inbox CSV, step results, submit, database).
