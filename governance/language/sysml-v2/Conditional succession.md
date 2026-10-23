---
type: Language Element
id: conditional-succession
category: language
kind: relationship
keyword: "first a if guard then b;"
metaclass: "SuccessionAsUsage (with a guard)"
usage: common
status: Draft
---
# Conditional succession

**Language construct** · **Relationship** · **Common** · `first a if guard then b;` · SysML v2 metaclass `SuccessionAsUsage (with a guard)`

A succession that only happens when a guard condition is true: `succession first check if ready then charge;`. A default branch after the guarded ones is written `else name;`.

## Eligible from (source)

- an action, state or other occurrence usage

## Eligible to (target)

- an action, state or other occurrence usage

## What separates it from [[Succession]]

A simple succession always follows. A conditional succession follows only when its guard holds. A transition belongs to a state machine and can also carry a trigger (`accept`) and an effect (`do`).

## Example

```sysml
succession first check if ready then charge;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
