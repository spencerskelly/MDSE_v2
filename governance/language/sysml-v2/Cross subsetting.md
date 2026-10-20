---
type: Language Element
id: cross-subsetting
kind: relationship
keyword: "end x crosses y"
metaclass: CrossSubsetting
usage: rare
status: Draft
---
# Cross subsetting

**Relationship** · **Rare** · `end x crosses y` · SysML v2 metaclass `CrossSubsetting`

The relationship that says what a connection end sees from the far end of the connection (`crosses`). It defines the navigation across an association.

## Eligible from (source)

- a connection end

## Eligible to (target)

- a feature reachable from the other end

## What separates it from [[Reference subsetting]]

Cross subsetting is about navigation across a connection end. Reference subsetting is a plain reference.

## Example

```sysml
end part a crosses b.c;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Rare.
