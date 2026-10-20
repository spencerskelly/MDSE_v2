---
type: Language Element
id: concern-usage
kind: usage
keyword: "concern name : Type"
metaclass: ConcernUsage
usage: occasional
status: Draft
---
# Concern usage

**Usage** · **Occasional** · `concern name : Type` · SysML v2 metaclass `ConcernUsage`

A use of a concern, framed by a viewpoint or requirement (`frame concern`).

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- concern definitions (`:`), or other concern usages it subsets (`:>`)

## What separates it from [[Frame]]

A concern usage is a standalone interest. A framed concern usage is a concern placed inside a viewpoint or requirement via `frame`.

## Example

```sysml
concern serviceability : Serviceability;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
