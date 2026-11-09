/* NetSuite sales ledger reader (draft, owner decisions of 2026-11-08; no rule number yet).
 * Reads a sales-actuals export as a Grid and totals, per item, the net units and the average sale price over the whole file.
 * Customer columns are never read: no customer name or id reaches a result, a finding or a note.
 * Item names in the ledger are a part number with its CL1 appended (`5910560A`, `07802-0`, `09525-002-G`); `salesKeys` lists the part numbers a name could be. */
import type { Cell, Finding, Grid } from "./bom.ts";

const salesNorm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const salesTxt = (c: Cell | null | undefined): string => (c?.v ?? "").trim();
const SALES_REQUIRED = ["name", "account", "quantity", "amount", "currency", "postingperiodname"];
/** Revenue accounts that count toward units and price. Intercompany sales (40101, 40201) are listed but not counted. */
const SALES_ACCOUNT = /^(40100|40200)\b/, ICO_ACCOUNT = /^(40101|40201)\b/;

export interface SalesItem {
  name: string;                // item name as exported, trimmed
  netUnits: number;            // quantity on sales lines, returns and credits negative, all currencies, intercompany excluded
  netRevenueUsd: number;       // amount on USD sales lines
  netUnitsUsd: number;         // units on those same lines
  lines: number;               // sales lines counted
  intercompanyLines: number;   // intercompany lines seen and not counted
}
export interface SalesTotals {
  items: Map<string, SalesItem>;
  months: number;              // first to last posting period of the file, inclusive
  firstPeriod: string; lastPeriod: string;   // yyyy-MM
  nonPart: string[];           // item names that are charges, not parts (no digit, or contains a space)
  findings: Finding[];
}
export interface SalesProps { avgSalePrice: number | null; annualVolume: number }

const SALES_MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
/** `Jan 2025` to a month count since year 0, or null. */
function salesPeriodIndex(s: string): number | null {
  const m = /^([A-Za-z]{3})[a-z]*\.?\s+(\d{4})$/.exec(s.trim()); if (!m) return null;
  const i = SALES_MONTHS.indexOf(m[1]!.toLowerCase()); return i < 0 ? null : Number(m[2]) * 12 + i;
}
const salesYm = (n: number): string => `${Math.floor(n / 12)}-${String((n % 12) + 1).padStart(2, "0")}`;
function salesNum(s: string): number | null {
  const t = s.replace(/[,$\s]/g, "").replace(/^\((.*)\)$/, "-$1"); if (t === "") return 0;
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : null;
}
/** A name is a part when it has a digit and no space; everything else in the ledger is a charge line (freight, discount, tax, subscription, opening balance). */
export const salesIsPart = (name: string): boolean => /\d/.test(name) && !/\s/.test(name);

/** Part numbers an item name could be, most specific first: the name, the name without a trailing CL1 (`-G`, `-0`), the 7-digit number without its letter. */
export function salesKeys(name: string): string[] {
  const n = name.trim(), out = [n];
  const a = /^(.+)-[0-9A-Z]$/.exec(n); if (a) out.push(a[1]!);
  const b = /^(\d{7})[A-Z]$/.exec(n); if (b) out.push(b[1]!);
  return out;
}

export function parseSales(grid: Grid): SalesTotals {
  const findings: Finding[] = [], items = new Map<string, SalesItem>(), nonPart = new Set<string>();
  let h = -1, col = new Map<string, number>();
  for (let r = 0; r < Math.min(grid.length, 15) && h < 0; r++) {
    const m = new Map<string, number>(); (grid[r] ?? []).forEach((c, i) => { const k = salesNorm(salesTxt(c)); if (k && !m.has(k)) m.set(k, i); });
    if (SALES_REQUIRED.every((k) => m.has(k))) { h = r; col = m; }
  }
  const empty = (): SalesTotals => ({ items, months: 0, firstPeriod: "", lastPeriod: "", nonPart: [], findings });
  if (h < 0) { findings.push({ level: "error", code: "SALES_COLUMNS", message: `No header row with the columns ${SALES_REQUIRED.join(", ")} (case, spaces and punctuation ignored). Nothing was read.` }); return empty(); }
  const get = (row: Array<Cell | null | undefined>, k: string): string => salesTxt(row[col.get(k)!]);
  let lo = Infinity, hi = -Infinity, badNum = 0, badPeriod = 0, nonUsd = 0, ico = 0;
  for (let r = h + 1; r < grid.length; r++) {
    const row = grid[r] ?? []; if (!row.some((c) => salesTxt(c))) continue;
    const p = salesPeriodIndex(get(row, "postingperiodname")); if (p === null) badPeriod++; else { lo = Math.min(lo, p); hi = Math.max(hi, p); }
    const name = get(row, "name"), acct = get(row, "account"); if (!name) continue;
    const sales = SALES_ACCOUNT.test(acct), interco = ICO_ACCOUNT.test(acct);
    if (!sales && !interco) continue;
    if (!salesIsPart(name)) { nonPart.add(name); continue; }
    const it = items.get(name) ?? { name, netUnits: 0, netRevenueUsd: 0, netUnitsUsd: 0, lines: 0, intercompanyLines: 0 }; items.set(name, it);
    if (interco) { it.intercompanyLines++; ico++; continue; }
    const q = salesNum(get(row, "quantity")), a = salesNum(get(row, "amount"));
    if (q === null || a === null) { badNum++; continue; }
    it.lines++; it.netUnits += q;
    if (get(row, "currency").toUpperCase() === "USD") { it.netUnitsUsd += q; it.netRevenueUsd += a; } else nonUsd++;
  }
  if (badPeriod) findings.push({ level: "warn", code: "SALES_PERIOD", message: `${badPeriod} row(s) have no readable Posting Period Name (expected like "Jan 2025"); they do not set the window.` });
  if (badNum) findings.push({ level: "warn", code: "SALES_NUMBER", message: `${badNum} sales line(s) have a Quantity or Amount that is not a number and were skipped.` });
  if (nonUsd) findings.push({ level: "info", code: "SALES_CURRENCY", message: `${nonUsd} sales line(s) are not in USD: their units count, their amounts are left out of the average price.` });
  if (ico) findings.push({ level: "info", code: "SALES_INTERCOMPANY", message: `${ico} intercompany sales line(s) were listed but not counted toward units or price.` });
  if (lo === Infinity) { findings.push({ level: "error", code: "SALES_WINDOW", message: "No readable posting period, so annual volume cannot be worked out." }); return { ...empty(), nonPart: [...nonPart].sort() }; }
  return { items, months: hi - lo + 1, firstPeriod: salesYm(lo), lastPeriod: salesYm(hi), nonPart: [...nonPart].sort(), findings };
}

/** Properties for one item over the whole file: price is net USD revenue over net USD units (null when units are zero or negative); volume is net units per year over the file's window. */
export function salesProps(it: SalesItem, months: number): SalesProps {
  const price = it.netUnitsUsd > 0 ? Math.round((it.netRevenueUsd / it.netUnitsUsd) * 100) / 100 : null;
  return { avgSalePrice: price, annualVolume: months > 0 ? Math.round(((it.netUnits * 12) / months) * 10) / 10 : 0 };
}
