---
type: Language Element
id: subject-usage
kind: usage
keyword: "subject s : Type;"
metaclass: SubjectMembership
usage: core
status: Draft
---
# Subject

**Usage** · **Everyday** · `subject s : Type;` · SysML v2 metaclass `SubjectMembership`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Everyday.
