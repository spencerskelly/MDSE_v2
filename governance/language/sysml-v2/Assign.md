---
type: Language Element
id: assign-action-usage
category: language
kind: statement
keyword: "assign x := expr;"
metaclass: "AssignmentActionUsage"
usage: occasional
status: Draft
---
# Assign

**Language construct** · **Statement** · **Occasional** · `assign x := expr;` · SysML v2 metaclass `AssignmentActionUsage`

An action that sets the value of a feature.

## Eligible from (source)

- an action body

## Eligible to (target)

- a feature and an expression

## What separates it from [[Value binding]]

Assign changes a value at a point in behaviour. A value binding gives the value as a definition.

## Example

```sysml
action a { assign counter := counter + 1; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
