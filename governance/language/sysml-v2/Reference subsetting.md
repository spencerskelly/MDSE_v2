---
type: Language Element
id: reference-subsetting
kind: relationship
keyword: "usage ::> otherFeature"
metaclass: ReferenceSubsetting
usage: occasional
status: Draft
---
# Reference subsetting

**Relationship** · **Occasional** · `usage ::> otherFeature` · SysML v2 metaclass `ReferenceSubsetting`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
