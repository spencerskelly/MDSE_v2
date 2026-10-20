---
type: Language Element
id: transition-usage
kind: relationship
keyword: "transition first a accept sig if g do act then b;"
metaclass: TransitionUsage
usage: common
status: Draft
---
# Transition

**Relationship** · **Common** · `transition first a accept sig if g do act then b;` · SysML v2 metaclass `TransitionUsage`

A move from one state (or action) to the next, with an optional trigger (`accept`), guard (`if`) and effect (`do`).

## Eligible from (source)

- a state (the source)

## Eligible to (target)

- a state (the target)

## What separates it from [[Succession]]

A transition has a trigger, guard and effect and applies between states. A succession only orders.

## Example

```sysml
transition first idle accept start then charging;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Everyday use:** Common.
