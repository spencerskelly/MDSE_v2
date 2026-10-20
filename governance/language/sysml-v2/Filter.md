---
type: Language Element
id: filter
kind: statement
keyword: "filter @Safety;"
metaclass: ElementFilterMembership
usage: rare
status: Draft
---
# Filter

**Statement** · **Rare** · `filter @Safety;` · SysML v2 metaclass `ElementFilterMembership`

A Boolean condition on a package that limits which of its members an import or view sees (`filter @Safety;`).

## Eligible from (source)

- a package

## Eligible to (target)

- a Boolean expression, often a metadata test

## What separates it from [[Expose]]

A filter limits what is seen; expose names what a view shows.

## Example

```sysml
filter @Safety;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Rare.
