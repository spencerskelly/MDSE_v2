/* Inspect a SysML usage independently of the definition that types it.
 * A usage is NOT a note: all results here are read-only, owner-local projections of the
 * authoritative SysML text. Only explicit connect/bind/flow statements are linked. */
import type { ModelIndex } from "./index.ts";
import { portsOfType } from "./views.ts";
import type { Usage } from "./sysml_scan.ts";

export interface MemberEndpoint {
  text: string; usage: string | null; path: string | null; resolved: boolean;
}
export interface MemberConnection {
  kind: "connect" | "bind" | "flow"; form: string; name: string;
  thisEnd: MemberEndpoint; otherEnd: MemberEndpoint; statement: string;
}
export interface MemberDetail {
  index: number; key: string; owner: string; kind: string; name: string;
  head: string; type: string; typePath: string | null; mult: string;
  dir: string; ref: boolean; conj: boolean; end: boolean;
  subsets: readonly string[]; redefines: readonly string[];
  doc: string; props: Array<{ name: string; value: string }>;
  connections: MemberConnection[];
}
export function memberDetails(ix: ModelIndex, owner: string): MemberDetail[] {
  const d = ix.notes.get(owner)?.def;
  if (!d) return [];
  const members = d.usages.map((u: Usage, index): MemberDetail => ({
    index, key: owner + "|" + index + "|" + u.head, owner, kind: u.kind, name: u.name,
    head: u.head, type: u.type ?? "", typePath: u.type ? ix.bySymbol.get(u.type) ?? null : null,
    mult: u.mult ?? "", dir: u.dir ?? "", ref: !!u.ref, conj: !!u.conj, end: !!u.end,
    subsets: u.subsets ?? [], redefines: u.redefines ?? [], doc: u.doc ?? "",
    props: (u.props ?? []).map((p) => ({ name: p.name, value: p.value })), connections: [],
  }));
  const byName = new Map<string, MemberDetail[]>();
  for (const m of members) (byName.get(m.name) ?? byName.set(m.name, []).get(m.name)!).push(m);
  const unique = (name: string): MemberDetail | null => {
    const matches = byName.get(name);
    return matches?.length === 1 ? matches[0]! : null;
  };
  const portCache = new Map<string, ReturnType<typeof portsOfType>>();
  const endpoint = (text: string): MemberEndpoint => {
    const segments = text.split(".");
    const m = unique(segments[0] ?? "");
    if (!m) return { text, usage: null, path: null, resolved: false };
    if (segments.length === 1) return { text, usage: m.name, path: m.typePath, resolved: true };
    if (segments.length !== 2 || m.kind !== "part" || !m.typePath)
      return { text, usage: m.name, path: null, resolved: false };
    let ports = portCache.get(m.typePath);
    if (!ports) { ports = portsOfType(ix, m.typePath); portCache.set(m.typePath, ports); }
    const p = ports.find((x) => x.name === segments[1]);
    return { text, usage: m.name, path: p?.path ?? null, resolved: !!p };
  };
  for (const stmt of d.stmts) {
    if ((stmt.kind !== "connect" && stmt.kind !== "bind" && stmt.kind !== "flow") || !stmt.a || !stmt.b) continue;
    const a = endpoint(stmt.a), b = endpoint(stmt.b);
    for (const [here, other] of [[a, b], [b, a]] as const) {
      if (!here.usage) continue;
      const match = unique(here.usage);
      if (!match) continue;
      // A connection between two endpoints of the same usage appears only once in that usage.
      if (here === b && a.usage === b.usage && a.usage !== null) continue;
      match.connections.push({
        kind: stmt.kind, form: stmt.form ?? "", name: stmt.name ?? "",
        thisEnd: here, otherEnd: other, statement: stmt.text,
      });
    }
  }
  return members;
}
