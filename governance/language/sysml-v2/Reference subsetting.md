---
type: Language Element
id: reference-subsetting
category: language
kind: relationship
keyword: "usage ::> otherFeature"
metaclass: "ReferenceSubsetting"
usage: occasional
status: Draft
---
# Reference subsetting

**Language construct** · **Relationship** · **Occasional** · `usage ::> otherFeature` · SysML v2 metaclass `ReferenceSubsetting`

The relationship that makes a usage refer to another feature rather than own a new one (`::>` or `references`). The usage is a reference to something owned elsewhere.

## Eligible from (source)

- a usage

## Eligible to (target)

- a feature owned elsewhere in the model

## What separates it from [[Subsetting]]

Subsetting makes a new member that is a subset. Reference subsetting makes the usage point at an existing feature and own nothing.

## Example

```sysml
ref part primary ::> controller;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
