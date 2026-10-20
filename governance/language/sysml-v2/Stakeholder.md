---
type: Language Element
id: stakeholder-usage
kind: usage
keyword: "stakeholder name : PartDef;"
metaclass: StakeholderMembership
usage: occasional
status: Draft
---
# Stakeholder

**Usage** · **Occasional** · `stakeholder name : PartDef;` · SysML v2 metaclass `StakeholderMembership`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
