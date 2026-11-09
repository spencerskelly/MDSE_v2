/* Expand and collapse over a table whose rows are in depth-first order and each carry a level (D-0150, WKB-069).
 * Pure functions: the panel decides what to draw, this decides which rows are visible. A collapsed row hides every
 * row below it until the next row at its own level or higher. State is a set of row keys, not row numbers, so it
 * survives a refresh that re-reads the vault. */

export interface OutlineInput { level: number; id: string; /** a row that only says parts were left out; it hides with its parent but does not make the parent foldable */ notice?: boolean }
export interface Outline {
  /** the level of each row (the root note is 0) */
  level: number[];
  /** a key that names the row by the path of ids from the top, with an ordinal where one parent lists the same id twice */
  key: string[];
  /** how many rows lie below each row, notices included (what folding hides) */
  below: number[];
  /** how many of those are real rows; a row with none is not foldable */
  parts: number[];
  /** the deepest level present */
  max: number;
}

export function buildOutline(rows: readonly OutlineInput[]): Outline {
  const level = rows.map((r) => (Number.isFinite(r.level) && r.level >= 0 ? Math.floor(r.level) : 0));
  const key: string[] = [], below = new Array<number>(rows.length).fill(0), parts = new Array<number>(rows.length).fill(0);
  const stack: string[] = [], seen = new Map<string, number>();           // stack[l] = key of the latest row at level l
  for (let i = 0; i < rows.length; i++) {
    const l = level[i]!;
    stack.length = Math.min(stack.length, l);                            // leaving deeper levels
    const parent = l > 0 ? (stack[l - 1] ?? "") : "";
    const base = parent + "/" + rows[i]!.id, n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const k = base + "#" + n;
    key.push(k); stack[l] = k;
  }
  /* rows below: every following row with a higher level, up to the next row at this level or higher */
  for (let i = 0; i < rows.length; i++) { let j = i + 1, real = 0; while (j < rows.length && level[j]! > level[i]!) { if (!rows[j]!.notice) real++; j++; } below[i] = j - i - 1; parts[i] = real; }
  /* the deepest level of a real row: a notice does not add a level */
  const max = rows.reduce((m, r, i) => (r.notice ? m : Math.max(m, level[i]!)), 0);
  return { level, key, below, parts, max };
}

/** Row numbers to draw, given the keys of the collapsed rows. A leaf is never hidden by its own key. */
export function visibleRows(o: Outline, collapsed: ReadonlySet<string>): number[] {
  const out: number[] = [];
  for (let i = 0; i < o.level.length; i++) {
    out.push(i);
    if (o.parts[i]! > 0 && collapsed.has(o.key[i]!)) i += o.below[i]!;
  }
  return out;
}

/** Collapse every row that has rows below it and sits at level `n` or deeper, so levels 0..n are shown. `n` = 1 shows the
 *  root and its direct parts; Collapse all is that. The root is never collapsed. */
export function collapseFromLevel(o: Outline, n: number): Set<string> {
  const from = Math.max(1, Math.floor(n));
  const s = new Set<string>();
  for (let i = 0; i < o.level.length; i++) if (o.parts[i]! > 0 && o.level[i]! >= from) s.add(o.key[i]!);
  return s;
}

/** Flip one row. Rows with nothing below them do not toggle. */
export function toggled(o: Outline, collapsed: ReadonlySet<string>, row: number): Set<string> {
  const s = new Set(collapsed);
  if (o.parts[row]! === 0) return s;
  const k = o.key[row]!;
  if (s.has(k)) s.delete(k); else s.add(k);
  return s;
}

/** The deepest level currently shown when `collapsed` is applied; used to keep the "show levels" choice in step. */
export function shownDepth(o: Outline, collapsed: ReadonlySet<string>): number {
  return visibleRows(o, collapsed).reduce((m, i) => Math.max(m, o.level[i]!), 0);
}
