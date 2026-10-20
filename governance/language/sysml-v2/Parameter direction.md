---
type: Language Element
id: parameter
kind: structure
keyword: "in x; out y; inout z"
metaclass: Feature
usage: core
status: Draft
---
# Parameter direction

**Structure** · **Everyday** · `in x; out y; inout z` · SysML v2 metaclass `Feature`

The direction keywords on a usage declare whether it is an input, an output or both of its owner (`in`, `out`, `inout`). They apply to action, calc, constraint and port members.

## Can be declared in

- a usage in an action, calc, constraint, case or port

## Can specialize, be typed by, or refer to

- none

## What separates it from [[Return]]

`in`/`out` declare typed parameters; `return` declares the single result of a calc.

## Example

```sysml
action a { in x : Real; out y : Real; }
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Everyday.
