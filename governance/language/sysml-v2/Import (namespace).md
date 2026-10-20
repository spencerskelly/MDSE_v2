---
type: Language Element
id: import-namespace
kind: relationship
keyword: "import Pkg::*;  import Pkg::**;"
metaclass: NamespaceImport
usage: common
status: Draft
---
# Import (namespace)

**Relationship** · **Common** · `import Pkg::*;  import Pkg::**;` · SysML v2 metaclass `NamespaceImport`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
