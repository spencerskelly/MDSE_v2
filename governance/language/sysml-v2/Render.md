---
type: Language Element
id: render
category: language
kind: statement
keyword: "render asTree;"
metaclass: "ViewRenderingMembership"
usage: rare
status: Draft
---
# Render

**Language construct** · **Statement** · **Rare** · `render asTree;` · SysML v2 metaclass `ViewRenderingMembership`

Selects how a view is displayed.

## Eligible from (source)

- a view usage

## Eligible to (target)

- a rendering

## What separates it from [[Rendering usage]]

`render` is the statement inside a view; a rendering usage is the thing named.

## Example

```sysml
view v { render asTree; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
