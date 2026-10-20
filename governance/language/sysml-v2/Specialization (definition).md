---
type: Language Element
id: specialization
kind: relationship
keyword: "def A :> B"
metaclass: Subclassification
usage: core
status: Draft
---
# Specialization (definition)

**Relationship** · **Everyday** · `def A :> B` · SysML v2 metaclass `Subclassification`

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

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Everyday use:** Everyday.
