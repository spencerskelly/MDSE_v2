---
type: Language Element
id: constraint-usage
category: language
kind: usage
keyword: "constraint name : Type"
metaclass: "ConstraintUsage"
usage: common
status: Draft
---
# Constraint usage

**Language construct** · **Usage** · **Common** · `constraint name : Type` · SysML v2 metaclass `ConstraintUsage`

A use of a constraint definition, or an inline condition, inside a definition or requirement.

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- constraint definitions (`:`), or other constraint usages it subsets (`:>`)

## What separates it from [[Assert constraint]]

A constraint usage states a condition. An assert constraint usage asserts it must hold (or not, with `not`).

## Example

```sysml
constraint maxV : MaxVoltage;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
