---
type: Language Element
id: attribute-usage
kind: usage
keyword: "attribute name : Type"
metaclass: AttributeUsage
usage: core
status: Draft
---
# Attribute usage

**Usage** · **Everyday** · `attribute name : Type` · SysML v2 metaclass `AttributeUsage`

A named value held by a definition or usage, typed by an attribute definition (for example `ratedPower : PowerValue`).

## Can be declared in

- a definition body that allows this kind
- another usage body
- a package (as a top-level usage)

## Can specialize, be typed by, or refer to

- attribute definitions (`:`), or other attribute usages it subsets (`:>`)

## What separates it from [[Reference usage]]

An attribute usage is a value owned by its parent. A reference usage only points at something owned elsewhere.

## Example

```sysml
attribute ratedPower : PowerValue;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Everyday.
