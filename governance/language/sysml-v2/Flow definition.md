---
type: Language Element
id: flow-def
kind: definition
keyword: "flow def"
metaclass: FlowDefinition
usage: common
status: Draft
---
# Flow definition

**Definition** · **Common** · `flow def` · SysML v2 metaclass `FlowDefinition`

A definition of an item flow: what is transferred between two features (a payload type and ends).

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another flow definition (specialization, `:>`)

## What separates it from [[Connection definition]]

A flow definition is about something moving. A connection definition is a link with no direction of travel.

## Example

```sysml
flow def CurrentFlow;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
