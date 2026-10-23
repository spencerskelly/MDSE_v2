---
type: Language Element
id: return
category: language
kind: structure
keyword: "return r : Type;"
metaclass: "ReturnParameterMembership"
usage: common
status: Draft
---
# Return

**Language construct** · **Structure** · **Common** · `return r : Type;` · SysML v2 metaclass `ReturnParameterMembership`

Declares the result of a calculation or expression-bearing definition.

## Can be declared in

- a calc, case or expression

## Can specialize, be typed by, or refer to

- none

## What separates it from [[Parameter direction]]

`return` names the one result; `out` can be any number of outputs.

## Example

```sysml
calc def Double { in x : Real; return : Real = x*2; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
