---
type: Language Element
id: alias
kind: relationship
keyword: "alias Short for Pkg::LongName;"
metaclass: Membership
usage: occasional
status: Draft
---
# Alias

**Relationship** · **Occasional** · `alias Short for Pkg::LongName;` · SysML v2 metaclass `Membership`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
