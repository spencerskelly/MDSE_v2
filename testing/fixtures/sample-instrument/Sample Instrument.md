---
type: Object
subtype: part
id: OBJ-99004
uid: 20261018230000004skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: FictionalProduct::SampleInstrument
fixture: true
---
# Sample Instrument

**Fictional test example — no industrial product data.**

This sample exists to test v2 structure and navigation. Its authoritative model text is the `SysML v2` section at the bottom of this note. The authoritative structural relationships are in that SysML text. Future Obsidian Canvas, where-used, and tabular exports should derive from that source.

## Fictional parts

- Control Unit — logical controller example
- Sensor Unit — measurement example
- Power Unit — generic supply example
- Operator Panel — human interaction example

## Intended relationships

- A parent-owned typed part usage for each unit
- A synthetic measurement signal connection
- Requirements, behavior, verification, BOM and issue fixtures will be added as **separate fabricated notes**, with validity tested against the pinned parser

## Non-goals for this draft

No actual ratings, circuit implementation, product BOM, vendor part numbers, real identifiers, or confidential engineering models.



## SysML v2

> **Authoritative SysML v2 text.** Write your notes above this section. Change the model through Workbench, or edit this block and re-run the parser check.

```sysml
// SYNTHETIC demonstration only. Independent parser validation pending.
package FictionalLibrary {
    port def SignalPort;
    part def ControlUnit {
        port input : SignalPort;
    }
    part def SensorUnit {
        port output : SignalPort;
    }
    part def PowerUnit;
    part def OperatorPanel;
}
package FictionalProduct {
    part def SampleInstrument {
        part control : FictionalLibrary::ControlUnit;
        part sensor : FictionalLibrary::SensorUnit;
        part power : FictionalLibrary::PowerUnit;
        part panel : FictionalLibrary::OperatorPanel;
        connect sensor.output to control.input;
    }
}
```
