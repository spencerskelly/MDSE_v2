---
type: Language Element
id: viewpoint-usage
category: language
kind: usage
keyword: "viewpoint name : Type"
metaclass: "ViewpointUsage"
usage: occasional
status: Draft
---
# Viewpoint usage

**Language construct** · **Usage** · **Occasional** · `viewpoint name : Type` · SysML v2 metaclass `ViewpointUsage`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
