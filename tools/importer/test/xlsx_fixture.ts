/* Shared xlsx fixture writer for the BOM tests: a minimal workbook with shared strings and struck-out runs. Synthetic data only (DAT-002). */
import { createRequire } from "node:module";
import { deflateRawSync } from "node:zlib";
import MDSE from "../../core/src/mdse_core.js";
import type { Grid } from "../src/bom.ts";
const require = createRequire(import.meta.url);
const { readXlsx } = require("../src/xlsx_reader.js");
export function zipOf(entries: Record<string, string>, deflate: boolean): Uint8Array {
  const enc = new TextEncoder(), parts: Uint8Array[] = [], central: Uint8Array[] = []; let off = 0;
  const w16 = (n: number) => [n & 255, (n >> 8) & 255], w32 = (n: number) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
  for (const [name, text] of Object.entries(entries)) {
    const raw = enc.encode(text), data = deflate ? new Uint8Array(deflateRawSync(raw)) : raw, nm = enc.encode(name), crc = MDSE.crc32(raw) >>> 0, m = deflate ? 8 : 0;
    const local = Uint8Array.from([...w32(0x04034b50), ...w16(20), ...w16(0), ...w16(m), ...w16(0), ...w16(0), ...w32(crc), ...w32(data.length), ...w32(raw.length), ...w16(nm.length), ...w16(0), ...nm]);
    parts.push(local, data);
    central.push(Uint8Array.from([...w32(0x02014b50), ...w16(20), ...w16(20), ...w16(0), ...w16(m), ...w16(0), ...w16(0), ...w32(crc), ...w32(data.length), ...w32(raw.length), ...w16(nm.length), ...w16(0), ...w16(0), ...w16(0), ...w16(0), ...w32(0), ...w32(off), ...nm]));
    off += local.length + data.length;
  }
  const cd = central.reduce((n, c) => n + c.length, 0);
  const end = Uint8Array.from([...w32(0x06054b50), ...w16(0), ...w16(0), ...w16(central.length), ...w16(central.length), ...w32(cd), ...w32(off), ...w16(0)]);
  const all = [...parts, ...central, end], out = new Uint8Array(all.reduce((n, p) => n + p.length, 0)); let p = 0; for (const a of all) { out.set(a, p); p += a.length; }
  return out;
}
const colName = (i: number) => String.fromCharCode(65 + i);
/** rows of cells: a string, a number, or {runs:[[text, strike]]} */
export function xlsxOf(rows: Array<Array<string | number | { runs: Array<[string, boolean]> } | null>>, deflate = true): Uint8Array {
  const shared: string[] = [];
  const sheetRows = rows.map((r, ri) => `<row r="${ri + 1}">${r.map((c, ci) => {
    if (c === null || c === "") return "";
    const ref = colName(ci) + (ri + 1);
    if (typeof c === "number") return `<c r="${ref}"><v>${c}</v></c>`;
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const si = typeof c === "string" ? `<si><t xml:space="preserve">${esc(c)}</t></si>` : `<si>${c.runs.map(([t, s]) => `<r><rPr>${s ? "<strike/>" : ""}<sz val="11"/></rPr><t xml:space="preserve">${esc(t)}</t></r>`).join("")}</si>`;
    shared.push(si); return `<c r="${ref}" t="s"><v>${shared.length - 1}</v></c>`;
  }).join("")}</row>`).join("");
  return zipOf({
    "[Content_Types].xml": "<Types/>", "xl/workbook.xml": '<workbook><sheets><sheet name="BOM" sheetId="1" r:id="rId1"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels": '<Relationships><Relationship Id="rId1" Type="x" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/sharedStrings.xml": `<sst>${shared.join("")}</sst>`, "xl/worksheets/sheet1.xml": `<worksheet><sheetData>${sheetRows}</sheetData></worksheet>`,
  }, deflate);
}
export const gridOf = async (bytes: Uint8Array): Promise<Grid> => (await readXlsx(bytes)).sheets[0].rows;
