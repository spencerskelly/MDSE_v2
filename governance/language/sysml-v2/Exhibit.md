---
type: Language Element
id: exhibit-state-usage
category: language
kind: relationship
keyword: "exhibit state name : StateDef;"
metaclass: "ExhibitStateUsage"
usage: common
status: Draft
---
# Exhibit

**Language construct** · **Relationship** · **Common** · `exhibit state name : StateDef;` · SysML v2 metaclass `ExhibitStateUsage`

States that a part exhibits a state machine: the link from structure to states.

## Eligible from (source)

- a part definition or usage (the exhibitor)

## Eligible to (target)

- a state definition or usage

## What separates it from [[State usage]]

`exhibit` ties a state machine to the part that shows it; a state usage alone belongs to a state or action context.

## Example

```sysml
exhibit state charging : ChargerStates;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
