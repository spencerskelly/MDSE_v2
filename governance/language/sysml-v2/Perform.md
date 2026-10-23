---
type: Language Element
id: perform-action-usage
category: language
kind: relationship
keyword: "perform action name : ActionDef;"
metaclass: "PerformActionUsage"
usage: core
status: Draft
---
# Perform

**Language construct** · **Relationship** · **Everyday** · `perform action name : ActionDef;` · SysML v2 metaclass `PerformActionUsage`

States that a part performs an action: the link from structure to behaviour. The action may be declared there or referenced.

## Eligible from (source)

- a part definition or part usage (the performer)

## Eligible to (target)

- an action definition or action usage

## What separates it from [[Action usage]]

`perform` binds an action to the part that does it. An action usage on its own is just a step with no performer.

## Example

```sysml
perform action charge : ChargeVehicle;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
