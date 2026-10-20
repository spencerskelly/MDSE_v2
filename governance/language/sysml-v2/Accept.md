---
type: Language Element
id: accept-action-usage
kind: statement
keyword: "accept p : Payload;"
metaclass: AcceptActionUsage
usage: common
status: Draft
---
# Accept

**Statement** · **Common** · `accept p : Payload;` · SysML v2 metaclass `AcceptActionUsage`

An action that waits to receive a payload (a signal, an item) and then proceeds.

## Eligible from (source)

- an action or state body

## Eligible to (target)

- a payload type

## What separates it from [[Send]]

Accept receives; send transmits.

## Example

```sysml
action a { accept s : Start; }
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
