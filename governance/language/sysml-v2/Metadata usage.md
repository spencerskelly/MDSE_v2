---
type: Language Element
id: metadata-usage
kind: usage
keyword: "metadata name : Type"
metaclass: MetadataUsage
usage: occasional
status: Draft
---
# Metadata usage

**Usage** · **Occasional** · `metadata name : Type` · SysML v2 metaclass `MetadataUsage`

A use that attaches metadata to an element: `@Safety { level = 3; }` or `#Safety part x;`.

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- metadata definitions (`:`), or other metadata usages it subsets (`:>`)

## What separates it from [[Attribute usage]]

Metadata annotates another element; an attribute is a value of its own element.

## Example

```sysml
metadata safety : Safety;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
