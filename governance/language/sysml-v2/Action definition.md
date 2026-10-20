---
type: Language Element
id: action-def
kind: definition
keyword: "action def"
metaclass: ActionDefinition
usage: core
status: Draft
---
# Action definition

**Definition** · **Everyday** · `action def` · SysML v2 metaclass `ActionDefinition`

A definition of behaviour: something that happens, with inputs, outputs and a decomposition into steps.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another action definition (specialization, `:>`)

## What separates it from [[State definition]]

A state definition describes what a thing is in over time, with entry, do and exit. An action definition is what happens, step by step.

## Example

```sysml
action def ChargeVehicle;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Everyday.
