---
type: Language Element
id: succession-flow-usage
category: language
kind: relationship
keyword: "succession flow of P from a to b;"
metaclass: "SuccessionFlowUsage"
usage: occasional
status: Draft
---
# Succession flow

**Language construct** · **Relationship** · **Occasional** · `succession flow of P from a to b;` · SysML v2 metaclass `SuccessionFlowUsage`

A flow whose source must finish before the target starts.

## Eligible from (source)

- an output of an occurrence

## Eligible to (target)

- an input of an occurrence

## What separates it from [[Flow]]

A succession flow adds ordering. A flow only transfers.

## Example

```sysml
succession flow of Current from a.out to b.in;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
