---
type: Language Element
id: documentation
category: language
kind: annotation
keyword: "doc /* text */"
metaclass: "Documentation"
usage: core
status: Draft
---
# Documentation

**Language construct** · **Annotation** · **Everyday** · `doc /* text */` · SysML v2 metaclass `Documentation`

The description of the element that owns it. Requirements keep their text here.

## Can be declared in

- any element (owner)

## Can specialize, be typed by, or refer to

- none (text)

## What separates it from [[Comment]]

Documentation describes its owner and has no `about`; a comment may annotate others.

## Example

```sysml
part def Charger { doc /* A 30 kW DC charger. */ }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
