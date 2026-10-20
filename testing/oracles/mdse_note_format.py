#!/usr/bin/env python3
"""MDSE v2 note format: split, validate and rewrite a note's managed footer.

A v2 note has two zones.

  USER ZONE     frontmatter, title, note text, `## Notes`, aliases, former ids.
                Humans own it. Tooling never rewrites it.
  MANAGED FOOTER  `## Source: EA` (translated notes only) then `## SysML v2`.
                Importer and Workbench own it and may regenerate it.

`## SysML v2` is always the last H2 and holds exactly one fenced `sysml` block,
the authoritative model text (ADR-V2-02). Layout, property order and identity
rules come from V1 Note Layout (W-97..W-99, W-206) and ruleset 1.23 §16; the
class, subtype and id-prefix lists are read from
governance/schemas/element-types.yaml, not copied.

Usage:
    python3 testing/oracles/mdse_note_format.py NOTE.md [NOTE.md ...]   # validate
Exit status is 1 if any issue is found.
"""
from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASS_SCHEMA = ROOT / "governance/schemas/element-types.yaml"

SYSML_HEADING = "## SysML v2"
SOURCE_HEADING = "## Source: EA"
FOOTER_HEADINGS = (SOURCE_HEADING, SYSML_HEADING)
SYSML_HINT = ("> **Authoritative SysML v2 text.** Write your notes above this section. "
              "Change the model through Workbench, or edit this block and re-run the parser check.")

UID = re.compile(r"^\d{17}[a-z-]{13}$")
ID = re.compile(r"^([A-Z]+)-(\d{5})$")
FIXTURE_ID_MIN = 99000  # ids 99000-99999 are reserved for toolchain fixtures, never the real vault
PROPERTY_ORDER = ("type", "subtype", "id", "uid", "status", "eaType", "tags")  # W-97
FENCE_OPEN = re.compile(r"^```sysml[ \t]*$")
COMMENT_ONLY = re.compile(r"^\s*(<!--.*?-->\s*)*$", re.S)


@dataclass
class Issue:
    code: str
    message: str

    def __str__(self) -> str:
        return f"{self.code}: {self.message}"


@dataclass
class Note:
    text: str
    keys: list
    meta: dict
    fm_end: int          # offset just after the closing '---' line
    h2: list             # [(offset, heading_text)] outside code fences, in order


# --------------------------------------------------------------------------- parsing

def _scalar(raw: str) -> str:
    raw = raw.strip()
    if len(raw) >= 2 and raw[0] == raw[-1] and raw[0] in "\"'":
        raw = raw[1:-1]
    return raw


def parse(text: str) -> Note:
    norm = text.replace("\r\n", "\n")
    if not norm.startswith("---\n"):
        raise ValueError("MISSING_FRONTMATTER")
    end = norm.find("\n---\n", 3)
    tail_end = len(norm)
    if end == -1:
        if norm.rstrip("\n").endswith("\n---"):
            end = norm.rstrip("\n").rfind("\n---")
        else:
            raise ValueError("MISSING_FRONTMATTER")
    block = norm[4:end]
    keys, meta = [], {}
    for line in block.split("\n"):
        m = re.match(r"^([A-Za-z][\w-]*):(.*)$", line)
        if m:
            keys.append(m.group(1))
            meta[m.group(1)] = _scalar(m.group(2))
    fm_end = min(end + 5, tail_end)
    h2, in_fence, pos = [], False, 0
    for line in norm.split("\n"):
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
        elif not in_fence and line.startswith("## ") and pos >= fm_end:
            h2.append((pos, line.rstrip()))
        pos += len(line) + 1
    return Note(norm, keys, meta, fm_end, h2)


def _section_offsets(note: Note, heading: str):
    return [(i, off) for i, (off, h) in enumerate(note.h2) if h == heading]


def sysml_section(note: Note):
    """Return the text of the `## SysML v2` section, or None."""
    hits = _section_offsets(note, SYSML_HEADING)
    if not hits:
        return None
    i, off = hits[0]
    stop = note.h2[i + 1][0] if i + 1 < len(note.h2) else len(note.text)
    return note.text[off:stop]


def extract_sysml(text: str):
    """Return the single sysml fence body from the SysML section, or None."""
    sec = sysml_section(parse(text))
    if sec is None:
        return None
    blocks = _fences(sec)
    return blocks[0][0] if len(blocks) == 1 else None


def _fences(section: str):
    """[(body, after_text)] for each ```sysml fence in a section."""
    out, lines, i = [], section.split("\n"), 0
    while i < len(lines):
        if FENCE_OPEN.match(lines[i]):
            j = i + 1
            while j < len(lines) and lines[j].rstrip() != "```":
                j += 1
            body = "\n".join(lines[i + 1:j]) + "\n"
            nxt = i
            k = j + 1
            while k < len(lines) and not FENCE_OPEN.match(lines[k]):
                k += 1
            out.append((body, "\n".join(lines[j + 1:k])))
            i = max(k, j + 1)
        else:
            i += 1
    return out


def qualified_names(sysml: str) -> set:
    """Qualified names of packages and definitions declared in a SysML block (light scan)."""
    src = re.sub(r"/\*.*?\*/", "", sysml, flags=re.S)
    src = re.sub(r"//[^\n]*", "", src)
    tok = re.compile(r"\{|\}|;|\bpackage\s+(\w+)|\b(?:\w+\s+)*?def\s+(\w+)")
    stack, pending, names = [], None, set()
    for m in tok.finditer(src):
        t = m.group(0)
        if t == "{":
            stack.append(pending)
            pending = None
        elif t == "}":
            if stack:
                stack.pop()
            pending = None
        elif t == ";":
            pending = None
        else:
            name = m.group(1) or m.group(2)
            path = [s for s in stack if s]
            names.add("::".join(path + [name]))
            pending = name
    return names


# --------------------------------------------------------------------------- schema

def load_classes():
    import yaml  # PyYAML; CI installs it explicitly
    data = yaml.safe_load(CLASS_SCHEMA.read_text(encoding="utf-8"))
    return {c["name"]: c for c in data["classes"]}


# --------------------------------------------------------------------------- validation

def validate(text: str, classes=None, path: str = "") -> list:
    classes = classes or load_classes()
    try:
        n = parse(text)
    except ValueError as e:
        return [Issue(str(e), "note has no YAML frontmatter")]
    out = []
    m = n.meta

    # Property order (W-97): the governed leading keys, in order, with nothing in between.
    present = [k for k in PROPERTY_ORDER if k in n.keys]
    if n.keys[:len(present)] != present:
        out.append(Issue("PROPERTY_ORDER", f"leading keys must be {present} in that order; found {n.keys[:len(present)]}"))
    for req in ("type", "id", "uid", "status", "tags"):
        if req not in n.keys:
            out.append(Issue("MISSING_PROPERTY", f"`{req}` is required"))

    cls = classes.get(m.get("type", ""))
    if "type" in m and cls is None:
        out.append(Issue("UNKNOWN_TYPE", f"type `{m['type']}` is not a class in element-types.yaml"))
    if cls is not None:
        subs, sub = cls.get("subtype") or [], m.get("subtype", "")
        if subs and sub not in subs:
            out.append(Issue("BAD_SUBTYPE", f"subtype `{sub}` is not allowed for {m['type']} (allowed: {subs})"))
        if not subs and sub:
            out.append(Issue("BAD_SUBTYPE", f"{m['type']} has no subtypes but subtype is `{sub}`"))
    if "id" in m:
        idm = ID.match(m["id"])
        if not idm:
            out.append(Issue("BAD_ID", f"id `{m['id']}` does not match ^[A-Z]+-\\d{{5}}$"))
        elif cls is not None:
            want = (cls.get("prefix_by_subtype") or {}).get(m.get("subtype", ""), cls.get("prefix"))
            if idm.group(1) != want:
                out.append(Issue("ID_PREFIX", f"id prefix `{idm.group(1)}` does not match {m['type']} prefix `{want}`"))
        if m.get("fixture") == "true" and idm and int(idm.group(2)) < FIXTURE_ID_MIN:
            out.append(Issue("FIXTURE_ID_RANGE", f"fixture notes must use ids {FIXTURE_ID_MIN}-99999"))
        if m.get("fixture") != "true" and idm and int(idm.group(2)) >= FIXTURE_ID_MIN:
            out.append(Issue("FIXTURE_ID_RANGE", f"ids {FIXTURE_ID_MIN}-99999 are reserved for fixtures (`fixture: true`)"))
    if "uid" in m and not UID.match(m["uid"]):
        out.append(Issue("BAD_UID", f"uid `{m['uid']}` does not match ^\\d{{17}}[a-z-]{{13}}$"))

    # Footer layout.
    sysml_hits = _section_offsets(n, SYSML_HEADING)
    src_hits = _section_offsets(n, SOURCE_HEADING)
    if len(sysml_hits) > 1:
        out.append(Issue("SYSML_SECTION_COUNT", f"{len(sysml_hits)} `{SYSML_HEADING}` sections; exactly one is allowed"))
    if src_hits and sysml_hits and src_hits[0][0] > sysml_hits[0][0]:
        out.append(Issue("SOURCE_AFTER_SYSML", f"`{SOURCE_HEADING}` must come before `{SYSML_HEADING}`"))
    block = None
    if sysml_hits:
        i = sysml_hits[0][0]
        if i != len(n.h2) - 1:
            out.append(Issue("SYSML_NOT_LAST", f"`{SYSML_HEADING}` must be the last section; found `{n.h2[-1][1]}` after it"))
        fences = _fences(sysml_section(n))
        if len(fences) != 1:
            out.append(Issue("SYSML_FENCE_COUNT", f"`{SYSML_HEADING}` must contain exactly one ```sysml block; found {len(fences)}"))
        else:
            block = fences[0][0]
            if not COMMENT_ONLY.match(fences[0][1]):
                out.append(Issue("SYSML_TRAILING_CONTENT", "text after the sysml block inside the SysML section"))
    upto = sysml_hits[0][1] if sysml_hits else len(n.text)
    stray = len(_fences(n.text[n.fm_end:upto]))
    if stray:
        out.append(Issue("SYSML_OUTSIDE_FOOTER", f"{stray} ```sysml block(s) found above the `{SYSML_HEADING}` section"))

    # SysML ownership properties.
    role, symbol = m.get("sourceRole"), m.get("primarySymbol")
    if role is not None and role != "authoritative-model":
        out.append(Issue("BAD_SOURCE_ROLE", f"sourceRole `{role}` is not `authoritative-model`"))
    if (role or symbol) and block is None:
        out.append(Issue("MISSING_SYSML_BLOCK", "sourceRole/primarySymbol set but the note has no valid SysML block"))
    if role == "authoritative-model" and not symbol:
        out.append(Issue("MISSING_PRIMARY_SYMBOL", "authoritative-model notes need `primarySymbol`"))
    if symbol and block is not None and symbol not in qualified_names(block):
        out.append(Issue("SYMBOL_NOT_DECLARED", f"primarySymbol `{symbol}` is not declared in the SysML block"))
    return out


# --------------------------------------------------------------------------- rewriting

def render_sysml_section(sysml: str, nl: str = "\n") -> str:
    body = sysml.replace("\r\n", "\n").rstrip("\n").split("\n")
    lines = [SYSML_HEADING, "", SYSML_HINT, "", "```sysml", *body, "```"]
    return nl.join(lines) + nl


def replace_sysml_block(text: str, sysml: str) -> str:
    """Return `text` with the SysML section replaced. Everything above it is untouched."""
    nl = "\r\n" if "\r\n" in text else "\n"
    n = parse(text)
    hits = _section_offsets(n, SYSML_HEADING)
    section = render_sysml_section(sysml, nl)
    if hits:
        norm_off = hits[0][1]
        # offsets were computed on the newline-normalised text; map back to the original
        cut = norm_off + (n.text[:norm_off].count("\n") if nl == "\r\n" else 0)
        return text[:cut] + section
    head = text.rstrip("\r\n")
    has_footer = any(h == SOURCE_HEADING for _, h in n.h2)
    gap = nl * (2 if has_footer else 4)  # one blank line after Source: EA, three before a new footer (W-99)
    return head + gap + section


def main(argv) -> int:
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 0 if argv else 2
    classes = load_classes()
    bad, seen_uid, seen_id = 0, {}, {}
    for a in argv:
        p = Path(a)
        text = p.read_text(encoding="utf-8")
        issues = validate(text, classes, a)
        try:
            meta = parse(text).meta
            for key, seen in (("uid", seen_uid), ("id", seen_id)):
                if key in meta:
                    if meta[key] in seen:
                        issues.append(Issue(f"DUPLICATE_{key.upper()}", f"{meta[key]} also used by {seen[meta[key]]}"))
                    seen[meta[key]] = a
        except ValueError:
            pass
        for i in issues:
            print(f"{a}: {i}")
        bad += bool(issues)
    print(f"{len(argv)} note(s) checked; {bad} with issues")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
