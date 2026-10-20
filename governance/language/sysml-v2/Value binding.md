---
type: Language Element
id: value
kind: structure
keyword: "= expr  :=  default = expr"
metaclass: FeatureValue
usage: common
status: Draft
---
# Value binding

**Structure** · **Common** · `= expr  :=  default = expr` · SysML v2 metaclass `FeatureValue`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
