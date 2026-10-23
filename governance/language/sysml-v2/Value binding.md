---
type: Language Element
id: value
category: language
kind: structure
keyword: "= expr  :=  default = expr"
metaclass: "FeatureValue"
usage: common
status: Draft
---
# Value binding

**Language construct** · **Structure** · **Common** · `= expr  :=  default = expr` · SysML v2 metaclass `FeatureValue`

Gives a usage a value or a default value (`ratedPower = 30 [kW]`). `:=` is an initial value, `default =` can be overridden.

## Can be declared in

- an attribute or reference usage

## Can specialize, be typed by, or refer to

- an expression

## What separates it from [[Redefinition]]

A value binds the usage's value; redefinition changes the usage itself.

## Example

```sysml
attribute ratedPower : PowerValue = 30 [kW];
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
