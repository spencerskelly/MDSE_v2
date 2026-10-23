---
type: Language Element
id: include-use-case-usage
category: language
kind: relationship
keyword: "include use case u : UseCase;"
metaclass: "IncludeUseCaseUsage"
usage: common
status: Draft
---
# Include

**Language construct** · **Relationship** · **Common** · `include use case u : UseCase;` · SysML v2 metaclass `IncludeUseCaseUsage`

States that one use case always runs another as part of itself.

## Eligible from (source)

- a use case

## Eligible to (target)

- a use case

## What separates it from [[Use case usage]]

An include is mandatory reuse inside a use case. SysML v2 has no extend relationship (its grammar has no `extend` keyword), so a v1 extend is not translated to a v2 construct. MDSE writes it as a plain use case usage with multiplicity `[0..1]`, which is an MDSE convention that other SysML v2 tools read as an optional nested use case.

## Example

```sysml
include use case pay : Pay;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
