---
type: Language Element
id: metadata-usage
category: language
kind: usage
keyword: "metadata name : Type"
metaclass: "MetadataUsage"
usage: occasional
status: Draft
---
# Metadata usage

**Language construct** · **Usage** · **Occasional** · `metadata name : Type` · SysML v2 metaclass `MetadataUsage`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
