---
type: Language Element
id: verification-def
kind: definition
keyword: "verification def"
metaclass: VerificationCaseDefinition
usage: core
status: Draft
---
# Verification case definition

**Definition** · **Everyday** · `verification def` · SysML v2 metaclass `VerificationCaseDefinition`

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

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Everyday.
