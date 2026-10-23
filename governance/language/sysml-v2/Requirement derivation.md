---
type: Language Element
id: derivation-connection
category: library
kind: relationship
keyword: "#derivation connection { end #original ::> A; end #derive ::> B; }"
metaclass: "ConnectionUsage typed by Derivation (RequirementDerivation library)"
library: "RequirementDerivation, DerivationConnections"
usage: common
status: Draft
---
# Requirement derivation

**Standard library concept** · **Relationship** · **Common** · `#derivation connection { end #original ::> A; end #derive ::> B; }` · SysML v2 standard library (RequirementDerivation, DerivationConnections), not a language keyword. Metaclass: `ConnectionUsage typed by Derivation (RequirementDerivation library)`

States that one or more requirements were derived from an original requirement. It is a standard-library concept, not a language keyword: the `Derivation` connection definition plus the `#derivation`, `#original` and `#derive` metadata. The original is one requirement; the derived side is one or more. Only requirements take part.

## Eligible from (source)

- a requirement (the original, exactly one)

## Eligible to (target)

- requirements (the derived ones, one or more)

## What separates it from [[Dependency]]

A dependency only says one element depends on another. A derivation says specific requirements follow from an original. It is not containment (a requirement usage nested in another requirement) and not satisfaction (a design element meets a requirement). MDSE writes this native form (D-0045). Older notes may still carry `dependency … // derivedFrom`; the Workbench reads it and rewrites it in this form when the relationship is edited.

## Example

```sysml
#derivation connection { end #original ::> RemoteControl; end #derive ::> RemoteStart; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
