---
type: Language Element
id: visibility
kind: structure
keyword: "public | protected | private"
metaclass: VisibilityKind
usage: occasional
status: Draft
---
# Visibility

**Structure** · **Occasional** · `public | protected | private` · SysML v2 metaclass `VisibilityKind`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
