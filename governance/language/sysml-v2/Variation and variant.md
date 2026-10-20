---
type: Language Element
id: variation
kind: structure
keyword: "variation part def V { variant part a; }"
metaclass: VariantMembership
usage: occasional
status: Draft
---
# Variation and variant

**Structure** · **Occasional** · `variation part def V { variant part a; }` · SysML v2 metaclass `VariantMembership`

Declares a variation point whose members are the allowed choices (variants). A configuration picks one.

## Can be declared in

- a definition or usage marked `variation`

## Can specialize, be typed by, or refer to

- variant usages

## What separates it from [[Specialization (definition)]]

Variants live inside one variation point and are chosen per configuration; specialization creates a permanent subtype.

## Example

```sysml
variation part def Cable { variant part short : ShortCable; variant part long : LongCable; }
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
