---
type: Language Element
id: succession-flow-usage
kind: relationship
keyword: "succession flow of P from a to b;"
metaclass: SuccessionFlowUsage
usage: occasional
status: Draft
---
# Succession flow

**Relationship** · **Occasional** · `succession flow of P from a to b;` · SysML v2 metaclass `SuccessionFlowUsage`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
