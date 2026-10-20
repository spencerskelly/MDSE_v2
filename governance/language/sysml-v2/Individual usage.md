---
type: Language Element
id: individual-usage
kind: usage
keyword: "individual name : Type"
metaclass: IndividualUsage
usage: rare
status: Draft
---
# Individual usage

**Usage** · **Rare** · `individual name : Type` · SysML v2 metaclass `IndividualUsage`

A usage that refers to one individual over its life; combine with `snapshot` and `timeslice` for states in time.

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- individual definitions (`:`), or other individual usages it subsets (`:>`)

## What separates it from [[Part usage]]

Use an individual only when one concrete thing matters (a test article); otherwise model the class.

## Example

```sysml
individual part unit1 : TestUnit001;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Rare.
