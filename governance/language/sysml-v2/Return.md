---
type: Language Element
id: return
kind: structure
keyword: "return r : Type;"
metaclass: ReturnParameterMembership
usage: common
status: Draft
---
# Return

**Structure** · **Common** · `return r : Type;` · SysML v2 metaclass `ReturnParameterMembership`

Declares the result of a calculation or expression-bearing definition.

## Can be declared in

- a calc, case or expression

## Can specialize, be typed by, or refer to

- none

## What separates it from [[Parameter direction]]

`return` names the one result; `out` can be any number of outputs.

## Example

```sysml
calc def Double { in x : Real; return : Real = x*2; }
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
