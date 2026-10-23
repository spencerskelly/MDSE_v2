---
type: Language Element
id: loop-action-usage
category: language
kind: statement
keyword: "while c { } / loop { } until c; / for x in xs { }"
metaclass: "LoopActionUsage"
usage: occasional
status: Draft
---
# While, loop, for

**Language construct** · **Statement** · **Occasional** · `while c { } / loop { } until c; / for x in xs { }` · SysML v2 metaclass `LoopActionUsage`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
