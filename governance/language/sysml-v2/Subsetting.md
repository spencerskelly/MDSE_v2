---
type: Language Element
id: subsetting
kind: relationship
keyword: "usage :> otherUsage"
metaclass: Subsetting
usage: common
status: Draft
---
# Subsetting

**Relationship** · **Common** · `usage :> otherUsage` · SysML v2 metaclass `Subsetting`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
