---
type: Language Element
id: prefix-metadata
kind: annotation
keyword: "#Tag part x;"
metaclass: MetadataUsage
usage: occasional
status: Draft
---
# Prefix metadata

**Annotation** · **Occasional** · `#Tag part x;` · SysML v2 metaclass `MetadataUsage`

Applies a metadata definition to an element with `#` in front of its declaration.

## Can be declared in

- any element declaration

## Can specialize, be typed by, or refer to

- a metadata definition

## What separates it from [[Metadata annotation]]

A prefix is shorthand for the same annotation written as `@Tag` in the body.

## Example

```sysml
#Safety part brake;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
