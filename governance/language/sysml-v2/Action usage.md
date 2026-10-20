---
type: Language Element
id: action-usage
kind: usage
keyword: "action name : Type"
metaclass: ActionUsage
usage: core
status: Draft
---
# Action usage

**Usage** · **Everyday** · `action name : Type` · SysML v2 metaclass `ActionUsage`

A step of behaviour inside another action or a part (`action charge : ChargeVehicle;`).

## Can be declared in

- a definition body that allows this kind
- another usage body
- a package (as a top-level usage)

## Can specialize, be typed by, or refer to

- action definitions (`:`), or other action usages it subsets (`:>`)

## What separates it from [[Perform]]

An action usage is a step owned by its parent. A perform usage says that a part performs an action defined elsewhere.

## Example

```sysml
action charge : ChargeVehicle;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Everyday use:** Everyday.
