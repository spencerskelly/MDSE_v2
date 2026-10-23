---
type: Language Element
id: concern-usage
category: language
kind: usage
keyword: "concern name : Type"
metaclass: "ConcernUsage"
usage: occasional
status: Draft
---
# Concern usage

**Language construct** · **Usage** · **Occasional** · `concern name : Type` · SysML v2 metaclass `ConcernUsage`

A use of a concern, framed by a viewpoint or requirement (`frame concern`).

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- concern definitions (`:`), or other concern usages it subsets (`:>`)

## What separates it from [[Frame]]

A concern usage is a standalone interest. A framed concern usage is a concern placed inside a viewpoint or requirement via `frame`.

## Example

```sysml
concern serviceability : Serviceability;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
