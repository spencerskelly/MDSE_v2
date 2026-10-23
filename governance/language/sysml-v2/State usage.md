---
type: Language Element
id: state-usage
category: language
kind: usage
keyword: "state name : Type"
metaclass: "StateUsage"
usage: common
status: Draft
---
# State usage

**Language construct** · **Usage** · **Common** · `state name : Type` · SysML v2 metaclass `StateUsage`

A state of its owner, possibly with nested states (`state ready;`).

## Can be declared in

- a definition body that allows this kind
- another usage body
- a package (as a top-level usage)

## Can specialize, be typed by, or refer to

- state definitions (`:`), or other state usages it subsets (`:>`)

## What separates it from [[Exhibit]]

A state usage belongs to its owner. An exhibit usage says a part exhibits a state machine defined elsewhere.

## Example

```sysml
state ready;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
