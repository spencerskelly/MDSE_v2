# BOM Revision Review

Approved 2026-10-25: use BOM-designated current revision, preserve assembly-level older-revision usages, add `noteReview` YAML linking to one shared `Old Revision Usage` note, and eliminate redundant old-revision flags without suppressing real errors.

Implementation must verify designation from source fields rather than assuming greatest alphanumeric revision is current. The shared review index must merge idempotently across four BOMs and preserve provenance. Revision history remains on assembly usages in SysML; review navigation stays in YAML. Missing current designations remain reviewable. This note is a design contract, not implementation acceptance.
