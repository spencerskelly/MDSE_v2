---
type: Language Element
id: redefinition
kind: relationship
keyword: "usage :>> inheritedUsage"
metaclass: Redefinition
usage: common
status: Draft
---
# Redefinition

**Relationship** · **Common** · `usage :>> inheritedUsage` · SysML v2 metaclass `Redefinition`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
