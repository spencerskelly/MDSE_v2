---
type: Language Element
id: stakeholder-usage
category: language
kind: usage
keyword: "stakeholder name : PartDef;"
metaclass: "StakeholderMembership"
usage: occasional
status: Draft
---
# Stakeholder

**Language construct** · **Usage** · **Occasional** · `stakeholder name : PartDef;` · SysML v2 metaclass `StakeholderMembership`

A party with an interest in a requirement or viewpoint.

## Can be declared in

- a requirement or viewpoint body

## Can specialize, be typed by, or refer to

- a part definition

## What separates it from [[Actor]]

A stakeholder cares about the outcome; an actor performs in the scenario.

## Example

```sysml
stakeholder owner : Owner;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
