---
type: Language Element
id: part-usage
kind: usage
keyword: "part name : Type"
metaclass: PartUsage
usage: core
status: Draft
---
# Part usage

**Usage** · **Everyday** · `part name : Type` · SysML v2 metaclass `PartUsage`

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

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Everyday use:** Everyday.
