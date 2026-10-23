---
type: Language Element
id: use-case-usage
category: language
kind: usage
keyword: "use case name : Type"
metaclass: "UseCaseUsage"
usage: common
status: Draft
---
# Use case usage

**Language construct** · **Usage** · **Common** · `use case name : Type` · SysML v2 metaclass `UseCaseUsage`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
