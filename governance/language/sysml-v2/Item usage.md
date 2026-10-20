---
type: Language Element
id: item-usage
kind: usage
keyword: "item name : Type"
metaclass: ItemUsage
usage: common
status: Draft
---
# Item usage

**Usage** · **Common** · `item name : Type` · SysML v2 metaclass `ItemUsage`

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

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Everyday use:** Common.
