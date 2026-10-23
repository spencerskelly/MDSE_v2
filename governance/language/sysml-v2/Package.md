---
type: Language Element
id: package
category: language
kind: structure
keyword: "package Name { }"
metaclass: "Package"
usage: core
status: Draft
---
# Package

**Language construct** · **Structure** · **Everyday** · `package Name { }` · SysML v2 metaclass `Package`

The basic container that groups elements and gives them qualified names. Every model element lives in a package. In MDSE a package is also a note's `package` wrapper and a folder.

## Can be declared in

- the model root
- another package

## Can specialize, be typed by, or refer to

- its members: definitions, usages, imports, annotations

## What separates it from [[Library package]]

A package is for your model content. A library package marks reusable library content and is excluded from some checks.

## Example

```sysml
package Charging { part def Charger; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
