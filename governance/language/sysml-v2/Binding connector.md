---
type: Language Element
id: bind
category: language
kind: relationship
keyword: "bind a = b;"
metaclass: "BindingConnectorAsUsage"
usage: common
status: Draft
---
# Binding connector

**Language construct** · **Relationship** · **Common** · `bind a = b;` · SysML v2 metaclass `BindingConnectorAsUsage`

States that two features always have the same value or identify the same thing.

## Eligible from (source)

- a feature

## Eligible to (target)

- a feature of a compatible type

## What separates it from [[Connection (connect)]]

Binding says two features are equal. A connection says they are linked and may be distinct.

## Example

```sysml
bind controller.id = id;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
