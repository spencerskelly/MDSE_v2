---
type: Language Element
id: state-action
kind: statement
keyword: "entry action a; do action b; exit action c;"
metaclass: StateSubactionMembership
usage: common
status: Draft
---
# Entry, do, exit

**Statement** · **Common** · `entry action a; do action b; exit action c;` · SysML v2 metaclass `StateSubactionMembership`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
