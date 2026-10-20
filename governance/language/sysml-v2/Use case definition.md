---
type: Language Element
id: use-case-def
kind: definition
keyword: "use case def"
metaclass: UseCaseDefinition
usage: common
status: Draft
---
# Use case definition

**Definition** · **Common** · `use case def` · SysML v2 metaclass `UseCaseDefinition`

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

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
