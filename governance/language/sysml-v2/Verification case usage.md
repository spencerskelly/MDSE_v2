---
type: Language Element
id: verification-usage
category: language
kind: usage
keyword: "verification name : Type"
metaclass: "VerificationCaseUsage"
usage: core
status: Draft
---
# Verification case usage

**Language construct** · **Usage** · **Everyday** · `verification name : Type` · SysML v2 metaclass `VerificationCaseUsage`

A use of a verification case applied to a subject (`verification v : TestCharger;`).

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- verification case definitions (`:`), or other verification case usages it subsets (`:>`)

## What separates it from [[Verify]]

A verification usage is the planned test or inspection. A verify usage inside its objective names the requirement it checks.

## Example

```sysml
verification test1 : TestCharger;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
