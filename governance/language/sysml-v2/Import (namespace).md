---
type: Language Element
id: import-namespace
category: language
kind: relationship
keyword: "import Pkg::*;  import Pkg::**;"
metaclass: "NamespaceImport"
usage: common
status: Draft
---
# Import (namespace)

**Language construct** · **Relationship** · **Common** · `import Pkg::*;  import Pkg::**;` · SysML v2 metaclass `NamespaceImport`

Makes every public member of another namespace visible. `::*` brings the direct members, `::**` brings the members of nested namespaces as well.

## Eligible from (source)

- a package or namespace

## Eligible to (target)

- another namespace

## What separates it from [[Import (membership)]]

A namespace import brings in everything; a membership import brings in one named member.

## Example

```sysml
import Library::*;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
