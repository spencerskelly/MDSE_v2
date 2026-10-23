---
type: Language Element
id: reference-usage
category: language
kind: usage
keyword: "ref x : Type;"
metaclass: "ReferenceUsage"
usage: common
status: Draft
---
# Reference usage

**Language construct** · **Usage** · **Common** · `ref x : Type;` · SysML v2 metaclass `ReferenceUsage`

A usage that points at something owned elsewhere, such as a parameter, a subject or an end. It owns nothing.

## Can be declared in

- a definition or usage body

## Can specialize, be typed by, or refer to

- any definition

## What separates it from [[Attribute usage]]

A reference does not own its value; an attribute usage owns it.

## Example

```sysml
ref part primary : Controller;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
