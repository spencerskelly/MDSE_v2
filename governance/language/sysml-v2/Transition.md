---
type: Language Element
id: transition-usage
category: language
kind: relationship
keyword: "transition first a accept sig if g do act then b;"
metaclass: "TransitionUsage"
usage: common
status: Draft
---
# Transition

**Language construct** · **Relationship** · **Common** · `transition first a accept sig if g do act then b;` · SysML v2 metaclass `TransitionUsage`

A move from one state (or action) to the next, with an optional trigger (`accept`), guard (`if`) and effect (`do`).

## Eligible from (source)

- a state (the source)

## Eligible to (target)

- a state (the target)

## What separates it from [[Succession]]

A transition has a trigger, guard and effect and applies between states. A succession only orders.

## Example

```sysml
transition first idle accept start then charging;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
