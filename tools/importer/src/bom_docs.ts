/* BOM document lines and standard values (D-0172).
 * BOM-069: a line is a document when its name starts with a document word, or its part number ends in a document suffix and the line has
 * quantity zero or the unit ZST. Software and firmware stay parts (BOM-058). The tables were read from the owner's exports.
 * BOM-070: values that differ only in how they are written are read as one value. */

/** MOD-179 document type codes. */
export type DocType = "DWG" | "SCH" | "WI" | "SPEC" | "TDWG" | "EXT" | "MAN" | "SRC" | "GBR" | "PRJ" | "BOM" | "WL" | "DOC";
export const DOC_TYPES: readonly DocType[] = ["DWG", "SCH", "WI", "SPEC", "TDWG", "EXT", "MAN", "SRC", "GBR", "PRJ", "BOM", "WL", "DOC"];

/** First words or phrases of a document's name, tried in order; the first match gives the type. */
const BOM_DOC_WORDS: ReadonlyArray<readonly [RegExp, DocType]> = [
  [/^(?:DWG|DRAWING|FAB)\b/, "DWG"],
  [/^(?:SCH|SCHEM|SCHEMATIC)\b/, "SCH"],
  [/^(?:PACKING|PACKAGING) INSTR/, "WI"],
  [/^(?:PROC|PROCEDURE|INSTR|INST|INSTRUCTIONS?)\b/, "WI"],
  [/^(?:MANUAL|MNL)\b/, "MAN"],
  [/^(?:SPEC|SPECIFICATION)\b/, "SPEC"],
  [/^PAINT REQUIREMENTS\b/, "SPEC"],
  [/^SOURCE\b/, "SRC"],
  [/^(?:GERBERS?|GBR)\b/, "GBR"],
  [/^PROJECT\b/, "PRJ"],
  [/^BOM\b/, "BOM"],
  [/^WIRE LIST\b/, "WL"],
];
/** Software and firmware part numbers are parts (BOM-058), whatever their quantity. */
const BOM_SOFTWARE = /^(?:SW|BOM_SOFTWARE|SFTWR|FIRMWARE|FW)\b/;
/** Part-number suffixes that mark a document when the line has quantity zero or the unit ZST. */
export const DOC_SUFFIXES: Readonly<Record<string, DocType>> = { "20": "DWG", "30": "SCH", "50": "DWG", "51": "SRC", "52": "SPEC", "60": "DWG", "61": "PRJ", "62": "DWG", "65": "GBR", "75": "WI", "76": "MAN", "79": "WI", "91": "DWG" };

const bomDocNameKey = (name: string): string => name.toUpperCase().replace(/\s+/g, " ").trim();
export const bomDocWord = (name: string): DocType | null => { const n = bomDocNameKey(name); if (BOM_SOFTWARE.test(n)) return null; for (const [re, t] of BOM_DOC_WORDS) if (re.test(n)) return t; return null; };
export const bomDocSuffix = (pn: string): DocType | null => { const m = /-(\d{2})$/.exec(pn.trim()); return m ? DOC_SUFFIXES[m[1]!] ?? null : null; };
const bomIsZeroText = (amount: string): boolean => /^-?\d+(\.\d+)?$/.test(amount.trim()) && +amount === 0;

/** BOM-069: the document type of a line, or null for a part. `suffixCheck` is set for a part whose part number has a document suffix. */
export function bomDocType(name: string, pn: string, amount: string, zst: boolean): { type: DocType | null; suffixCheck: boolean } {
  if (BOM_SOFTWARE.test(bomDocNameKey(name))) return { type: null, suffixCheck: false };
  const w = bomDocWord(name); if (w) return { type: w, suffixCheck: false };
  const s = bomDocSuffix(pn); if (!s) return { type: null, suffixCheck: false };
  return bomIsZeroText(amount) || zst ? { type: s, suffixCheck: false } : { type: null, suffixCheck: true };
}

// ---- BOM-070 standard values --------------------------------------------------------------------------------------------
/** A number written with thousands separators (`1,000`, `12,500.5`) without them; anything else unchanged. */
export const bomNumberText = (s: string): string => (/^-?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(s.trim()) ? s.trim().replace(/,/g, "") : s);
/** Runs of spaces inside a name become one. */
export const bomNameText = (s: string): string => s.replace(/\s+/g, " ").trim();
/** A manufacturer part number with a trailing "OR EQUIVALENT" (also OR EQUIV, OR EQUAL) split from the phrase. */
export function bomMpnText(s: string): { mpn: string; equivalent: boolean } {
  const m = /^(.*?)[\s,;]+OR\s+(?:EQUIVALENT|EQUIV|EQUAL)\.?\s*$/i.exec(s.trim());
  return m && m[1]!.trim() ? { mpn: m[1]!.trim(), equivalent: true } : { mpn: s.trim(), equivalent: false };
}
/** The key under which manufacturer names are the same name: case, spaces and punctuation ignored. */
export const bomMfrKey = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");
/** For each manufacturer key, the spelling used most (the first met on a tie) and the other spellings with their counts. */
export function bomMfrSpellings(names: string[]): Map<string, { use: string; others: Array<[string, number]> }> {
  const by = new Map<string, Map<string, number>>();
  for (const n of names) { const t = n.trim(); if (!t) continue; const k = bomMfrKey(t); if (!k) continue; const m = by.get(k) ?? by.set(k, new Map()).get(k)!; m.set(t, (m.get(t) ?? 0) + 1); }
  const out = new Map<string, { use: string; others: Array<[string, number]> }>();
  for (const [k, m] of by) { const all = [...m]; let best = all[0]!; for (const x of all) if (x[1] > best[1]) best = x; out.set(k, { use: best[0], others: all.filter((x) => x[0] !== best[0]) }); }
  return out;
}
/** ECO numbers in a cell's text, in order, each once. */
export const bomEcoNumbers = (s: string): string[] => [...new Set([...s.matchAll(/\bECO-\d+\b/gi)].map((m) => m[0].toUpperCase()))];
