---
type: Language Element
id: alias
category: language
kind: relationship
keyword: "alias Short for Pkg::LongName;"
metaclass: "Membership"
usage: occasional
status: Draft
---
# Alias

**Language construct** · **Relationship** · **Occasional** · `alias Short for Pkg::LongName;` · SysML v2 metaclass `Membership`

Gives an existing element another name in a namespace. The element is not copied or owned by the alias.

## Eligible from (source)

- a package or namespace

## Eligible to (target)

- any element

## What separates it from [[Import (membership)]]

An alias adds a second name; an import adds visibility under the existing name.

## Example

```sysml
alias PC for Charger;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
