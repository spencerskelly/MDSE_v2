---
type: Language Element
id: port-def
category: language
kind: definition
keyword: "port def"
metaclass: "PortDefinition"
usage: core
status: Draft
---
# Port definition

**Language construct** · **Definition** · **Everyday** · `port def` · SysML v2 metaclass `PortDefinition`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
