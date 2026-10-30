# testing

Proof that the tools follow the rules. Unit tests live next to their tool (`tools/<tool>/test/`); this folder holds what is shared across tools.

**Rules:** RULESET.md section TST, and DAT for data handling.

| Path | What | Run |
|---|---|---|
| `oracles/` | Independent Python reference implementations and the tests that compare the tools against them: note format, core cross-check, QEAX reader, importer in a real browser | `npm run test:oracles` |
| `oracles/cli/` | Small Node wrappers that let Python tests call the JavaScript tools | used by the oracle tests |
| `fixtures/golden-charger/` | Synthetic Charger model: three notes, SysML exports, parser gate scripts, parser pin | `npm run test:fixtures`; parser: CI `parser` job (every push to `main`, or on demand) |
| `fixtures/sample-instrument/` | One synthetic note used by the note-format tests | via oracles |
| `fixtures/charger-connections/` | Synthetic connection/interface candidate. Not yet in CI | — |
| `REAL_DATA_TEST_LOG.md` | Index of private real-data runs that found issues | — |
| `requirements.txt` | Python test dependencies | `pip install -r testing/requirements.txt` |

## Data

Every fixture is synthetic (DAT-002). Real `.qeax` and BOM files are tested only on a private machine; when a run finds an issue, add a line to `REAL_DATA_TEST_LOG.md` with the evidence file's **name** and private location, never its contents.

## Oracles

Python is allowed here only (GOV-002). An oracle is an independent implementation of a rule; a tool passes when its output equals the oracle's. When a rule changes, change the oracle and the tool in the same commit.

## Parser gate

The pinned independent SysML v2 parser (Java, via `fixtures/golden-charger/provision_parser.sh`) runs only in CI, from the `parser` job: on every push to `main`, and on demand (Actions → CI → Run workflow → tick "parser"). A pass is evidence that the generated text parses and resolves; it is not evidence of engineering correctness. The pin is in `fixtures/golden-charger/parser-pin.json` and is not final.
