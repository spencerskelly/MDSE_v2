---
type: Language Element
id: require-constraint-usage
category: language
kind: usage
keyword: "assume constraint c { } / require constraint c { }"
metaclass: "RequirementConstraintUsage"
usage: common
status: Draft
---
# Assume and require constraint

**Language construct** · **Usage** · **Common** · `assume constraint c { } / require constraint c { }` · SysML v2 metaclass `RequirementConstraintUsage`

The parts of a requirement: `assume` is what must hold for the requirement to apply, `require` is what the subject must meet.

## Can be declared in

- a requirement definition or usage

## Can specialize, be typed by, or refer to

- a constraint

## What separates it from [[Constraint usage]]

They live inside a requirement and have a role; a free constraint usage has none.

## Example

```sysml
requirement def R { require constraint { v <= 480 } }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
