/* Reads the EA tables the importer needs into one typed source graph. Read-only. EA diagrams are never read (ADR-V2-05). */

export type RawRow = Record<string, unknown>;

export interface ReaderLike {
  has(table: string): boolean;
  scan(table: string): AsyncGenerator<RawRow>;
  walMode?: boolean;
}

export interface EaPackage { id: number; parentId: number; name: string; notes: string; guid: string; created: string }
export interface EaObject {
  id: number; type: string; name: string; alias: string; author: string; note: string; packageId: number; stereotype: string;
  created: string; guid: string; parentId: number; classifier: number; pdata1: string; multiplicity: string; abstract: string;
}
export interface EaConnector {
  id: number; type: string; stereotype: string; name: string; notes: string; direction: string; guid: string;
  sourceId: number; destId: number; sourceCard: string; destCard: string; sourceIsAggregate: number; destIsAggregate: number;
}
export interface SourceGraph {
  packages: Map<number, EaPackage>;
  objects: EaObject[];
  connectors: EaConnector[];
  tags: Map<number, Array<[string, string]>>;
  objectsById: Map<number, EaObject>;
  counts: { t_object: number; t_connector: number; t_package: number; t_objectproperties: number };
}

const str = (v: unknown): string => (v === null || v === undefined ? "" : String(v));
const num = (v: unknown): number => { const x = Number(v); return Number.isFinite(x) ? x : 0; };

/** Tables the importer reads. t_diagram and every other table are never opened. */
export const REQUIRED_TABLES = ["t_object", "t_connector", "t_package"] as const;

export async function readSourceGraph(reader: ReaderLike): Promise<SourceGraph> {
  for (const t of REQUIRED_TABLES) if (!reader.has(t)) throw new Error(`MISSING_TABLE ${t}`);
  const packages = new Map<number, EaPackage>();
  for await (const r of reader.scan("t_package"))
    packages.set(num(r.Package_ID), { id: num(r.Package_ID), parentId: num(r.Parent_ID), name: str(r.Name), notes: str(r.Notes), guid: str(r.ea_guid), created: str(r.CreatedDate) });
  const objects: EaObject[] = [];
  for await (const r of reader.scan("t_object"))
    objects.push({
      id: num(r.Object_ID), type: str(r.Object_Type), name: str(r.Name), alias: str(r.Alias), author: str(r.Author), note: str(r.Note),
      packageId: num(r.Package_ID), stereotype: str(r.Stereotype), created: str(r.CreatedDate), guid: str(r.ea_guid), parentId: num(r.ParentID),
      classifier: num(r.Classifier), pdata1: str(r.PDATA1), multiplicity: str(r.Multiplicity), abstract: str(r.Abstract),
    });
  const connectors: EaConnector[] = [];
  for await (const r of reader.scan("t_connector"))
    connectors.push({
      id: num(r.Connector_ID), type: str(r.Connector_Type), stereotype: str(r.Stereotype), name: str(r.Name), notes: str(r.Notes), direction: str(r.Direction),
      guid: str(r.ea_guid), sourceId: num(r.Start_Object_ID), destId: num(r.End_Object_ID), sourceCard: str(r.SourceCard), destCard: str(r.DestCard),
      sourceIsAggregate: num(r.SourceIsAggregate), destIsAggregate: num(r.DestIsAggregate),
    });
  const tags = new Map<number, Array<[string, string]>>();
  let tagRows = 0;
  if (reader.has("t_objectproperties"))
    for await (const r of reader.scan("t_objectproperties")) {
      tagRows++;
      const id = num(r.Object_ID), list = tags.get(id) ?? [];
      list.push([str(r.Property), str(r.Value)]); tags.set(id, list);
    }
  const objectsById = new Map(objects.map((o) => [o.id, o]));
  return { packages, objects, connectors, tags, objectsById, counts: { t_object: objects.length, t_connector: connectors.length, t_package: packages.size, t_objectproperties: tagRows } };
}
