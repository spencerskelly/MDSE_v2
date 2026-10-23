---
type: Language Element
id: verification-def
category: language
kind: definition
keyword: "verification def"
metaclass: "VerificationCaseDefinition"
usage: core
status: Draft
---
# Verification case definition

**Language construct** · **Definition** · **Everyday** · `verification def` · SysML v2 metaclass `VerificationCaseDefinition`

A definition of how requirements are verified: a subject, a method and an objective that verifies requirements and returns a verdict.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another verification case definition (specialization, `:>`)

## What separates it from [[Analysis case definition]]

A verification case ends in a verdict on requirements. An analysis case ends in a computed result.

## Example

```sysml
verification def TestCharger;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
