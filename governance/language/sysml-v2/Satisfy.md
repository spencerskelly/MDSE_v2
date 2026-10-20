---
type: Language Element
id: satisfy-requirement-usage
kind: relationship
keyword: "satisfy Req by Element;"
metaclass: SatisfyRequirementUsage
usage: core
status: Draft
---
# Satisfy

**Relationship** · **Everyday** · `satisfy Req by Element;` · SysML v2 metaclass `SatisfyRequirementUsage`

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

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Everyday use:** Everyday.
