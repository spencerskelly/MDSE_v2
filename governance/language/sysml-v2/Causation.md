---
type: Language Element
id: causation-connection
category: library
kind: relationship
keyword: "#causation connection { end #cause ::> A; end #effect ::> B; }"
metaclass: "ConnectionUsage typed by Causation (CauseAndEffect library)"
library: "CauseAndEffect, CausationConnections"
usage: occasional
status: Draft
---
# Causation

**Standard library concept** · **Relationship** · **Occasional** · `#causation connection { end #cause ::> A; end #effect ::> B; }` · SysML v2 standard library (CauseAndEffect, CausationConnections), not a language keyword. Metaclass: `ConnectionUsage typed by Causation (CauseAndEffect library)`

States that one occurrence causes another: a cause and an effect. A standard-library concept (the `Causation` connection definition and the `#causation`, `#cause`, `#effect` metadata). The connection can carry `isNecessary`, `isSufficient` and a `probability` through `CausationMetadata`. Used for failure and fault analysis.

## Eligible from (source)

- an occurrence usage (the cause)

## Eligible to (target)

- an occurrence usage (the effect)

## What separates it from [[Succession]]

A succession orders two occurrences in time. A causation says one brings about the other, which is stronger and says nothing by itself about order of steps in a behavior.

## Example

```sysml
#causation connection { end #cause ::> overheat; end #effect ::> shutdown; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
