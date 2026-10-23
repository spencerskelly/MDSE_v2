---
type: Language Element
id: trade-study
category: library
kind: usage
keyword: "analysis name : TradeStudy { subject = (A, B); objective : MaximizeObjective; }"
metaclass: "AnalysisCaseUsage typed by TradeStudy (TradeStudies library)"
library: "TradeStudies"
usage: occasional
status: Draft
---
# Trade study

**Standard library concept** · **Usage** · **Occasional** · `analysis name : TradeStudy { subject = (A, B); objective : MaximizeObjective; }` · SysML v2 standard library (TradeStudies), not a language keyword. Metaclass: `AnalysisCaseUsage typed by TradeStudy (TradeStudies library)`

A standard analysis case that compares alternatives and selects one. It has a subject (the alternatives), an evaluation function that scores each alternative, and an objective that is `MaximizeObjective` or `MinimizeObjective`; the result is the selected alternative.

## Can be declared in

- a definition body that allows an analysis case usage
- a package (as a top-level usage)

## Can specialize, be typed by, or refer to

- TradeStudy, or a definition that specializes it
- alternatives (the subject)
- MaximizeObjective or MinimizeObjective

## What separates it from [[Analysis case usage]]

A general analysis case computes any result about a subject. A trade study is the library's pattern for choosing among alternatives with an evaluation function and a maximize or minimize objective.

## Example

```sysml
analysis chargerStudy : TradeStudy { subject : Charger = (chargerA, chargerB); objective : MaximizeObjective; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
