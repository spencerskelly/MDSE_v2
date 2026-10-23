---
type: Language Element
id: comment
category: language
kind: annotation
keyword: "comment /* text */"
metaclass: "Comment"
usage: core
status: Draft
---
# Comment

**Language construct** · **Annotation** · **Everyday** · `comment /* text */` · SysML v2 metaclass `Comment`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
