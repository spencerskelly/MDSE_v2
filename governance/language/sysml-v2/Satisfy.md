---
type: Language Element
id: satisfy-requirement-usage
category: language
kind: relationship
keyword: "satisfy Req by Element;"
metaclass: "SatisfyRequirementUsage"
usage: core
status: Draft
---
# Satisfy

**Language construct** · **Relationship** · **Everyday** · `satisfy Req by Element;` · SysML v2 metaclass `SatisfyRequirementUsage`

States that a design element (a part, action or state) satisfies a requirement. It does not prove it; verification does.

## Eligible from (source)

- a part, action, state or other definition or usage (the satisfier)

## Eligible to (target)

- a requirement definition or usage

## What separates it from [[Verify]]

Satisfy says the design meets the requirement. Verify says a test or analysis shows it does.

## Example

```sysml
satisfy RemoteControl by Charger;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
