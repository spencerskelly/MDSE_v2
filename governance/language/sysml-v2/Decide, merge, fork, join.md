---
type: Language Element
id: decision-node
kind: statement
keyword: "decide; merge; fork; join;"
metaclass: ControlNode
usage: common
status: Draft
---
# Decide, merge, fork, join

**Statement** · **Common** · `decide; merge; fork; join;` · SysML v2 metaclass `ControlNode`

Control nodes in an action: `decide` chooses one branch, `merge` rejoins branches, `fork` starts parallel branches, `join` waits for all.

## Eligible from (source)

- an action body

## Eligible to (target)

- successions to and from them

## What separates it from [[Succession]]

A control node is a point in the flow; a succession is the arrow between points.

## Example

```sysml
action a { fork f; join j; }
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
