---
type: Language Element
id: state-def
category: language
kind: definition
keyword: "state def"
metaclass: "StateDefinition"
usage: common
status: Draft
---
# State definition

**Language construct** · **Definition** · **Common** · `state def` · SysML v2 metaclass `StateDefinition`

A definition of a condition a thing can be in, with entry, do and exit behaviour and transitions to other states.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another state definition (specialization, `:>`)

## What separates it from [[Action definition]]

An action definition describes behaviour that finishes. A state definition describes a condition that persists until a transition leaves it.

## Example

```sysml
state def ChargerStates;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
