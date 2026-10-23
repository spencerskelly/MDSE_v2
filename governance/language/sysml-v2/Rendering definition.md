---
type: Language Element
id: rendering-def
category: language
kind: definition
keyword: "rendering def"
metaclass: "RenderingDefinition"
usage: rare
status: Draft
---
# Rendering definition

**Language construct** · **Definition** · **Rare** · `rendering def` · SysML v2 metaclass `RenderingDefinition`

A definition of how a view's content is presented (tree, table, diagram).

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another rendering definition (specialization, `:>`)

## What separates it from [[View definition]]

A view selects content. A rendering decides how it looks.

## Example

```sysml
rendering def AsTable;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
