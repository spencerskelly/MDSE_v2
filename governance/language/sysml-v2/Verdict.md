---
type: Language Element
id: verdict-kind
category: library
kind: annotation
keyword: "return verdict : VerdictKind;"
metaclass: "EnumerationDefinition VerdictKind (VerificationCases library)"
library: "VerificationCases"
usage: common
status: Draft
---
# Verdict

**Standard library concept** · **Annotation** · **Common** · `return verdict : VerdictKind;` · SysML v2 standard library (VerificationCases), not a language keyword. Metaclass: `EnumerationDefinition VerdictKind (VerificationCases library)`

The result of running a verification case. `VerdictKind` has four values: `pass`, `fail`, `inconclusive` and `error`. The library function `PassIf` turns a Boolean into pass or fail.

## Can be declared in

- a verification case definition or usage (its return)

## Can specialize, be typed by, or refer to

- VerdictKind

## What separates it from [[Verification case definition]]

A verification case definition says how a requirement is checked. The verdict is what one execution of it returned. The definition and the result are different things; MDSE keeps the definition in the model and leaves results to the test record.

## Example

```sysml
verification def TestCharger { return verdict : VerdictKind; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
