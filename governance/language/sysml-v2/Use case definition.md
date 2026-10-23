---
type: Language Element
id: use-case-def
category: language
kind: definition
keyword: "use case def"
metaclass: "UseCaseDefinition"
usage: common
status: Draft
---
# Use case definition

**Language construct** · **Definition** · **Common** · `use case def` · SysML v2 metaclass `UseCaseDefinition`

A definition of how actors use a subject to get a result, with included and extended behaviour.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another use case definition (specialization, `:>`)

## What separates it from [[Action definition]]

An action definition is behaviour. A use case definition is the goal of actors using a subject, which then refers to actions.

## Example

```sysml
use case def ChargeVehicleUseCase;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
