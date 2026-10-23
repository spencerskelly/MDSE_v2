---
type: Language Element
id: verify-requirement-usage
category: language
kind: relationship
keyword: "verify Req;"
metaclass: "RequirementVerificationUsage"
usage: core
status: Draft
---
# Verify

**Language construct** · **Relationship** · **Everyday** · `verify Req;` · SysML v2 metaclass `RequirementVerificationUsage`

Inside a verification objective, names a requirement the case verifies.

## Eligible from (source)

- a verification case objective

## Eligible to (target)

- a requirement definition or usage

## What separates it from [[Satisfy]]

Verify belongs to a verification case and records how a requirement is checked. Satisfy belongs to the design and says it is met.

## Example

```sysml
verification def V { objective { verify RemoteControl; } }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
