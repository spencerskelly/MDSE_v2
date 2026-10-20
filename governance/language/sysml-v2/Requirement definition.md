---
type: Language Element
id: requirement-def
kind: definition
keyword: "requirement def"
metaclass: RequirementDefinition
usage: core
status: Draft
---
# Requirement definition

**Definition** · **Everyday** · `requirement def` · SysML v2 metaclass `RequirementDefinition`

A definition of a stated need: a subject, a text and constraints that a design must meet.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another requirement definition (specialization, `:>`)

## What separates it from [[Constraint definition]]

A requirement definition is a constraint with a subject, an id and a text that stakeholders own. A constraint definition is a pure condition with no stakeholder.

## Example

```sysml
requirement def RemoteControl { doc /* ... */ }
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Everyday.
