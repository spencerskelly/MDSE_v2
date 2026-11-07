/* BOM part classification (D-0072, D-0122): a level from `bomRole` and a category (the BOM file's `category` column, else the words of the description).
 * The two decide the folder `BOM/Parts/<Product|Assembly|Part>/<category>` (BOM-041); `bomCategory`, `bomRole`, `level` and `makeBuy` are the properties a person or a tool queries.
 * Rules are ordered and the first with a word in the description wins. Words are whole words of letters and digits, upper-cased. */
export interface CategoryRule { category: string; words: string[]; also?: string[] }   // also: other names for the same category (D-0144)
const R = (category: string, words: string, also?: string[]): CategoryRule => ({ category, words: words.split(" "), ...(also ? { also } : {}) });
/* D-0144: the categories are the owner's own (the Power Station BOM, 2026-11-07). The word nearest the start of the description decides, since a description starts with what the part is (SCREW MACH ... CONE WASHER is a screw); the table's order breaks a tie between two categories that share a word. */
export const DEFAULT_CATEGORY_RULES: CategoryRule[] = [
  R("Terminal Block", "BLOCK"),
  R("Cable Mgmt", "CLAMP TIE"),
  R("Schematic", "SCHEMATIC SCH"),
  R("Gerber", "GERBER"),
  R("EE BOM", "BOM"),
  R("Manual", "MANUAL INSTRUCTIONS"),
  R("Firmware", "FIRMWARE SOFTWARE"),
  R("Requirements", "REQUIREMENTS"),
  R("Label", "LABEL LBL DECAL NAMEPLATE"),
  R("Cable ASM", "CBL CORDSET"),
  R("Tubing", "TUBING SHRINK SLEEVE"),
  R("Adhesive", "ADH ADHESIVE TAPE FOAM COMPOUND SEAL COATING"),
  R("Packaging", "SHIPPING BUBBLE WRAP BAG STRAP STRAPS STRAPPING"),
  R("Nut", "NUT"),
  R("Washer", "WASHER SPLOCK SPLIT"),
  R("Bolt", "BOLT"),
  R("Stud", "STUD"),
  R("Spacer", "SPACER STANDOFF SPCR"),
  R("Rivet", "RIVET"),
  R("Screw", "SCREW SCR MACH PHP PPH"),
  R("Lug", "LUG"),
  R("Crimp", "CRIMP"),
  R("Connector", "CONNECTOR CONN SHROUD HSG HSNG HOUSING PIN"),
  R("Bracket", "BRKT BRACKET SHELF"),
  R("Gasket", "GASKET GSKT"),
  R("Bus Bar", "BAR BUSBAR"),
  R("Switch", "SWITCH"),
  R("Fan", "FAN"),
  R("Fuse Holder", "HOLDER"),
  R("Fuse", "FUSE"),
  R("Heatsink", "HEATSINK"),
  R("Transformer", "XFMR TRANSFORMER"),
  R("Inductor", "INDUCTOR CHOKE"),
  R("Capacitor", "CAPACITOR CAP"),
  R("Sensor", "SENSOR TRANSDUCER THERMISTOR"),
  R("Fitting", "FITTING"),
  R("ME Part", "PANEL LID DOOR BAFFLE ENCL ENCLOSURE DUCTING", ["Panel", "Lid", "Door"]),
  R("PCBA", "PCBA"),
  R("PCB", "PCB"),
  R("Wire", "WIRE PVC IRRADPVC CORD"),
  R("Contactor", "CONTACTOR"),
  R("IGBT", "IGBT"),
  R("Display", "DSPL DISPLAY"),
  R("Power Supply", "PWRSPLY CONVERTER"),
  R("Bushing", "BUSHING"),
  R("Isolator", "ISOLATOR INSOLATION"),
];
export const NO_CATEGORY = "Uncategorized";
export type BomRole = "final" | "sub" | "part" | "unused";
export type MakeBuy = "make" | "buy" | "other";
export type BomLevel = "product" | "assembly" | "part";

export function bomCategoryOf(description: string, rules: CategoryRule[] = DEFAULT_CATEGORY_RULES): string {
  for (const x of description.toUpperCase().match(/[A-Z][A-Z0-9]+/g) ?? []) for (const r of rules) if (r.words.includes(x)) return r.category;   // D-0144: earliest word wins
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
  const inTable = rules.find((r) => r.category.toLowerCase() === k || r.also?.some((a) => a.toLowerCase() === k))?.category;
  if (inTable) return inTable;
  const safe = t.replace(/[\\/:*?"<>|#^[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60); if (!safe) return null;
  if (!seen) return safe;
  if (!seen.has(k)) seen.set(k, safe);
  return seen.get(k)!;
}
/** True when the category is one the table knows (so it needs no new-category notice). */
export const bomCategoryInTable = (named: string, rules: CategoryRule[]): boolean => { const k = named.trim().toLowerCase(); return k === NO_CATEGORY.toLowerCase() || rules.some((r) => r.category.toLowerCase() === k || !!r.also?.some((a) => a.toLowerCase() === k)); };
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
    "The same category may appear on more than one line. Only lines that start with a dash and a space are rules.",
    "The word nearest the start of the description decides (a description starts with what the part is); when two categories share a word, the one higher in the list wins.",
    "A line `- Category also: Name, Name` makes those names the same category: a BOM file that names one of them is filed under Category.", "",
    ...rules.flatMap((r) => [`- ${r.category}: ${r.words.join(" ")}`, ...(r.also?.length ? [`- ${r.category} also: ${r.also.join(", ")}`] : [])]), "",
  ].join("\n");
}
/** The rules in a vault's category file, or null with the reason when the file is not usable. Never partial: one bad line and the defaults are used, so a typo cannot silently move parts. */
export function parseCategoryRules(text: string): { rules: CategoryRule[] | null; problems: string[] } {
  const rules: CategoryRule[] = [], problems: string[] = [];
  text.replace(/\r\n/g, "\n").split("\n").forEach((line, i) => {
    const m = /^- (.+?): (.*)$/.exec(line); if (!m) return;
    const also = /^(.+) also$/.exec(m[1]!.trim());
    if (also) {   // D-0144: other names for a category
      const target = rules.find((r) => r.category === also[1]!.trim()), names = m[2]!.split(",").map((x) => x.trim()).filter(Boolean);
      if (!target) problems.push(`line ${i + 1}: "${also[1]}" is not a category above this line`); else if (!names.length || names.some((n) => /[\\/:*?"<>|]/.test(n))) problems.push(`line ${i + 1}: "${m[2]}" is not a list of names`); else target.also = [...(target.also ?? []), ...names];
      return;
    }
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
