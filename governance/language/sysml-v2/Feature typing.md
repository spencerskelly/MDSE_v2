---
type: Language Element
id: feature-typing
category: language
kind: relationship
keyword: "usage : Definition"
metaclass: "FeatureTyping"
usage: core
status: Draft
---
# Feature typing

**Language construct** · **Relationship** · **Everyday** · `usage : Definition` · SysML v2 metaclass `FeatureTyping`

The relationship that says a usage is an instance of a definition (`part c : Charger`). The usage gets the definition's features.

## Eligible from (source)

- a usage

## Eligible to (target)

- one or more definitions of a compatible kind

## What separates it from [[Specialization (definition)]]

Typing is usage to definition (this is one of those). Specialization is definition to definition (this is a kind of that).

## Example

```sysml
part controller : Controller;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
