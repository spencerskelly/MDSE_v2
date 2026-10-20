---
type: Language Element
id: port-usage
kind: usage
keyword: "port name : Type"
metaclass: PortUsage
usage: core
status: Draft
---
# Port usage

**Usage** · **Everyday** · `port name : Type` · SysML v2 metaclass `PortUsage`

A named interaction point on a part, typed by a port definition. A `~` before the type makes it the conjugate (inputs and outputs reversed).

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- port definitions (`:`), or other port usages it subsets (`:>`)

## What separates it from [[Part usage]]

A port is a boundary of its owner; a part is a component inside it.

## Example

```sysml
port acIn : PowerPort;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Everyday use:** Everyday.
