---
type: Language Element
id: specialization
category: language
kind: relationship
keyword: "def A :> B"
metaclass: "Subclassification"
usage: core
status: Draft
---
# Specialization (definition)

**Language construct** · **Relationship** · **Everyday** · `def A :> B` · SysML v2 metaclass `Subclassification`

The relationship that makes one definition a more specific kind of another. The specializing definition inherits every feature of the general one and may add or narrow features.

## Eligible from (source)

- a definition

## Eligible to (target)

- a definition of the same kind (a part def specializes a part def)

## What separates it from [[Feature typing]]

Specialization relates two definitions (kind of). Typing relates a usage to its definition (instance of). A part def `Charger :> MHECharger` is a kind of MHE charger; a part `c : Charger` is one charger.

## Example

```sysml
part def Charger :> MHECharger;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
