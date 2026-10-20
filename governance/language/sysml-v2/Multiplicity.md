---
type: Language Element
id: multiplicity
kind: structure
keyword: "[n]  [lo..hi]  [*]"
metaclass: MultiplicityRange
usage: core
status: Draft
---
# Multiplicity

**Structure** · **Everyday** · `[n]  [lo..hi]  [*]` · SysML v2 metaclass `MultiplicityRange`

How many of a usage may exist: `[3]`, `[0..1]`, `[1..*]`. This is how quantities live in the model.

## Can be declared in

- a usage declaration

## Can specialize, be typed by, or refer to

- none

## What separates it from [[Feature modifiers]]

Multiplicity changes how many; modifiers change what kind.

## Example

```sysml
part modules : PowerModule[3];
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Everyday.
