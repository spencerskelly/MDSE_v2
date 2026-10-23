---
type: Language Element
id: concern-def
category: language
kind: definition
keyword: "concern def"
metaclass: "ConcernDefinition"
usage: occasional
status: Draft
---
# Concern definition

**Language construct** · **Definition** · **Occasional** · `concern def` · SysML v2 metaclass `ConcernDefinition`

A definition of a stakeholder interest that views and requirements address (cost, safety, serviceability).

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another concern definition (specialization, `:>`)

## What separates it from [[Requirement definition]]

A requirement states what must hold. A concern states what someone cares about, before it is turned into requirements.

## Example

```sysml
concern def Serviceability;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
