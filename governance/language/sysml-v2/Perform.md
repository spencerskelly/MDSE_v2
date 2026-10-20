---
type: Language Element
id: perform-action-usage
kind: relationship
keyword: "perform action name : ActionDef;"
metaclass: PerformActionUsage
usage: core
status: Draft
---
# Perform

**Relationship** · **Everyday** · `perform action name : ActionDef;` · SysML v2 metaclass `PerformActionUsage`

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

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Everyday use:** Everyday.
