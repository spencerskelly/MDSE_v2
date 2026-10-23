---
type: Language Element
id: port-usage
category: language
kind: usage
keyword: "port name : Type"
metaclass: "PortUsage"
usage: core
status: Draft
---
# Port usage

**Language construct** · **Usage** · **Everyday** · `port name : Type` · SysML v2 metaclass `PortUsage`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
