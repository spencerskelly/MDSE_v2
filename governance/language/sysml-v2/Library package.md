---
type: Language Element
id: library-package
category: language
kind: structure
keyword: "library package Name { }"
metaclass: "LibraryPackage"
usage: occasional
status: Draft
---
# Library package

**Language construct** · **Structure** · **Occasional** · `library package Name { }` · SysML v2 metaclass `LibraryPackage`

A package marked as reusable library content, such as units, quantities or a company part catalog.

## Can be declared in

- the model root
- another package

## Can specialize, be typed by, or refer to

- its members

## What separates it from [[Package]]

Same structure as a package; the `library` marker tells tools it is shared, not project content.

## Example

```sysml
library package Parts { part def Bolt; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
