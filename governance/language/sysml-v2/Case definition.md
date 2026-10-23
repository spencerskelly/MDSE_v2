---
type: Language Element
id: case-def
category: language
kind: definition
keyword: "case def"
metaclass: "CaseDefinition"
usage: rare
status: Draft
---
# Case definition

**Language construct** · **Definition** · **Rare** · `case def` · SysML v2 metaclass `CaseDefinition`

A generic definition of an analysis, verification or use case that has a subject, objective and result. The specific kinds below are normally used instead.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another case definition (specialization, `:>`)

## What separates it from [[Use case definition]]

A use case definition is a case about actors and a subject using a system. A plain case is the generic parent.

## Example

```sysml
case def GenericCase;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
