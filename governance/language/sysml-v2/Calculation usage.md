---
type: Language Element
id: calc-usage
kind: usage
keyword: "calc name : Type"
metaclass: CalculationUsage
usage: common
status: Draft
---
# Calculation usage

**Usage** · **Common** · `calc name : Type` · SysML v2 metaclass `CalculationUsage`

A use of a calculation to derive a value inside a definition.

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- calculation definitions (`:`), or other calculation usages it subsets (`:>`)

## What separates it from [[Attribute usage]]

An attribute usage holds a value. A calculation usage computes it from inputs.

## Example

```sysml
calc p : Power;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
