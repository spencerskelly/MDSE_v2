---
type: Language Element
id: documentation
kind: annotation
keyword: "doc /* text */"
metaclass: Documentation
usage: core
status: Draft
---
# Documentation

**Annotation** · **Everyday** · `doc /* text */` · SysML v2 metaclass `Documentation`

The description of the element that owns it. Requirements keep their text here.

## Can be declared in

- any element (owner)

## Can specialize, be typed by, or refer to

- none (text)

## What separates it from [[Comment]]

Documentation describes its owner and has no `about`; a comment may annotate others.

## Example

```sysml
part def Charger { doc /* A 30 kW DC charger. */ }
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Everyday.
