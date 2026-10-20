---
type: Language Element
id: library-package
kind: structure
keyword: "library package Name { }"
metaclass: LibraryPackage
usage: occasional
status: Draft
---
# Library package

**Structure** · **Occasional** · `library package Name { }` · SysML v2 metaclass `LibraryPackage`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
