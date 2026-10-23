---
type: Language Element
id: requirement-def
category: language
kind: definition
keyword: "requirement def"
metaclass: "RequirementDefinition"
usage: core
status: Draft
---
# Requirement definition

**Language construct** · **Definition** · **Everyday** · `requirement def` · SysML v2 metaclass `RequirementDefinition`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
