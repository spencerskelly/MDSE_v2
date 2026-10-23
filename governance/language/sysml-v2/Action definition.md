---
type: Language Element
id: action-def
category: language
kind: definition
keyword: "action def"
metaclass: "ActionDefinition"
usage: core
status: Draft
---
# Action definition

**Language construct** · **Definition** · **Everyday** · `action def` · SysML v2 metaclass `ActionDefinition`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
