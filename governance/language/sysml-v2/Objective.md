---
type: Language Element
id: objective-usage
kind: usage
keyword: "objective { }"
metaclass: ObjectiveMembership
usage: common
status: Draft
---
# Objective

**Usage** · **Common** · `objective { }` · SysML v2 metaclass `ObjectiveMembership`

The goal of a case: the requirement(s) a verification must show, or what an analysis must answer.

## Can be declared in

- a case, analysis or verification body

## Can specialize, be typed by, or refer to

- a requirement usage

## What separates it from [[Requirement usage]]

An objective is the requirement owned by a case; a requirement usage stands on its own in a tree.

## Example

```sysml
verification def V { objective { verify r; } }
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
