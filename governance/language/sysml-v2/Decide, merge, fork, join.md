---
type: Language Element
id: decision-node
category: language
kind: statement
keyword: "decide; merge; fork; join;"
metaclass: "ControlNode"
usage: common
status: Draft
---
# Decide, merge, fork, join

**Language construct** · **Statement** · **Common** · `decide; merge; fork; join;` · SysML v2 metaclass `ControlNode`

Control nodes in an action: `decide` chooses one branch, `merge` rejoins branches, `fork` starts parallel branches, `join` waits for all.

## Eligible from (source)

- an action body

## Eligible to (target)

- successions to and from them

## What separates it from [[Succession]]

A control node is a point in the flow; a succession is the arrow between points.

## Example

```sysml
action a { fork f; join j; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
