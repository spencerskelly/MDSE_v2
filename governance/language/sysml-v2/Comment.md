---
type: Language Element
id: comment
kind: annotation
keyword: "comment /* text */"
metaclass: Comment
usage: core
status: Draft
---
# Comment

**Annotation** · **Everyday** · `comment /* text */` · SysML v2 metaclass `Comment`

Free text attached to an element or to the enclosing namespace. Unlike `//` or `/* */` that tools drop, a `comment` is a model element that is kept.

## Can be declared in

- any element or namespace

## Can specialize, be typed by, or refer to

- the annotated element(s) via `about`

## What separates it from [[Documentation]]

A comment is a note about elements and may be anywhere. Documentation (`doc`) is the description of its owner.

## Example

```sysml
comment about Charger /* Rated for 480 VAC */
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Everyday.
