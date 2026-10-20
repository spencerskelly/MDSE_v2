---
type: Language Element
id: include-use-case-usage
kind: relationship
keyword: "include use case u : UseCase;"
metaclass: IncludeUseCaseUsage
usage: common
status: Draft
---
# Include

**Relationship** · **Common** · `include use case u : UseCase;` · SysML v2 metaclass `IncludeUseCaseUsage`

States that one use case always runs another as part of itself.

## Eligible from (source)

- a use case

## Eligible to (target)

- a use case

## What separates it from [[Use case usage]]

An include is mandatory reuse inside a use case. A plain use case usage `[0..1]` is optional (the MDSE extend form).

## Example

```sysml
include use case pay : Pay;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Everyday use:** Common.
