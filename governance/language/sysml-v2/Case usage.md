---
type: Language Element
id: case-usage
category: language
kind: usage
keyword: "case name : Type"
metaclass: "CaseUsage"
usage: rare
status: Draft
---
# Case usage

**Language construct** · **Usage** · **Rare** · `case name : Type` · SysML v2 metaclass `CaseUsage`

A use of a generic case definition in a context, with its subject and objective. Prefer the specific usage kinds.

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- case definitions (`:`), or other case usages it subsets (`:>`)

## What separates it from [[Use case usage]]

Prefer use case, analysis or verification; use plain case only for something that fits none.

## Example

```sysml
case c : GenericCase;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
