---
type: Language Element
id: actor-usage
kind: usage
keyword: "actor name : PartDef;"
metaclass: ActorMembership
usage: common
status: Draft
---
# Actor

**Usage** · **Common** · `actor name : PartDef;` · SysML v2 metaclass `ActorMembership`

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

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
