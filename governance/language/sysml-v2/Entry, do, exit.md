---
type: Language Element
id: state-action
category: language
kind: statement
keyword: "entry action a; do action b; exit action c;"
metaclass: "StateSubactionMembership"
usage: common
status: Draft
---
# Entry, do, exit

**Language construct** · **Statement** · **Common** · `entry action a; do action b; exit action c;` · SysML v2 metaclass `StateSubactionMembership`

The actions a state runs when entered, while in it, and when left.

## Eligible from (source)

- a state body

## Eligible to (target)

- an action

## What separates it from [[Transition]]

State actions run inside a state. A transition's effect runs while moving between states.

## Example

```sysml
state s { entry action init; do action run; exit action stop; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
