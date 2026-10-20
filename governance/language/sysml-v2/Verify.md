---
type: Language Element
id: verify-requirement-usage
kind: relationship
keyword: "verify Req;"
metaclass: RequirementVerificationUsage
usage: core
status: Draft
---
# Verify

**Relationship** · **Everyday** · `verify Req;` · SysML v2 metaclass `RequirementVerificationUsage`

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

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Everyday use:** Everyday.
