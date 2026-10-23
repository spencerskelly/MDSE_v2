---
type: Language Element
id: enum-usage
category: language
kind: usage
keyword: "enum name : Type"
metaclass: "EnumerationUsage"
usage: common
status: Draft
---
# Enumeration usage

**Language construct** · **Usage** · **Common** · `enum name : Type` · SysML v2 metaclass `EnumerationUsage`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
