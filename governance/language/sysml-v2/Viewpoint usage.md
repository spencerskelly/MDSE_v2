---
type: Language Element
id: viewpoint-usage
kind: usage
keyword: "viewpoint name : Type"
metaclass: ViewpointUsage
usage: occasional
status: Draft
---
# Viewpoint usage

**Usage** · **Occasional** · `viewpoint name : Type` · SysML v2 metaclass `ViewpointUsage`

A use of a viewpoint that a view conforms to.

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- viewpoint definitions (`:`), or other viewpoint usages it subsets (`:>`)

## What separates it from [[View usage]]

A viewpoint holds the concerns; a view holds the content that answers them.

## Example

```sysml
viewpoint safety : SafetyViewpoint;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
