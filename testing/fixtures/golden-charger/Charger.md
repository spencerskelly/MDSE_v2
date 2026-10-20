---
type: Object
subtype: part
id: OBJ-99003
uid: 20261018230000003skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: ChargerProduct::Charger
fixture: true
---
# Charger

Synthetic contextual assembly. Multiplicity denotes three interchangeable power modules, not three separate reusable definitions.

## BOM source evidence — not generated formal assertions

| Internal Part Number | Manufacturing Part Number | Quantity | Interpretation |
|---|---|---:|---|
| CT-100 | MFG-C1 | 2 | Contactor line |
| *(blank)* | MFG-C2 | | Alternate for CT-100 |
| *(blank)* | MFG-C3 | | Alternate for CT-100 |

Per BOM-ALT-001 (RULESET.md, section BOM), manufacturing alternates are not additional required uses, and substitutability needs separate review.

## Source ownership

The parent Charger definition owns its parts. Controller and Power Module notes own only reusable definitions.



## SysML v2

> **Authoritative SysML v2 text.** Write your notes above this section. Change the model through Workbench, or edit this block and re-run the parser check.

```sysml
package ChargerProduct {
    part def Contactor;

    part def Charger {
        part controller : ControllerLibrary::Controller;
        part modules : PowerLibrary::PowerModule[3];
        part contactors : Contactor[2];
    }
}
```
