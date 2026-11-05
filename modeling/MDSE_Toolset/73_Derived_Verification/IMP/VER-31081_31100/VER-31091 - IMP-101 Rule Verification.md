---
type: Verification
subtype: test
id: VER-31091
uid: 20261022043200091skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: IMP-101
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31091::TestVER31091
---
# IMP-101 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[IMP-101]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31173 - IMP-101 Statement 1]]
- [[REQ-31174 - IMP-101 Statement 2]]
- [[REQ-31175 - IMP-101 Statement 3]]
- [[REQ-31176 - IMP-101 Statement 4]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: An EA Port becomes a port usage written `port name : [~]PortDef[mult]`.
- [ ] Clause 2: The type is the Port's PDATA1 (an EA interface Class, which is a port definition, IMP-104); the Classifier field is not the type.
- [ ] Clause 3: The multiplicity is the Multiplicity field, read as for parts
- [ ] Clause 4: `~` is written when the object has an `isConjugated` tag with a true value (`true`, `yes`, `1` or EA's `-1`). A Port whose PDATA1 is not a port definition (a connector, a signal) is written without a type, the target is kept as a `- Port <name> is typed by [[…]]` line in Source, and the usage is flagged (`UNRESOLVED_PORT_TYPE:TARGET_IS_…`).

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
- Source rule: [[IMP-101]]
- Analysis: [[IMP-101 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31091 {
    verification def TestVER31091 {
        doc /* Candidate verification of IMP-101; execution and clause-level acceptance are pending. */
    }
}
```
