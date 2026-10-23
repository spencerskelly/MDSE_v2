---
type: Language Element
id: succession
category: language
kind: relationship
keyword: "first a then b;"
metaclass: "SuccessionAsUsage"
usage: core
status: Draft
---
# Succession

**Language construct** · **Relationship** · **Everyday** · `first a then b;` · SysML v2 metaclass `SuccessionAsUsage`

States that one occurrence (action, state, event) ends before another starts. The simple form has no condition; add a guard and it is a conditional succession.

## Eligible from (source)

- an action, state or other occurrence usage

## Eligible to (target)

- an action, state or other occurrence usage

## What separates it from [[Transition]]

A simple succession only orders two occurrences. A conditional succession adds a guard (`if`). A transition moves between states and can also carry a trigger and an effect.

## Example

```sysml
first start then charge;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
