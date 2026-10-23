---
type: Language Element
id: parameter
category: language
kind: structure
keyword: "in x; out y; inout z"
metaclass: "Feature"
usage: core
status: Draft
---
# Parameter direction

**Language construct** · **Structure** · **Everyday** · `in x; out y; inout z` · SysML v2 metaclass `Feature`

The direction keywords on a usage declare whether it is an input, an output or both of its owner (`in`, `out`, `inout`). They apply to action, calc, constraint and port members.

## Can be declared in

- a usage in an action, calc, constraint, case or port

## Can specialize, be typed by, or refer to

- none

## What separates it from [[Return]]

`in`/`out` declare typed parameters; `return` declares the single result of a calc.

## Example

```sysml
action a { in x : Real; out y : Real; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
