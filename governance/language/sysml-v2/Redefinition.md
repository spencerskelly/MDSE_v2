---
type: Language Element
id: redefinition
category: language
kind: relationship
keyword: "usage :>> inheritedUsage"
metaclass: "Redefinition"
usage: common
status: Draft
---
# Redefinition

**Language construct** · **Relationship** · **Common** · `usage :>> inheritedUsage` · SysML v2 metaclass `Redefinition`

The relationship that replaces an inherited usage in a specializing definition with a refined one (`:>>` or `redefines`). Use it to narrow a type, fix a value or change a multiplicity in a specialization.

## Eligible from (source)

- a usage in a specializing definition

## Eligible to (target)

- an inherited usage of a compatible kind

## What separates it from [[Subsetting]]

Redefinition replaces; the original is no longer a separate member of the specialization. Subsetting keeps the original and adds a subset of it.

## Example

```sysml
attribute :>> ratedPower = 30 [kW];
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
