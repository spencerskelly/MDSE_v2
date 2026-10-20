---
type: Language Element
id: framed-concern-usage
kind: usage
keyword: "frame concern c;"
metaclass: FramedConcernMembership
usage: occasional
status: Draft
---
# Frame

**Usage** · **Occasional** · `frame concern c;` · SysML v2 metaclass `FramedConcernMembership`

Names a concern that a requirement or viewpoint addresses.

## Can be declared in

- a requirement or viewpoint body

## Can specialize, be typed by, or refer to

- a concern

## What separates it from [[Concern usage]]

`frame` puts the concern into the requirement or viewpoint; a concern usage on its own is a standalone interest.

## Example

```sysml
viewpoint def V { frame concern safety : Safety; }
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
