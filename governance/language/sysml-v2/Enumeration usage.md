---
type: Language Element
id: enum-usage
kind: usage
keyword: "enum name : Type"
metaclass: EnumerationUsage
usage: common
status: Draft
---
# Enumeration usage

**Usage** · **Common** · `enum name : Type` · SysML v2 metaclass `EnumerationUsage`

A use of an enumeration definition: a feature whose value is one of the named values.

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- enumeration definitions (`:`), or other enumeration usages it subsets (`:>`)

## What separates it from [[Attribute usage]]

An attribute usage may hold any value of its type; an enumeration usage holds one of the named values only.

## Example

```sysml
enum mode : Mode;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
