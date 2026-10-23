---
type: Language Element
id: part-usage
category: language
kind: usage
keyword: "part name : Type"
metaclass: "PartUsage"
usage: core
status: Draft
---
# Part usage

**Language construct** · **Usage** · **Everyday** · `part name : Type` · SysML v2 metaclass `PartUsage`

A particular use of a part definition inside an owning context: this assembly contains one of these, in this role.

## Can be declared in

- a definition body that allows this kind
- another usage body
- a package (as a top-level usage)

## Can specialize, be typed by, or refer to

- part definitions (`:`), or other part usages it subsets (`:>`)

## What separates it from [[Item usage]]

A part usage is a structural member of its owner (the controller inside the charger). An item usage is something that moves or is handled and is not decomposed as part of the system.

## Example

```sysml
part controller : Controller;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
