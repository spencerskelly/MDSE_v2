---
type: Language Element
id: verification-usage
kind: usage
keyword: "verification name : Type"
metaclass: VerificationCaseUsage
usage: core
status: Draft
---
# Verification case usage

**Usage** · **Everyday** · `verification name : Type` · SysML v2 metaclass `VerificationCaseUsage`

A use of a verification case applied to a subject (`verification v : TestCharger;`).

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- verification case definitions (`:`), or other verification case usages it subsets (`:>`)

## What separates it from [[Verify]]

A verification usage is the planned test or inspection. A verify usage inside its objective names the requirement it checks.

## Example

```sysml
verification test1 : TestCharger;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Everyday.
