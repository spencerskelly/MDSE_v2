---
type: Language Element
id: exhibit-state-usage
kind: relationship
keyword: "exhibit state name : StateDef;"
metaclass: ExhibitStateUsage
usage: common
status: Draft
---
# Exhibit

**Relationship** · **Common** · `exhibit state name : StateDef;` · SysML v2 metaclass `ExhibitStateUsage`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
