# First semantic review — sample decisions and open conflicts

**Status:** Engineering review candidates, not approved changes to `governance/RULESET.md` or `DECISIONS.md`.  
**Inputs:** All-rule analysis in [71_Rule_Analysis](71_Rule_Analysis/README.md), derived requirement notes in [72_Derived_Requirements](72_Derived_Requirements/README.md) and verification cases in [73_Derived_Verification](73_Derived_Verification/README.md).

## Why the initial decomposition is not the finished model

The first pass processed all 386 rules and placed their semantics into candidate categories, with text-derived segments and links to existing functions, use cases and parts. However, one original rule can encode multiple engineering concepts: a mandatory behavior, a constraint, a process step, an implementation allocation and a test obligation. Punctuation is not a safe surrogate for atomicity. Conversely, separate rules can define the *same* requirement or contradict one another.

**Consequently, the 332 derived requirement and 159 verification notes are unapproved working candidates, not 491 verified engineering requirements/tests.**

## Reviewed examples for the next decision round

| Rule | True modeling treatment to validate | Existing evidence and concern | Suggested disposition |
|---|---|---|---|
| [[GOV-006]] | Historical repository workflow instruction; organizational process, **not** an MDSE Core or Base Vault part function | Active wording still permits `Test_Vault_` pushes, while [[GOV-005]] declares `MDSE_v2` sole tool authority and [[GOV-001]] governs `main`. Its own note says it continues as GOV-001. | Mark superseded/retire through approved decision; **do not implement derived GOV-006 candidate requirements** |
| [[DAT-002]] | Split into data-isolation design constraints and one historical repository-authority statement | Private source restrictions are important, but final sentence assigns tool authority to `Test_Vault_`, conflicting with [[GOV-005]] | Preserve data restrictions, amend obsolete repository sentence and derive separate data-policy tests |
| [[GOV-018]] | Folder-placement policy/design constraint, not a product use case | Requires following EA package structure; new v2 model uses folders for model organization and must not automatically inherit source package hierarchy | Review placement policy before accepting candidate clauses |
| [[MOD-045]] | Current V1/V2 handover and merge semantics; an **Unreviewed** mixed contract | Explicitly acknowledges conflict between automatic source overwrite and approval-only merge; `tools/core/src/mdse_core.js` and `tools/importer/src/merge.ts` disagree | Do not activate it as written; use a single approved merge requirement with tests |
| [[MOD-150]] | Historical Local Model format, not an active native SysML v2 function | Text says replaced by SysML; remains Unreviewed | Preserve as history; do not create new functional requirement |
| [[IMP-076]] | Functional re-import idempotence requirement | `tools/importer/test/importer.test.ts` defines an "identical re-import changes nothing" test; execution not verified in this review | Strong candidate for an independently accepted, atomic re-import requirement with direct verification |
| [[BOM-001]] | Several model requirements: unique part definitions; parent-owned usages; quantity/unit handling; nonmaterialized where-used; revision integrity | Though Unreviewed, BOM code/tests provide partial evidence for these ideas | Decompose into multiple normalized requirements **after owner review**; avoid calling the original Active |
| [[WKB-008]] | At least functional editing capabilities **and** eligibility/transaction boundaries | Workbench edit code and tests exist; a single rule includes relationship creation, note creation, target eligibility, and SysML block ownership | Derive distinct functional requirements and reusable candidate verification cases, not one monolithic test |
| [[TST-001]] | Engineering process/CI acceptance obligation, not a user-facing Product Knowledge Base use case | `.github/workflows/ci.yml` does not automatically run the dedicated importer TypeScript, Workbench and Bootstrap test suites although `npm test` does | Fix CI gate or update the explicitly approved policy before declaring compliance |

## Review priorities

1. **Resolve obsolete Active rules first**, particularly GOV-006, DAT-002 and the folder policy. An Active label alone does not prove present-day semantic compatibility.
2. **Merge duplicate requirements** when several source clauses describe one invariant rule; do not create new work just because the generator allocated a new ID.
3. **Split compound obligations** into genuinely independently testable requirements and design constraints. Preserve the original rule as origin.
4. **Distinguish process/organizational controls from software parts**. For example, a GitHub branch governance rule should not be allocated to the Core parser.
5. **Verify real code and test matches**: inspect exact assertions per requirement, run test suites and parser, and capture executed results separately from test definitions.

## Promotion gate

A derived element may be promoted only after its source status/current authority is reviewed, the meaning is typed and independently comprehensible, reuse/duplicates are resolved, native model relationships are valid, its responsible part and functions are justified, and its verification definition includes unambiguous expected outcomes. Until then, `Draft` and `semanticReview: pending` remain mandatory.

This review does **not** modify any original rule, tool implementation or executable test.
