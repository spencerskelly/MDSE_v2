/* Sales role and product family (draft, owner decisions of 2026-11-08; no rule number yet).
 * `salesRole` says how a part number earns its place in the ledger and the BOMs: product, spare, or PIA (part in assembly).
 * A product's category is its family (Charger, BMID, Kit) instead of the word table of bom_category.ts. The family applies to a sold top-level part only:
 * on every top-level part it would label cables and old sub-assemblies that happen to say GSE, SVS or PROCORE (339 unsold top-level parts in the real BOM set, checked 2026-11-08). */
export type SalesRole = "product" | "spare" | "PIA";
export type ProductFamily = "Charger" | "BMID" | "Kit";

const FAMILY_BMID_WORDS = new Set(["BMID", "POSIGUARD"]);
/** Whole words, or words that start with these letters followed by digits (DVS330, MVS800, SVS100, PCE48C15W, EDGE9KW). */
const FAMILY_CHARGER_WORDS = new Set(["PROCORE", "PC", "GSE", "STN", "DVS", "MVS", "SVS", "PCE", "EDGE"]);
const FAMILY_CHARGER_PREFIX = /^(DVS|MVS|SVS|PCE|EDGE)\d/;

/** The family of a description, or null. A description that starts with KIT is a Kit (pedestals, brackets, sensors, dongles: not the core value proposition); then BMID words; then charger words. */
export function productFamilyOf(description: string): ProductFamily | null {
  const words = description.toUpperCase().match(/[A-Z][A-Z0-9]*/g) ?? [];
  const ofWord = (w: string | undefined): ProductFamily | null => (w === undefined ? null : FAMILY_BMID_WORDS.has(w) ? "BMID" : FAMILY_CHARGER_WORDS.has(w) || FAMILY_CHARGER_PREFIX.test(w) ? "Charger" : null);
  /* A kit is an accessory kit (floor stand, sensor, dongle, bracket) unless the word right after KIT is a family word: KIT POSIGUARD BMID WITH LORA COMM is the BMID itself. */
  if (words[0] === "KIT") return ofWord(words[1]) ?? "Kit";
  if (words.some((w) => FAMILY_BMID_WORDS.has(w))) return "BMID";
  if (words.some((w) => ofWord(w) === "Charger")) return "Charger";
  return null;
}

export interface SalesRoleInput {
  sold: boolean;       // the part number has counted sales in the ledger
  inBom: boolean;      // the part number is in the BOMs read
  hasParent: boolean;  // some assembly in the BOMs uses it
  description: string; // from the BOM; "" when the part is in no BOM
}
/** product: sold, top-level, and in a family. spare: any other sold part, including a sold part found in no BOM (until more kinds are identified). PIA: not sold, used in an assembly. Not sold and top-level: no role. */
export function salesRoleOf(i: SalesRoleInput): SalesRole | null {
  if (i.sold) return i.inBom && !i.hasParent && productFamilyOf(i.description) !== null ? "product" : "spare";
  return i.inBom && i.hasParent ? "PIA" : null;
}
/** The category a sold top-level part gets in place of the word table's; null when the part keeps the table's category. */
export function salesCategoryOf(i: SalesRoleInput): ProductFamily | null {
  return i.sold && i.inBom && !i.hasParent ? productFamilyOf(i.description) : null;
}
