---
type: Language Element
id: actor-usage
category: language
kind: usage
keyword: "actor name : PartDef;"
metaclass: "ActorMembership"
usage: common
status: Draft
---
# Actor

**Language construct** · **Usage** · **Common** · `actor name : PartDef;` · SysML v2 metaclass `ActorMembership`

A part that interacts with the subject of a case or requirement: the driver, the service engineer, an external system.

## Can be declared in

- a use case, requirement, verification or analysis body

## Can specialize, be typed by, or refer to

- a part definition

## What separates it from [[Stakeholder]]

An actor takes part in the interaction. A stakeholder has an interest in the outcome and may never interact.

## Example

```sysml
actor driver : Operator;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
