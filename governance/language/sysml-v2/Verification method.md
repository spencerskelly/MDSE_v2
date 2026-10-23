---
type: Language Element
id: verification-method
category: library
kind: annotation
keyword: "@VerificationMethod { kind = VerificationMethodKind::test; }"
metaclass: "MetadataUsage of VerificationMethod (VerificationCases library)"
library: "VerificationCases"
usage: common
status: Draft
---
# Verification method

**Standard library concept** · **Annotation** · **Common** · `@VerificationMethod { kind = VerificationMethodKind::test; }` · SysML v2 standard library (VerificationCases), not a language keyword. Metaclass: `MetadataUsage of VerificationMethod (VerificationCases library)`

Metadata that records how a verification case checks its requirement. The library names four kinds: `inspect`, `analyze`, `demo` and `test`.

## Can be declared in

- a verification case definition or usage

## Can specialize, be typed by, or refer to

- VerificationMethodKind values (inspect, analyze, demo, test)

## What separates it from [[Verification case definition]]

The method says how (inspection, analysis, demonstration, test). The verification case says what is checked and returns the verdict.

## Example

```sysml
verification def TestCharger { @VerificationMethod { kind = VerificationMethodKind::test; } }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
