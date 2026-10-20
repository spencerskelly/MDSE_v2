---
type: Language Element
id: use-case-usage
kind: usage
keyword: "use case name : Type"
metaclass: UseCaseUsage
usage: common
status: Draft
---
# Use case usage

**Usage** · **Common** · `use case name : Type` · SysML v2 metaclass `UseCaseUsage`

A use of a use case, in the subject's context (`use case charge : ChargeVehicleUseCase;`).

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- use case definitions (`:`), or other use case usages it subsets (`:>`)

## What separates it from [[Include]]

A use case usage is a goal. An include usage embeds another use case inside it.

## Example

```sysml
use case charge : ChargeVehicleUseCase;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Everyday use:** Common.
