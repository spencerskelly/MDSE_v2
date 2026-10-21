---
type: Language Element
id: reference-usage
kind: usage
keyword: "ref x : Type;"
metaclass: ReferenceUsage
usage: common
status: Draft
---
# Reference usage

**Usage** · **Common** · `ref x : Type;` · SysML v2 metaclass `ReferenceUsage`

A usage that points at something owned elsewhere, such as a parameter, a subject or an end. It owns nothing.

## Can be declared in

- a definition or usage body

## Can specialize, be typed by, or refer to

- any definition

## What separates it from [[Attribute usage]]

A reference does not own its value; an attribute usage owns it.

## Example

```sysml
ref part primary : Controller;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
