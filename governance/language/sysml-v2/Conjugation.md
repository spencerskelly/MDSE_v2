---
type: Language Element
id: conjugation
category: language
kind: relationship
keyword: "port p : ~PortDef"
metaclass: "PortConjugation"
usage: common
status: Draft
---
# Conjugation

**Language construct** · **Relationship** · **Common** · `port p : ~PortDef` · SysML v2 metaclass `PortConjugation`

The relationship that makes a port definition the mirror of another: inputs become outputs and outputs become inputs (`~` before the type). It saves writing a second definition for the other end of an interface.

## Eligible from (source)

- a port usage, or a conjugated port definition

## Eligible to (target)

- a port definition

## What separates it from [[Feature typing]]

Typing gives the usage the definition's features as written. Conjugation gives them reversed in direction.

## Example

```sysml
port acOut : ~PowerPort;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
