/* BOM part classification (D-0072, D-0122): a level from `bomRole` and a category (the BOM file's `category` column, else the words of the description).
 * The two decide the folder `BOM/Parts/<Product|Assembly|Part>/<category>` (BOM-041); `bomCategory`, `bomRole`, `level` and `makeBuy` are the properties a person or a tool queries.
 * Rules are ordered and the first with a word in the description wins. Words are whole words of letters and digits, upper-cased. */
export interface CategoryRule { category: string; words: string[] }
const R = (category: string, words: string): CategoryRule => ({ category, words: words.split(" ") });
export const DEFAULT_CATEGORY_RULES: CategoryRule[] = [
  R("Documents", "MANUAL INSTRUCTIONS SCHEMATIC SCH GERBER BOM DRAWING DATASHEET PROCEDURE SPEC SPECIFICATION"),   // BOM-063: SCH added; SOFTWARE, SW and FIRMWARE left (a firmware part number is an ordinary part, BOM-058)
  R("Labels", "LABEL LBL DECAL NAMEPLATE"),
  R("Cables and harnesses", "CABLE CBL CORDSET HARN HARNESS CORD JUMPER"),
  R("Wire", "WIRE"),
  R("Circuit boards", "PCBA PCB BOARD"),
  R("Electronic components", "SMD THD RESISTOR CAPACITOR DIODE TRANSISTOR INDUCTOR CRYSTAL LED FUSE RELAY MOSFET IGBT IC"),
  R("Magnetics", "XFMR TRANSFORMER CHOKE"),
  R("Connectors and terminals", "CONNECTOR CONN TERM TERMINAL PLUG RECEPTACLE LUG HEADER SOCKET COUPLER CONTACT CPL"),
  R("Fasteners", "SCREW SCR WASHER NUT BOLT RIVET STANDOFF SPACER"),
  R("Enclosures and mechanical", "ENCLOSURE ENCL COVER BRACKET PLATE PANEL PNL BOX HOUSING CHASSIS"),
  R("Brackets", "BRKT"),   // BOM-063, OD-34: which category holds BRKT is open
  R("Thermal", "FAN HEATSINK"),
  R("Packaging and materials", "BAG FOAM TUBING SLEEVE TAPE ADHESIVE"),
  R("Chargers and systems", "EVSE GRID PROCORE ECU CHG SYS CHARGER STATION"),
  R("Kits", "KIT"),
  R("Assemblies (generic)", "ASSEMBLY"),   // BOM-063: ASSY and ASM are not category words; level comes from bomRole
  // Second tier (D-0075): abbreviations and words seen in descriptions the first tier left Uncategorized. They come last, so they only place a part no first-tier word matched.
  R("Electronic components", "CAP RES UF"),
  R("Wire", "H07V"),
  R("Cables and harnesses", "LFLEX"),
  R("Documents", "LIST SPARES"),
  R("Enclosures and mechanical", "RELIEF RING GUIDE RAIL"),
  R("Connectors and terminals", "J1772"),
  R("Chargers and systems", "CHARGE CONTROLLER SYSTEM GSE"),
];
export const NO_CATEGORY = "Uncategorized";
export type BomRole = "final" | "sub" | "part" | "unused";
export type MakeBuy = "make" | "buy" | "other";
export type BomLevel = "product" | "assembly" | "part";

export function bomCategoryOf(description: string, rules: CategoryRule[] = DEFAULT_CATEGORY_RULES): string {
  const words = new Set((description.toUpperCase().match(/[A-Z][A-Z0-9]+/g) ?? []));
  for (const r of rules) for (const w of r.words) if (words.has(w)) return r.category;
  return NO_CATEGORY;
}
/** final: has child lines and no parent in the BOMs read; sub: has both; part: no child lines, used somewhere; unused: neither. */
export const bomRoleOf = (hasChildren: boolean, hasParent: boolean): BomRole => (hasChildren ? (hasParent ? "sub" : "final") : hasParent ? "part" : "unused");
/** BOM-061: `make` and `buy` as read from the source column (case and outer spaces ignored); anything else, or nothing, is `other`. */
export const bomMakeBuyOf = (source: string): MakeBuy => { const t = source.trim().toLowerCase(); return t === "buy" || t === "make" ? t : "other"; };
/** BOM-042: final is product, sub is assembly, part and unused are part. */
export const bomLevelOf = (role: BomRole): BomLevel => (role === "final" ? "product" : role === "sub" ? "assembly" : "part");
const LEVEL_FOLDER: Record<BomLevel, string> = { product: "Product", assembly: "Assembly", part: "Part" };
/** BOM-062 (D-0141): the category a BOM file names. The table's spelling when it has the category (case ignored); otherwise the name as written, trimmed and made safe for a folder name, with the first spelling met kept for every later case variant (`seen`). Empty gives null. "Uncategorized" is accepted. */
export function bomNamedCategory(named: string, rules: CategoryRule[], seen?: Map<string, string>): string | null {
  const t = named.trim().replace(/\s+/g, " "); if (!t) return null;
  const k = t.toLowerCase();
  if (k === NO_CATEGORY.toLowerCase()) return NO_CATEGORY;
  const inTable = rules.find((r) => r.category.toLowerCase() === k)?.category;
  if (inTable) return inTable;
  const safe = t.replace(/[\\/:*?"<>|#^[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60); if (!safe) return null;
  if (!seen) return safe;
  if (!seen.has(k)) seen.set(k, safe);
  return seen.get(k)!;
}
/** True when the category is one the table knows (so it needs no new-category notice). */
export const bomCategoryInTable = (named: string, rules: CategoryRule[]): boolean => { const k = named.trim().toLowerCase(); return k === NO_CATEGORY.toLowerCase() || rules.some((r) => r.category.toLowerCase() === k); };
/** The folder of a part under `dir` (default BOM): level, then category (BOM-041). */
export const bomPartFolder = (dir: string, level: BomLevel, category: string): string => `${dir}/Parts/${LEVEL_FOLDER[level]}/${category}`;

/** D-0076: the vault's own copy of the table. A person edits it in Obsidian; the importer reads it from the vault each run. */
export const CATEGORY_RULES_PATH = "99_System/06_Config/BOM Categories.md";
export function renderCategoryRules(rules: CategoryRule[] = DEFAULT_CATEGORY_RULES): string {
  return [
    "# BOM categories", "",
    "The importer sorts each BOM part into a folder by the words of its description (`BOM/Parts/<Product|Assembly|Part>/<category>`) and writes the category as `bomCategory`. A BOM file may carry a `category` column; a part with a value there uses it, if it is a category below.",
    "Edit this list to change how parts are sorted. A note already in the vault keeps its folder; the BOM update scan offers its new `bomCategory`.", "",
    "One rule per line, written `- Category name: WORD WORD WORD`. The category name is also the folder name.",
    "Rules are tried from the top. The first rule with one of its words in the description wins, so put the more specific rule higher.",
    "Words are whole words of letters and digits, upper or lower case. A part no rule matches is `Uncategorized`.",
    "The same category may appear on more than one line. Only lines that start with a dash and a space are rules.", "",
    ...rules.map((r) => `- ${r.category}: ${r.words.join(" ")}`), "",
  ].join("\n");
}
/** The rules in a vault's category file, or null with the reason when the file is not usable. Never partial: one bad line and the defaults are used, so a typo cannot silently move parts. */
export function parseCategoryRules(text: string): { rules: CategoryRule[] | null; problems: string[] } {
  const rules: CategoryRule[] = [], problems: string[] = [];
  text.replace(/\r\n/g, "\n").split("\n").forEach((line, i) => {
    const m = /^- (.+?): (.*)$/.exec(line); if (!m) return;
    const category = m[1]!.trim(), words = (m[2]!.toUpperCase().match(/[A-Z0-9]+/g) ?? []);
    if (/[\\/:*?"<>|]/.test(category) || /^\.+$/.test(category)) problems.push(`line ${i + 1}: "${category}" cannot be a folder name`);
    else if (category === NO_CATEGORY) problems.push(`line ${i + 1}: "${NO_CATEGORY}" is what no match gets; it cannot have words`);
    else if (!words.length) problems.push(`line ${i + 1}: "${category}" has no words`);
    else if (words.some((w) => !/^[A-Z][A-Z0-9]+$/.test(w))) problems.push(`line ${i + 1}: a word must start with a letter and have two or more characters (${words.filter((w) => !/^[A-Z][A-Z0-9]+$/.test(w)).join(", ")})`);
    else rules.push({ category, words });
  });
  if (!rules.length && !problems.length) problems.push("no rule lines found");
  return { rules: problems.length ? null : rules, problems };
}
