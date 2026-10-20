---
type: Language Element
id: if-action-usage
kind: statement
keyword: "if cond { } else { }"
metaclass: IfActionUsage
usage: occasional
status: Draft
---
# If

**Statement** · **Occasional** · `if cond { } else { }` · SysML v2 metaclass `IfActionUsage`

Runs one block of actions or another depending on a condition.

## Eligible from (source)

- an action body

## Eligible to (target)

- a Boolean expression and action blocks

## What separates it from [[Decide, merge, fork, join]]

`if` is structured and inline; `decide` draws the branch as a node with successions.

## Example

```sysml
action a { if ok { action x; } }
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
