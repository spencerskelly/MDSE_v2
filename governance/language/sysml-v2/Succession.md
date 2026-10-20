---
type: Language Element
id: succession
kind: relationship
keyword: "first a then b;"
metaclass: SuccessionAsUsage
usage: core
status: Draft
---
# Succession

**Relationship** · **Everyday** · `first a then b;` · SysML v2 metaclass `SuccessionAsUsage`

States that one occurrence (action, state, event) ends before another starts.

## Eligible from (source)

- an action, state or other occurrence usage

## Eligible to (target)

- an action, state or other occurrence usage

## What separates it from [[Transition]]

A succession orders two occurrences with no trigger or guard. A transition moves between states and can carry a trigger, guard and effect.

## Example

```sysml
first start then charge;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Everyday use:** Everyday.
