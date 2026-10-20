---
type: Language Element
id: send-action-usage
kind: statement
keyword: "send p via port;"
metaclass: SendActionUsage
usage: common
status: Draft
---
# Send

**Statement** · **Common** · `send p via port;` · SysML v2 metaclass `SendActionUsage`

An action that sends a payload through a port or to a target.

## Eligible from (source)

- an action or state body

## Eligible to (target)

- a payload and a target

## What separates it from [[Accept]]

Send transmits; accept receives.

## Example

```sysml
action a { send s via out1; }
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
