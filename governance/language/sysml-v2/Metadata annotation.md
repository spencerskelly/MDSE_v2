---
type: Language Element
id: metadata-feature
kind: annotation
keyword: "@Tag { field = v; }"
metaclass: MetadataUsage
usage: occasional
status: Draft
---
# Metadata annotation

**Annotation** · **Occasional** · `@Tag { field = v; }` · SysML v2 metaclass `MetadataUsage`

Attaches a metadata value to an element in its body (`@Safety { level = 3; }`) or to others with `about`.

## Can be declared in

- any element

## Can specialize, be typed by, or refer to

- a metadata definition

## What separates it from [[Prefix metadata]]

Same meaning as `#Tag`; the body form can set fields.

## Example

```sysml
@Safety { level = 3; }
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
