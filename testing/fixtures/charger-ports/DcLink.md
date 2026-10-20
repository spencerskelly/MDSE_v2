---
type: Object
subtype: interface
id: OBJ-00004
uid: 20260101000000003skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: OBJ_00004::DcLink
---
# DcLink



## SysML v2

> **Authoritative SysML v2 text.** Write your notes above this section. Change the model through Workbench, or edit this block and re-run the parser check.

```sysml
package OBJ_00004 {
    interface def DcLink {
        end supplier : OBJ_00002::DcPort;
        end consumer : ~OBJ_00002::DcPort;
    }
}
```
