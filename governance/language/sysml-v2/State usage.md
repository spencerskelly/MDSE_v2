---
type: Language Element
id: state-usage
kind: usage
keyword: "state name : Type"
metaclass: StateUsage
usage: common
status: Draft
---
# State usage

**Usage** · **Common** · `state name : Type` · SysML v2 metaclass `StateUsage`

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

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Everyday use:** Common.
