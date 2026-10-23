---
type: Language Element
id: status-info-metadata
category: library
kind: annotation
keyword: "@StatusInfo { status = StatusKind::open; }"
metaclass: "MetadataUsage of StatusInfo (ModelingMetadata library)"
library: "ModelingMetadata"
usage: occasional
status: Draft
---
# Status information

**Standard library concept** · **Annotation** · **Occasional** · `@StatusInfo { status = StatusKind::open; }` · SysML v2 standard library (ModelingMetadata), not a language keyword. Metaclass: `MetadataUsage of StatusInfo (ModelingMetadata library)`

Metadata that records the work status of an element: `status` is one of `open`, `tbd`, `tbr`, `tbc`, `done`, `closed`, with an optional originator, owner and risk.

## Can be declared in

- any element

## Can specialize, be typed by, or refer to

- StatusInfo
- StatusKind values

## What separates it from [[Rationale]]

StatusInfo is the SysML v2 library's own status vocabulary. An MDSE note's `status` property (Draft, Retired and so on) is a different property and the two are not synchronized.

## Example

```sysml
@StatusInfo { status = StatusKind::open; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
