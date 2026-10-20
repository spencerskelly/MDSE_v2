---
type: Language Element
id: modifiers
kind: structure
keyword: "abstract | variation | ref | readonly | derived | end | constant | ordered | nonunique"
metaclass: Feature
usage: common
status: Draft
---
# Feature modifiers

**Structure** · **Common** · `abstract | variation | ref | readonly | derived | end | constant | ordered | nonunique` · SysML v2 metaclass `Feature`

Prefix and suffix words that change how a definition or usage behaves: `abstract` (cannot be instantiated), `variation` (choose one variant), `ref` (reference only), `derived`, `ordered`, `nonunique`, `end` (a connection end).

## Can be declared in

- a definition or usage declaration

## Can specialize, be typed by, or refer to

- none

## What separates it from [[Multiplicity]]

Modifiers change kind and behaviour. Multiplicity changes how many.

## Example

```sysml
abstract part def Vehicle;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
