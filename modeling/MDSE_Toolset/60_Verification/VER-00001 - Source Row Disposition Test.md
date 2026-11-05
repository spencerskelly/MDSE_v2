---
type: Verification
subtype: test
id: VER-00001
uid: 20261021163400017skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_VER_00001::SourceDispositionTest
---
# Source Row Disposition Test

**Status:** Proposed model element; not an approved new governance rule.

**Statement:** Verify the ledger count equals the input package, element and connector counts and each ledger row has a disposition.

**Candidate executable evidence:** `tools/importer/test/importer.test.ts` asserts source-row disposition coverage. The test has **not been run** for this model.

## Proposed trace links

- Referenced from (verifiedBy): [[REQ-00001 - Account for Every Source Row]]

These are provisional navigational links. Formal native SysML relationships, endpoint typing, and independent parser acceptance remain to be verified. Do not treat a link or verification declaration as passed evidence.

## SysML v2

> Draft definition, not yet parser-certified. Keep this SysML section last.

```sysml
package MDSE_VER_00001 {
    verification def SourceDispositionTest {
        doc /* Verify the ledger count equals the input package, element and connector counts and each ledger row has a disposition. */
    }
}
```
