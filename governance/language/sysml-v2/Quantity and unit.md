---
type: Language Element
id: quantity-unit
category: library
kind: annotation
keyword: "attribute x : ISQ::PowerValue = 30 [SI::kW];"
metaclass: "AttributeUsage typed by a quantity value (ISQ, SI, Quantities libraries)"
library: "ISQ, SI, USCustomaryUnits, Quantities, MeasurementReferences"
usage: common
status: Draft
---
# Quantity and unit

**Standard library concept** · **Annotation** · **Common** · `attribute x : ISQ::PowerValue = 30 [SI::kW];` · SysML v2 standard library (ISQ, SI, USCustomaryUnits, Quantities, MeasurementReferences), not a language keyword. Metaclass: `AttributeUsage typed by a quantity value (ISQ, SI, Quantities libraries)`

A number with a unit. A quantity kind such as `ISQ::PowerValue` says what is measured, a unit such as `SI::kW` says how, and a dimension says what kind of quantity a unit measures. Units can be converted and scales (for example temperature) are separate from units.

## Can be declared in

- an attribute usage

## Can specialize, be typed by, or refer to

- a quantity kind (ISQ), a unit (SI, USCustomaryUnits), a dimension

## What separates it from [[Value binding]]

A plain value is just a number. A quantity carries a unit and a quantity kind, so 30 kW and 30 W are never confused. Never guess a unit from a name (IMP rules); write the unit the source states.

## Example

```sysml
attribute ratedPower : ISQ::PowerValue = 30 [SI::kW];
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
