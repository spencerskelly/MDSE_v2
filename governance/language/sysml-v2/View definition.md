---
type: Language Element
id: view-def
category: language
kind: definition
keyword: "view def"
metaclass: "ViewDefinition"
usage: occasional
status: Draft
---
# View definition

**Language construct** · **Definition** · **Occasional** · `view def` · SysML v2 metaclass `ViewDefinition`

A definition of a rendered selection of model content that answers a viewpoint.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another view definition (specialization, `:>`)

## What separates it from [[Viewpoint definition]]

A viewpoint definition says what view is needed and for whom. A view definition is the thing that shows it.

## Example

```sysml
view def PowerView;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
