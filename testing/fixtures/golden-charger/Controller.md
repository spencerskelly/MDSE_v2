---
type: Object
subtype: electrical
id: OBJ-99001
uid: 20261018230000001skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: ControllerLibrary::Controller
fixture: true
---
# Controller

Synthetic reusable definition and typed CAN port.

## Rationale

A reusable definition is not a physical occurrence in a charger. See [Charger](Charger.md) for the owning contextual part usage.



## SysML v2

> **Authoritative SysML v2 text.** Write your notes above this section. Change the model through Workbench, or edit this block and re-run the parser check.

```sysml
package ControllerLibrary {
    port def CanPort;
    part def Controller {
        port can : CanPort;
    }
}
```
