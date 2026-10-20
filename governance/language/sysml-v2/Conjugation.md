---
type: Language Element
id: conjugation
kind: relationship
keyword: "port p : ~PortDef"
metaclass: PortConjugation
usage: common
status: Draft
---
# Conjugation

**Relationship** · **Common** · `port p : ~PortDef` · SysML v2 metaclass `PortConjugation`

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

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
