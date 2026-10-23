---
type: Language Element
id: textual-representation
category: language
kind: annotation
keyword: "rep language \"x\" /* code */"
metaclass: "TextualRepresentation"
usage: rare
status: Draft
---
# Textual representation

**Language construct** · **Annotation** · **Rare** · `rep language "x" /* code */` · SysML v2 metaclass `TextualRepresentation`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
