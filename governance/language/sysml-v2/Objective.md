---
type: Language Element
id: objective-usage
category: language
kind: usage
keyword: "objective { }"
metaclass: "ObjectiveMembership"
usage: common
status: Draft
---
# Objective

**Language construct** · **Usage** · **Common** · `objective { }` · SysML v2 metaclass `ObjectiveMembership`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
