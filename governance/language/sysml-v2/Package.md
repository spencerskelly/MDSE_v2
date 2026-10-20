---
type: Language Element
id: package
kind: structure
keyword: "package Name { }"
metaclass: Package
usage: core
status: Draft
---
# Package

**Structure** · **Everyday** · `package Name { }` · SysML v2 metaclass `Package`

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

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Everyday.
