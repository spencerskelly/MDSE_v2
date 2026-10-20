/* Family resolution (governance/schemas/ea-family-mapping.json) and the provisional MDSE class table.
 *
 * The family file decides the SysML construct and the disposition. It does NOT name the MDSE class, so classify()
 * below carries that choice from the Unreviewed MOD rules (MOD-056 to MOD-067). Every defaulted subtype is reported
 * as evidence on the ledger row so the owner's review can find it (GOV-003). */
import type { EaObject, EaConnector } from "./ea_source.ts";

export interface ElementEntry { family: string; disposition: string; native_kind: string | null; conditional_evidence: string[]; emission_enabled?: boolean }
export interface RelationshipEntry { family: string; disposition: string; native_operation: string | null; required_evidence: string[]; approved_direction: string }
export interface FamilyMapping { schema: string; elements: ElementEntry[]; relationships: RelationshipEntry[] }

export interface Resolver {
  version: string;
  element(type: string, stereotype: string): { key: string; entry: ElementEntry } | null;
  relationship(type: string, stereotype: string): { key: string; entry: RelationshipEntry } | null;
}

export const familyKey = (type: string, stereotype: string): string => (stereotype ? `${type}:${stereotype}` : type);

/** Exact match only. An unknown family is never mapped by fallback (IMP-092). */
export function buildResolver(m: FamilyMapping): Resolver {
  const els = new Map(m.elements.map((e) => [e.family, e]));
  const rels = new Map(m.relationships.map((e) => [e.family, e]));
  return {
    version: m.schema,
    element(type, stereotype) { const key = familyKey(type, stereotype), entry = els.get(key); return entry ? { key, entry } : null; },
    relationship(type, stereotype) { const key = familyKey(type, stereotype), entry = rels.get(key); return entry ? { key, entry } : null; },
  };
}

export interface Classification { type: string; subtype: string; evidence: string[] }

/** SysML definition kinds that become a note with a `## SysML v2` block. */
export const DEFINITION_KINDS: Record<string, string> = {
  PartDefinition: "part def", InterfaceDefinition: "interface def", PortDefinition: "port def", ItemDefinition: "item def",
  AttributeDefinition: "attribute def", ActionDefinition: "action def", StateDefinition: "state def", RequirementDefinition: "requirement def",
  UseCaseDefinition: "use case def", VerificationCaseDefinition: "verification def", ConstraintDefinition: "constraint def", OccurrenceDefinition: "occurrence def",
};
export const USAGE_KINDS = new Set(["PartUsage", "PortUsage", "ActionUsage", "StateUsage", "ItemUsage"]);

const pathHas = (path: string[], re: RegExp): boolean => path.some((p) => re.test(p));

/** MDSE class and subtype for an element whose family resolved to a note. Returns null when the family makes no note. */
export function classify(entry: ElementEntry, o: EaObject, pkgPath: string[]): Classification | null {
  const ev: string[] = [];
  const kind = entry.native_kind;
  if (entry.disposition === "native_candidate" && kind) {
    switch (kind) {
      case "RequirementDefinition": {
        // MOD-057: subtype from the EA package path; first match wins. Provisional keywords; default engineering.
        let sub = "engineering";
        if (pathHas(pkgPath, /standard|regulat/i)) sub = "standard";
        else if (pathHas(pkgPath, /stakeholder|customer/i)) sub = "stakeholder";
        else if (pathHas(pkgPath, /functional/i)) sub = "functional";
        else if (pathHas(pkgPath, /design/i)) sub = "design";
        else ev.push("SUBTYPE_DEFAULTED_ENGINEERING");
        return { type: "Requirement", subtype: sub, evidence: ev };
      }
      case "ActionDefinition": return { type: "Behavior", subtype: / Function$/i.test(o.stereotype) ? "function" : "activity", evidence: ev };
      case "VerificationCaseDefinition": return { type: "Verification", subtype: "test", evidence: ev };
      case "UseCaseDefinition": ev.push("SUBTYPE_DEFAULTED_WHAT"); return { type: "Use Case", subtype: "what", evidence: ev };
      case "StateDefinition": return { type: "Condition", subtype: "state", evidence: ev };
      case "PartDefinition":
        if (o.type === "Actor") return { type: "Actor", subtype: "", evidence: ev };
        if (/software/i.test(o.stereotype)) return { type: "Object", subtype: "software", evidence: ev };
        ev.push("SUBTYPE_DEFAULTED_PART");
        return { type: "Object", subtype: "part", evidence: ev };
      case "InterfaceDefinition": case "PortDefinition": return { type: "Object", subtype: "interface", evidence: ev };
      case "ItemDefinition": return { type: "Item Flow", subtype: /physical/i.test(o.stereotype) ? "material" : "information", evidence: ev };
      case "AttributeDefinition": return { type: "Item Flow", subtype: "information", evidence: ev };
      case "ConstraintDefinition": return { type: "Info", subtype: "", evidence: ev };
      case "OccurrenceDefinition": return { type: "modelCheck", subtype: "Event", evidence: ev };
      default: return null;                                    // usages and unknown kinds make no note
    }
  }
  if (entry.disposition === "attachment_link") return { type: "Artifact", subtype: "", evidence: ev };
  if (entry.disposition === "mdse_note") {
    if (o.type === "Issue") return { type: "Issue", subtype: "engineering issue", evidence: ev };
    if (o.type === "Change" || o.type === "Decision") return { type: "modelCheck", subtype: o.type, evidence: ev };
    return { type: "Info", subtype: "", evidence: ev };       // InformationItem, Note, Text, Text:NavigationCell
  }
  return null;
}

export const isUsageEntry = (e: ElementEntry): boolean => !!e.native_kind && USAGE_KINDS.has(e.native_kind);
export const connectorKey = (c: EaConnector): string => familyKey(c.type, c.stereotype);
