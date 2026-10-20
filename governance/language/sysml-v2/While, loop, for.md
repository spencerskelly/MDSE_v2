---
type: Language Element
id: loop-action-usage
kind: statement
keyword: "while c { } / loop { } until c; / for x in xs { }"
metaclass: LoopActionUsage
usage: occasional
status: Draft
---
# While, loop, for

**Statement** · **Occasional** · `while c { } / loop { } until c; / for x in xs { }` · SysML v2 metaclass `LoopActionUsage`

Repeats a block of actions while a condition holds, until one does, or for each item.

## Eligible from (source)

- an action body

## Eligible to (target)

- a Boolean expression, a collection and an action block

## What separates it from [[If]]

Loops repeat; `if` runs once.

## Example

```sysml
action a { while more { action step; } }
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
