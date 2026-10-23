---
type: Language Element
id: if-action-usage
category: language
kind: statement
keyword: "if cond { } else { }"
metaclass: "IfActionUsage"
usage: occasional
status: Draft
---
# If

**Language construct** · **Statement** · **Occasional** · `if cond { } else { }` · SysML v2 metaclass `IfActionUsage`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
