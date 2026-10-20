---
type: Object
subtype: electrical
id: OBJ-99002
uid: 20261018230000002skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: PowerLibrary::PowerModule
fixture: true
---
# Power Module

Synthetic reusable definition. The multiple module occurrences belong to the parent Charger declaration.



## SysML v2

> **Authoritative SysML v2 text.** Write your notes above this section. Change the model through Workbench, or edit this block and re-run the parser check.

```sysml
package PowerLibrary {
    part def PowerModule {
        port can : ControllerLibrary::CanPort;
    }
}
```
