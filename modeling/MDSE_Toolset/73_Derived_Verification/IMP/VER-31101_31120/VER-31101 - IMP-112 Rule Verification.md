---
type: Verification
subtype: test
id: VER-31101
uid: 20261022043200101skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: IMP-112
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31101::TestVER31101
---
# IMP-112 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[IMP-112]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31191 - IMP-112 Statement 1]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: A usage name is the EA name made into a SysML identifier with a lower first letter, except that a name that starts with two capitals (an acronym) keeps its case: `USB-MCU` is `USBMCU`, `CAN TXRX` is `CANTXRX`, `LED Port` is `LEDPort`, not `uSBMCU`, `cANTXRX`, `lEDPort`.

## Proposed test procedure

**Given:** Synthetic EA/QEAX source rows covering the specified element, connector, field or failure category.

**When:** Preflight, translate, create a ledger, re-import and inspect model output.

**Then:** Compare the rule's mapped semantics, flags, identity, source accounting and change disposition with expected values.

Each checklist item needs a precise fixture, expected outcome, pass/fail assertion and (where appropriate) manual review criterion before execution.

## Existing files to investigate

- `tools/importer/test/importer.test.ts` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**
- `tools/importer/test/preflight.test.ts` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**

## Result and authority

- Run result: **not run**
- Executed test commit, environment and evidence: **not linked**
- Source rule: [[IMP-112]]
- Analysis: [[IMP-112 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31101 {
    verification def TestVER31101 {
        doc /* Candidate verification of IMP-112; execution and clause-level acceptance are pending. */
    }
}
```
