---
type: Language Element
id: requirement-decomposition
category: pattern
kind: structure
keyword: "requirement def R { requirement sub : S; ref requirement other : T; }"
metaclass: "RequirementUsage (nested) and ReferenceUsage"
usage: common
status: Draft
---
# Requirement decomposition

**Modeling pattern** · **Structure** · **Common** · `requirement def R { requirement sub : S; ref requirement other : T; }` · Modeling pattern built from language constructs, not a construct of its own

A requirement is broken into parts by nesting requirement usages inside it. The parent owns the nested ones. A requirement that lives elsewhere is pointed at with `ref requirement` and is not owned.

## Can be declared in

- a requirement definition or usage

## Can specialize, be typed by, or refer to

- requirement definitions (nested usages) or any requirement (references)

## What separates it from [[Requirement derivation]]

Decomposition is ownership: the parts are inside the parent, so removing the parent removes them. Derivation links two requirements that each stand alone. Satisfaction links a requirement to the design that meets it. Do not use nesting to say one requirement came from another.

## Example

```sysml
requirement def Charging { requirement overTemp : OverTemperatureLimit; ref requirement standard : UL2594; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
