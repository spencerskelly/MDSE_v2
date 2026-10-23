---
type: Language Element
id: action-usage
category: language
kind: usage
keyword: "action name : Type"
metaclass: "ActionUsage"
usage: core
status: Draft
---
# Action usage

**Language construct** · **Usage** · **Everyday** · `action name : Type` · SysML v2 metaclass `ActionUsage`

A step of behaviour inside another action or a part (`action charge : ChargeVehicle;`).

## Can be declared in

- a definition body that allows this kind
- another usage body
- a package (as a top-level usage)

## Can specialize, be typed by, or refer to

- action definitions (`:`), or other action usages it subsets (`:>`)

## What separates it from [[Perform]]

An action usage is a step owned by its parent. A perform usage says that a part performs an action defined elsewhere.

## Example

```sysml
action charge : ChargeVehicle;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
