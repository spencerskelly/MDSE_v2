---
type: Language Element
id: visibility
category: language
kind: structure
keyword: "public | protected | private"
metaclass: "VisibilityKind"
usage: occasional
status: Draft
---
# Visibility

**Language construct** · **Structure** · **Occasional** · `public | protected | private` · SysML v2 metaclass `VisibilityKind`

Controls whether a member is visible from outside its namespace.

## Can be declared in

- a member declaration

## Can specialize, be typed by, or refer to

- none

## What separates it from [[Import (membership)]]

Visibility limits what can be seen; an import chooses what to bring in.

## Example

```sysml
private part hidden;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
