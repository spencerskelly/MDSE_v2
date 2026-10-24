/* BOM part classification (D-0072): a category from the words of the description, whether the part has child lines, and where it comes from (make or buy).
 * The three decide the folder `BOM/Parts/<category>/<Assemblies|Parts>/<buy|make|other>`; `bomCategory` and `bomRole` are the properties a person or a tool queries.
 * Rules are ordered and the first with a word in the description wins. Words are whole words of letters and digits, upper-cased. */
export interface CategoryRule { category: string; words: string[] }
const R = (category: string, words: string): CategoryRule => ({ category, words: words.split(" ") });
export const DEFAULT_CATEGORY_RULES: CategoryRule[] = [
  R("Documents", "MANUAL INSTRUCTIONS SCHEMATIC GERBER BOM DRAWING DATASHEET PROCEDURE SPEC SPECIFICATION SOFTWARE SW FIRMWARE"),
  R("Labels", "LABEL LBL DECAL NAMEPLATE"),
  R("Cables and harnesses", "CABLE CBL CORDSET HARN HARNESS CORD JUMPER"),
  R("Wire", "WIRE"),
  R("Circuit boards", "PCBA PCB BOARD"),
  R("Electronic components", "SMD THD RESISTOR CAPACITOR DIODE TRANSISTOR INDUCTOR CRYSTAL LED FUSE RELAY MOSFET IGBT IC"),
  R("Magnetics", "XFMR TRANSFORMER CHOKE"),
  R("Connectors and terminals", "CONNECTOR CONN TERM TERMINAL PLUG RECEPTACLE LUG HEADER SOCKET COUPLER CONTACT CPL"),
  R("Fasteners", "SCREW SCR WASHER NUT BOLT RIVET STANDOFF SPACER"),
  R("Enclosures and mechanical", "ENCLOSURE COVER BRACKET PLATE PANEL BOX HOUSING CHASSIS"),
  R("Thermal", "FAN HEATSINK"),
  R("Packaging and materials", "BAG FOAM TUBING SLEEVE TAPE ADHESIVE"),
  R("Chargers and systems", "EVSE GRID PROCORE ECU CHG SYS CHARGER STATION"),
  R("Kits", "KIT"),
  R("Assemblies (generic)", "ASSY ASM ASSEMBLY"),
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
export type SourceFolder = "buy" | "make" | "other";

export function bomCategoryOf(description: string, rules: CategoryRule[] = DEFAULT_CATEGORY_RULES): string {
  const words = new Set((description.toUpperCase().match(/[A-Z][A-Z0-9]+/g) ?? []));
  for (const r of rules) for (const w of r.words) if (words.has(w)) return r.category;
  return NO_CATEGORY;
}
/** final: has child lines and no parent in the BOMs read; sub: has both; part: no child lines, used somewhere; unused: neither. */
export const bomRoleOf = (hasChildren: boolean, hasParent: boolean): BomRole => (hasChildren ? (hasParent ? "sub" : "final") : hasParent ? "part" : "unused");
export const bomSourceFolder = (source: string): SourceFolder => (source === "buy" || source === "make" ? source : "other");
/** The folder of a part under `dir` (default BOM): category, then assembly or part, then make or buy. */
export const bomPartFolder = (dir: string, category: string, hasChildren: boolean, source: string): string =>
  `${dir}/Parts/${category}/${hasChildren ? "Assemblies" : "Parts"}/${bomSourceFolder(source)}`;
