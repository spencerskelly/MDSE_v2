---
type: Language Element
id: port-def
kind: definition
keyword: "port def"
metaclass: PortDefinition
usage: core
status: Draft
---
# Port definition

**Definition** · **Everyday** · `port def` · SysML v2 metaclass `PortDefinition`

A definition of an interaction point on a part: what can enter or leave through it (directed features, nested ports).

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another port definition (specialization, `:>`)

## What separates it from [[Interface definition]]

An interface definition describes a connection between two ports. A port definition describes one end.

## Example

```sysml
port def PowerPort;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Everyday.
