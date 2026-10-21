---
type: Language Element
id: bind
kind: relationship
keyword: "bind a = b;"
metaclass: BindingConnectorAsUsage
usage: common
status: Draft
---
# Binding connector

**Relationship** · **Common** · `bind a = b;` · SysML v2 metaclass `BindingConnectorAsUsage`

States that two features always have the same value or identify the same thing.

## Eligible from (source)

- a feature

## Eligible to (target)

- a feature of a compatible type

## What separates it from [[Connection (connect)]]

Binding says two features are equal. A connection says they are linked and may be distinct.

## Example

```sysml
bind controller.id = id;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
