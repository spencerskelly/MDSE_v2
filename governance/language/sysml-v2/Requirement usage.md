---
type: Language Element
id: requirement-usage
category: language
kind: usage
keyword: "requirement name : Type"
metaclass: "RequirementUsage"
usage: core
status: Draft
---
# Requirement usage

**Language construct** · **Usage** · **Everyday** · `requirement name : Type` · SysML v2 metaclass `RequirementUsage`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
