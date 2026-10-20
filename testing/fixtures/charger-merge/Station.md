---
type: Object
subtype: mechanical
id: OBJ-00004
uid: 20260101000000003skellyspencer
status: Draft
eaType: Class:Hardware Component
tags: []
sourceRole: authoritative-model
primarySymbol: OBJ_00004::Station
dependsOn: ["[[Charger]]"]
---
# Station

Uses the [[Charger]].



## Source: EA

- EA GUID: {CCCC}

## SysML v2

> **Authoritative SysML v2 text.** Write your notes above this section. Change the model through Workbench, or edit this block and re-run the parser check.

```sysml
package OBJ_00004 {
    part def Station {
        part charger : OBJ_00002::Charger;
    }
}
```
