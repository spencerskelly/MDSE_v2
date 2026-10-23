---
type: Language Element
id: subsetting
category: language
kind: relationship
keyword: "usage :> otherUsage"
metaclass: "Subsetting"
usage: common
status: Draft
---
# Subsetting

**Language construct** · **Relationship** · **Common** · `usage :> otherUsage` · SysML v2 metaclass `Subsetting`

The relationship that says the things a usage identifies are a subset of the things another usage identifies (`part leftWheel :> wheels`). The subsetting usage inherits the other's type and multiplicity bounds.

## Eligible from (source)

- a usage

## Eligible to (target)

- another usage of a compatible kind, in an ancestor definition

## What separates it from [[Redefinition]]

Subsetting adds a narrower usage next to the original, which still exists. Redefinition replaces the original inside this context.

## Example

```sysml
part leftWheel :> wheels;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
