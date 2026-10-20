---
type: Language Element
id: state-def
kind: definition
keyword: "state def"
metaclass: StateDefinition
usage: common
status: Draft
---
# State definition

**Definition** · **Common** · `state def` · SysML v2 metaclass `StateDefinition`

A definition of a condition a thing can be in, with entry, do and exit behaviour and transitions to other states.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another state definition (specialization, `:>`)

## What separates it from [[Action definition]]

An action definition describes behaviour that finishes. A state definition describes a condition that persists until a transition leaves it.

## Example

```sysml
state def ChargerStates;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
