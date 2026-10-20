---
type: Language Element
id: assign-action-usage
kind: statement
keyword: "assign x := expr;"
metaclass: AssignmentActionUsage
usage: occasional
status: Draft
---
# Assign

**Statement** · **Occasional** · `assign x := expr;` · SysML v2 metaclass `AssignmentActionUsage`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
