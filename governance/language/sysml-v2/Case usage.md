---
type: Language Element
id: case-usage
kind: usage
keyword: "case name : Type"
metaclass: CaseUsage
usage: rare
status: Draft
---
# Case usage

**Usage** · **Rare** · `case name : Type` · SysML v2 metaclass `CaseUsage`

A use of a generic case definition in a context, with its subject and objective. Prefer the specific usage kinds.

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- case definitions (`:`), or other case usages it subsets (`:>`)

## What separates it from [[Use case usage]]

Prefer use case, analysis or verification; use plain case only for something that fits none.

## Example

```sysml
case c : GenericCase;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Rare.
