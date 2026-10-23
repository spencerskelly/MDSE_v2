---
type: Language Element
id: multiplicity
category: language
kind: structure
keyword: "[n]  [lo..hi]  [*]"
metaclass: "MultiplicityRange"
usage: core
status: Draft
---
# Multiplicity

**Language construct** · **Structure** · **Everyday** · `[n]  [lo..hi]  [*]` · SysML v2 metaclass `MultiplicityRange`

How many of a usage may exist: `[3]`, `[0..1]`, `[1..*]`. This is how quantities live in the model.

## Can be declared in

- a usage declaration

## Can specialize, be typed by, or refer to

- none

## What separates it from [[Feature modifiers]]

Multiplicity changes how many; modifiers change what kind.

## Example

```sysml
part modules : PowerModule[3];
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
