# MDSE toolset self-model — stakeholder needs pilot

**Status:** Draft proposal for owner review on `mdse_v2_cleanup` (2026-10-21). This folder is a *modeling pilot*, not a released vault or approved rule source.

## Why this exists

Use MDSE's own approach to design MDSE: stakeholder intent → use cases → logical functions → derived requirements → software components → verification case → executed evidence. One concept per note with an immutable pilot identity, explicit review status and SysML v2 definition. Use trace links to understand impact and identify missing definitions.

Existing `governance/RULESET.md` and `DECISIONS.md` remain **normative**. Do not copy existing rule text and silently create another authority. The pilot STK/UC/BEH/REQ/OBJ/VER IDs do **not** replace existing GOV/MOD/IMP/BOM/BAS/BOO/WKB/TST IDs.

### Stakeholder needs (review these first)

- [[STK-00001 - Accessible Engineering Knowledge]]
- [[STK-00002 - One Trustworthy Model]]
- [[STK-00003 - Preserve Imported Knowledge]]
- [[STK-00004 - Protect Engineer Changes]]
- [[STK-00005 - Trace Needs to Evidence]]
- [[STK-00006 - Offline Accessible Operation]]
- [[STK-00007 - Understand Model Impacts]]
- [[STK-00008 - Protect Engineering Data]]
- [[STK-00009 - Deploy Consistent Toolsets]]
- [[STK-00010 - Understand Decisions and Changes]]
- [[STK-00011 - Engineer MDSE with MDSE]]
- [[STK-00012 - Prove Behavior Against Real Data]]

### First vertical example

[[STK-00003 - Preserve Imported Knowledge]] → [[UC-00001 - Import an Engineering Model]] → [[BEH-00001 - Reconcile Source Records]] → [[REQ-00001 - Account for Every Source Row]] → [[OBJ-00001 - MDSE Importer]] → [[VER-00001 - Source Row Disposition Test]]

This is a proposed impact chain, *not yet an accepted SysML relationship graph*.

- The candidate source-row accounting test exists in `tools/importer/test/importer.test.ts`, but no test was executed for these new notes.
- The requirement-to-verification link is proposed in Markdown and the companion CSV; model semantics must eventually be emitted as native SysML v2 and checked by the pinned parser.
- All other stakeholder needs currently have traceability gaps by design. We should complete and review them before broad tool restructuring.
- A stakeholder **need** may not be identical to a stakeholder **requirement**. Today's type schema only has `Requirement/stakeholder`; confirm this provisional placement before promoting these notes.
- The pilot UIDs are isolated candidate allocations. Run identity collision and serialization checks before inclusion in a production vault.
- This proposal does not add code, duplicate tool implementations or private engineering sources.

### How we extend it

1. Review stakeholder people/roles and approve, split or merge the 12 candidate need statements.
2. For each need identify a use case and an observable success criterion.
3. Derive function definitions that describe **what the system does**, rather than naming tools.
4. Write testable requirements and allocate them to `core`, `importer`, `workbench`, `base-vault`, `bootstrap` or governed testing components.
5. Connect every formal requirement to a verification case, executable test, and pinned CI evidence, or a clear gap.
6. Link to existing rule IDs as governing origins; retain one authority and record any approved changes in DECISIONS.md.
7. Parse/validate formal SysML relationships and open this folder in the offline Workbench. **Neither parser nor Workbench was run on these notes in this commit.**

### Decisions required

- **SELF-01:** Are stakeholder needs separate first-class concepts, or do we represent them by draft stakeholder requirements?
- **SELF-02:** Approve one native SysML v2 relation scheme for the end-to-end chain (avoid claiming Markdown links are model relationships).
- **SELF-03:** Should the maintained self-model live as a standalone dogfood vault, or as source-controlled notes in MDSE_v2?
- **SELF-04:** How does a system-model requirement reference an existing rule ID without duplicating the rule's authority?
- **SELF-05:** Separate Verification Case definition, executable test code, execution results and real-data acceptance.

**First review requested:** the need statements and stakeholder roles, before adding more detail.
