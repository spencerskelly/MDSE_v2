---
type: Language Element
id: subject-usage
category: language
kind: usage
keyword: "subject s : Type;"
metaclass: "SubjectMembership"
usage: core
status: Draft
---
# Subject

**Language construct** · **Usage** · **Everyday** · `subject s : Type;` · SysML v2 metaclass `SubjectMembership`

The thing a requirement, case or analysis is about. In a requirement the subject is what must satisfy it.

## Can be declared in

- a requirement, case or view body

## Can specialize, be typed by, or refer to

- a definition

## What separates it from [[Reference usage]]

The subject is a special reference with a role; a plain reference has none.

## Example

```sysml
requirement def R { subject c : Charger; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
