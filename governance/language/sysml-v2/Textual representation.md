---
type: Language Element
id: textual-representation
kind: annotation
keyword: "rep language \"x\" /* code */"
metaclass: TextualRepresentation
usage: rare
status: Draft
---
# Textual representation

**Annotation** · **Rare** · `rep language "x" /* code */` · SysML v2 metaclass `TextualRepresentation`

Embeds code in another language (a formula, a script) as the body of a model element.

## Can be declared in

- any element

## Can specialize, be typed by, or refer to

- code text

## What separates it from [[Documentation]]

Documentation is human text; a textual representation is executable or parseable in the named language.

## Example

```sysml
calc c { language "Python" /* return 1 */ }
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Rare.
