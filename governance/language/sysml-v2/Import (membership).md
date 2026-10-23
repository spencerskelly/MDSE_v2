---
type: Language Element
id: import-membership
category: language
kind: relationship
keyword: "import Pkg::Name;"
metaclass: "MembershipImport"
usage: core
status: Draft
---
# Import (membership)

**Language construct** · **Relationship** · **Everyday** · `import Pkg::Name;` · SysML v2 metaclass `MembershipImport`

Makes a member of another namespace visible by its simple name in this one. The imported element stays owned by its original namespace.

## Eligible from (source)

- a package or namespace

## Eligible to (target)

- one element of another namespace

## What separates it from [[Alias]]

An import makes an element visible without a new name. An alias gives it a second name.

## Example

```sysml
import Library::PowerPort;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
