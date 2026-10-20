---
type: Language Element
id: occurrence-usage
kind: usage
keyword: "occurrence name : Type"
metaclass: OccurrenceUsage
usage: rare
status: Draft
---
# Occurrence usage

**Usage** · **Rare** · `occurrence name : Type` · SysML v2 metaclass `OccurrenceUsage`

A use of an occurrence definition. Prefix forms (`individual`, `snapshot`, `timeslice`) say which slice or particular it is.

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- occurrence definitions (`:`), or other occurrence usages it subsets (`:>`)

## What separates it from [[Part usage]]

Use the specific usage (part, item, action) when one fits; a plain occurrence is the generic parent.

## Example

```sysml
occurrence charging : Charge;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Rare.
