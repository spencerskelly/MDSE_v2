---
type: Language Element
id: ownership-vs-reference
category: pattern
kind: structure
keyword: "part x : T;  ref part y : T;"
metaclass: "PartUsage and ReferenceUsage"
usage: common
status: Draft
---
# Ownership and reference

**Modeling pattern** · **Structure** · **Common** · `part x : T;  ref part y : T;` · Modeling pattern built from language constructs, not a construct of its own

A usage declared without `ref` is owned by the definition that holds it (part, port, action, state). A `ref` usage points at something owned elsewhere and owns nothing. This decides whether a part is counted in an assembly.

## Can be declared in

- a definition or usage body

## Can specialize, be typed by, or refer to

- definitions of the same kind

## What separates it from [[Reference usage]]

An owned part belongs to the assembly and is counted in its parts list. A referenced part belongs to something else and is not counted twice.

## Example

```sysml
part def Charger { part controller : Controller; ref part supply : PowerSource; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
