---
type: Language Element
id: feature-typing
kind: relationship
keyword: "usage : Definition"
metaclass: FeatureTyping
usage: core
status: Draft
---
# Feature typing

**Relationship** · **Everyday** · `usage : Definition` · SysML v2 metaclass `FeatureTyping`

The relationship that says a usage is an instance of a definition (`part c : Charger`). The usage gets the definition's features.

## Eligible from (source)

- a usage

## Eligible to (target)

- one or more definitions of a compatible kind

## What separates it from [[Specialization (definition)]]

Typing is usage to definition (this is one of those). Specialization is definition to definition (this is a kind of that).

## Example

```sysml
part controller : Controller;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Everyday use:** Everyday.
