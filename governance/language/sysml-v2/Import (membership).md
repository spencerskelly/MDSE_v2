---
type: Language Element
id: import-membership
kind: relationship
keyword: "import Pkg::Name;"
metaclass: MembershipImport
usage: core
status: Draft
---
# Import (membership)

**Relationship** · **Everyday** · `import Pkg::Name;` · SysML v2 metaclass `MembershipImport`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Everyday.
