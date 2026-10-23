---
type: Language Element
id: item-usage
category: language
kind: usage
keyword: "item name : Type"
metaclass: "ItemUsage"
usage: common
status: Draft
---
# Item usage

**Language construct** · **Usage** · **Common** · `item name : Type` · SysML v2 metaclass `ItemUsage`

One use of an item definition: a payload on a flow, or something a part carries or stores.

## Can be declared in

- a definition body that allows this kind
- another usage body
- a package (as a top-level usage)

## Can specialize, be typed by, or refer to

- item definitions (`:`), or other item usages it subsets (`:>`)

## What separates it from [[Part usage]]

An item usage is typically the payload of a flow or something held; a part usage is a component in the decomposition.

## Example

```sysml
item cableAssembly : Cable;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
