/* Scope and DAQ exports (D-0170): a short summary of a CSV for the report, with the raw file kept beside it.
 * Instrument exports usually start with a preamble ("Model,DSOX1204G", "Sample Interval,1e-06") before the header row;
 * the preamble is kept as metadata and the data starts at the first row followed by numeric rows. */
export interface CsvColumn { name: string; min: string; max: string; mean: string; count: number }
export interface CsvSummary { rows: number; columns: CsvColumn[]; meta: Array<{ key: string; value: string }>; sampleInterval: string; delimiter: string }

const num = (s: string): number | null => { const t = s.trim(); if (!t || !/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) return null; return Number(t); };
const fmt = (x: number): string => { if (!isFinite(x)) return "—"; const a = Math.abs(x); return a !== 0 && (a < 1e-3 || a >= 1e6) ? x.toExponential(4) : String(Number(x.toPrecision(6))); };
function split(line: string, d: string): string[] {
  if (!line.includes('"')) return line.split(d);
  const out: string[] = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) { const ch = line[i]!; if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (ch === d && !q) { out.push(cur); cur = ""; } else cur += ch; }
  out.push(cur); return out;
}
export function summarizeCsv(text: string, maxRows = 2_000_000): CsvSummary {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim().length);
  const sample = lines.slice(0, 50).join("\n");
  const delimiter = [",", "\t", ";"].map((d) => [d, (sample.match(new RegExp(d === "\t" ? "\\t" : d, "g")) ?? []).length] as const).sort((a, b) => b[1] - a[1])[0]![0];
  const rows = lines.map((l) => split(l, delimiter).map((c) => c.trim()));
  const numericCount = (r: string[] | undefined): number => (r ? r.filter((c) => num(c) !== null).length : 0);
  // data starts at the first row that is numeric in at least two cells (or one, for one-column files) and is followed by another like it
  let start = rows.findIndex((r, i) => { const n = numericCount(r); return n >= Math.min(2, r.length) && n > 0 && numericCount(rows[i + 1]) >= Math.min(2, r.length); });
  if (start < 0) start = rows.findIndex((r) => numericCount(r) > 0);
  if (start < 0) return { rows: 0, columns: [], meta: rows.slice(0, 20).map((r) => ({ key: r[0] ?? "", value: r.slice(1).join(" ") })).filter((m) => m.key), sampleInterval: "", delimiter };
  const header = start > 0 && numericCount(rows[start - 1]) === 0 ? rows[start - 1]! : null;
  const meta = rows.slice(0, header ? start - 1 : start).filter((r) => r[0]).map((r) => ({ key: r[0]!, value: r.slice(1).filter(Boolean).join(" ") }));
  const width = Math.max(...rows.slice(start, start + 20).map((r) => r.length));
  const names = Array.from({ length: width }, (_, i) => (header?.[i] || `Column ${i + 1}`));
  const acc = names.map(() => ({ min: Infinity, max: -Infinity, sum: 0, count: 0 }));
  let n = 0;
  for (let i = start; i < rows.length && n < maxRows; i++) {
    const r = rows[i]!; if (numericCount(r) === 0) continue; n++;
    r.forEach((c, j) => { const v = num(c); if (v === null || j >= width) return; const a = acc[j]!; if (v < a.min) a.min = v; if (v > a.max) a.max = v; a.sum += v; a.count++; });
  }
  const si = meta.find((m) => /sample\s*interval|x\s*increment|dt\b|time\s*per\s*sample/i.test(m.key))?.value ?? "";
  return { rows: n, delimiter, meta, sampleInterval: si,
    columns: names.map((name, j) => { const a = acc[j]!; return { name, count: a.count, min: a.count ? fmt(a.min) : "—", max: a.count ? fmt(a.max) : "—", mean: a.count ? fmt(a.sum / a.count) : "—" }; }).filter((c) => c.count > 0) };
}
