---
type: Language Element
id: terminate-action-usage
kind: statement
keyword: "terminate;"
metaclass: TerminateActionUsage
usage: rare
status: Draft
---
# Terminate

**Statement** · **Rare** · `terminate;` · SysML v2 metaclass `TerminateActionUsage`

Ends the enclosing occurrence early, before its normal end, and everything it contains.

## Eligible from (source)

- an action body

## Eligible to (target)

- the occurrence to end

## What separates it from [[Decide, merge, fork, join]]

Terminate stops; a control node steers.

## Example

```sysml
action a { terminate; }
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Rare.
