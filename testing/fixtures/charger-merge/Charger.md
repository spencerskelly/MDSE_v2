---
type: Object
subtype: electrical
id: OBJ-00002
uid: 20260101000000001skellyspencer
status: Draft
eaType: Class:Hardware Component
tags: []
sourceRole: authoritative-model
primarySymbol: OBJ_00002::Charger
---
# Charger

Main charger board.



## Source: EA

- EA GUID: {BBBB}
- PN: CHG-1

## SysML v2

> **Authoritative SysML v2 text.** Write your notes above this section. Change the model through Workbench, or edit this block and re-run the parser check.

```sysml
package OBJ_00002 {
    part def Charger {
        port dcOut : OBJ_00001::DcPort;
    }
}
```
