---
type: Language Element
id: requirement-usage
kind: usage
keyword: "requirement name : Type"
metaclass: RequirementUsage
usage: core
status: Draft
---
# Requirement usage

**Usage** · **Everyday** · `requirement name : Type` · SysML v2 metaclass `RequirementUsage`

A use of a requirement definition at a place in a requirement tree or inside a verification objective.

## Can be declared in

- a definition body that allows this kind
- another usage body
- a package (as a top-level usage)

## Can specialize, be typed by, or refer to

- requirement definitions (`:`), or other requirement usages it subsets (`:>`)

## What separates it from [[Satisfy]]

A requirement usage is the requirement itself in a tree. A satisfy relationship says a design element meets it.

## Example

```sysml
requirement remote : RemoteControl;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Everyday.
