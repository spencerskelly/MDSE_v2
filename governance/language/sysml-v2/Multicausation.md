---
type: Language Element
id: multicausation-connection
category: library
kind: relationship
keyword: "#multicausation connection { end #cause ::> A; end #cause ::> B; end #effect ::> C; }"
metaclass: "ConnectionUsage typed by Multicausation (CauseAndEffect library)"
library: "CauseAndEffect, CausationConnections"
usage: occasional
status: Draft
---
# Multicausation

**Standard library concept** · **Relationship** · **Occasional** · `#multicausation connection { end #cause ::> A; end #cause ::> B; end #effect ::> C; }` · SysML v2 standard library (CauseAndEffect, CausationConnections), not a language keyword. Metaclass: `ConnectionUsage typed by Multicausation (CauseAndEffect library)`

States that several causes together bring about one or more effects. A standard-library concept: `Multicausation` has one or more cause ends and one or more effect ends, and the causes and effects must be disjoint. `Causation` is its one-cause, one-effect form.

## Eligible from (source)

- occurrence usages (the causes, one or more)

## Eligible to (target)

- occurrence usages (the effects, one or more)

## What separates it from [[Causation]]

A causation links one cause to one effect. A multicausation groups several causes (and effects) in one statement, so a failure analysis can say that two conditions together lead to a hazard.

## Example

```sysml
#multicausation connection { end #cause ::> overcurrent; end #cause ::> overtemp; end #effect ::> trip; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
