/* Identity allocation: author codes (MOD-002/003/014), uid (MOD-004/018/019), ids (MOD-015/017/020).
 * Deterministic: the same source and options always give the same identities. */

export interface AuthorOptions {
  /** EA Author value -> 13-character code (the people notes / authors.yaml mapping, MOD-003). */
  authorMap: Record<string, string>;
  /** Code for blank or unusable EA authors. MOD-018 / W-316: skellyspencer for the EA8647 import. */
  fallbackCode: string;
  /** EA Author values that mean "no usable author" (authors.yaml `unmapped.ea_names`). */
  unmappedNames: string[];
}

const pad13 = (s: string): string => (s + "-------------").slice(0, 13);

/** MOD-002: last name then first name, lowercase letters only, truncated to 13, padded right with hyphens. */
export function deriveAuthorCode(name: string): string {
  const clean = (s: string): string => s.toLowerCase().replace(/[^a-z]/g, "");
  let first = "", last = "";
  if (name.includes(",")) { const [l, f] = name.split(","); last = clean(l ?? ""); first = clean(f ?? ""); }
  else { const t = name.trim().split(/\s+/); first = clean(t[0] ?? ""); last = t.length > 1 ? clean(t[t.length - 1] ?? "") : ""; }
  return pad13(last + first);
}

const letters = (s: string): string => s.toLowerCase().replace(/[^a-z]/g, "");

/** D-0105: EA often holds a short login (`skellys`, `legaspic`) for a person it also holds under a full name or that the vault already knows by a 13-letter code. Every login the run meets is matched to that person, so one person has one code with the most letters available. A login matches (1) a known code that starts with it, or (2) a full EA name whose last name (any 3+ letters of it) followed by the first name's initial letters spells it. A login that matches no one, or more than one, is left as it is. */
export function resolveLogins(authors: string[], o: AuthorOptions): AuthorOptions {
  const codes = new Set<string>([...Object.values(o.authorMap), o.fallbackCode].map((c) => c.replace(/-+$/, "")).filter(Boolean));
  const persons: Array<{ last: string; first: string; code: string }> = [];
  for (const a of new Set(authors)) {
    if (!a.includes(" ") && !a.includes(",")) continue;
    const code = deriveAuthorCode(a), [l, f] = a.includes(",") ? a.split(",") : [a.trim().split(/\s+/).slice(-1)[0], a.trim().split(/\s+/)[0]];
    persons.push({ last: letters(l ?? ""), first: letters(f ?? ""), code }); codes.add(code.replace(/-+$/, ""));
  }
  const map = { ...o.authorMap };
  for (const a of new Set(authors)) {
    const L = letters(a);
    if (!L || a.includes(" ") || a.includes(",") || map[a] || Object.keys(map).some((k) => k.toLowerCase() === a.toLowerCase())) continue;
    const byCode = [...codes].filter((c) => c.length > L.length && c.startsWith(L));
    const byName = persons.filter((p) => { for (let n = 3; n <= p.last.length; n++) { const rest = L.slice(n); if (L.startsWith(p.last.slice(0, n)) && rest.length > 0 && p.first.startsWith(rest)) return true; } return false; }).map((p) => p.code.replace(/-+$/, ""));
    const hit = [...new Set([...byCode, ...byName])];
    if (hit.length === 1) map[a] = pad13(hit[0]!);
  }
  return { ...o, authorMap: map };
}

export function authorCode(eaAuthor: string, o: AuthorOptions): { code: string; how: "map" | "fallback" | "derived" } {
  const mapped = o.authorMap[eaAuthor] ?? Object.entries(o.authorMap).find(([k]) => k.toLowerCase() === eaAuthor.toLowerCase())?.[1];
  if (mapped) return { code: mapped, how: "map" };
  if (!eaAuthor.trim() || o.unmappedNames.includes(eaAuthor)) return { code: o.fallbackCode, how: "fallback" };
  const d = deriveAuthorCode(eaAuthor);
  return /^[a-z-]{13}$/.test(d) && d.replace(/-/g, "") ? { code: d, how: "derived" } : { code: o.fallbackCode, how: "fallback" };
}

const TIME = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?/;

/** EA CreatedDate as written -> yyyyMMddHHmmssSSS (no time zone conversion; missing milliseconds = 000). */
export function eaTimeStamp(s: string): string | null {
  const m = TIME.exec(s.trim());
  if (!m) return null;
  const ms = (m[7] ?? "").padEnd(3, "0");
  return `${m[1]}${m[2]}${m[3]}${m[4] ?? "00"}${m[5] ?? "00"}${m[6] ?? "00"}${ms}`;
}

/** Adds one millisecond to a yyyyMMddHHmmssSSS stamp (collision resolution, as the AI instructions do for hand notes). */
export function bumpMillisecond(stamp: string): string {
  const y = +stamp.slice(0, 4), mo = +stamp.slice(4, 6) - 1, d = +stamp.slice(6, 8), h = +stamp.slice(8, 10), mi = +stamp.slice(10, 12), s = +stamp.slice(12, 14), ms = +stamp.slice(14, 17);
  const t = new Date(Date.UTC(y, mo, d, h, mi, s, ms + 1));
  const p = (n: number, w = 2): string => String(n).padStart(w, "0");
  return `${p(t.getUTCFullYear(), 4)}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}${p(t.getUTCHours())}${p(t.getUTCMinutes())}${p(t.getUTCSeconds())}${p(t.getUTCMilliseconds(), 3)}`;
}

export interface UidRequest { key: string; created: string; guid: string; author: string }
export interface UidResult { uid: string; evidence: string[] }

/** Allocates a unique 30-character uid per request in (created, guid) order. `taken` holds uids already in the vault. */
export function allocateUids(reqs: UidRequest[], a: AuthorOptions, taken: Set<string>, fallbackStamp: string): Map<string, UidResult> {
  const out = new Map<string, UidResult>(), cursor = new Map<string, string>();
  a = resolveLogins(reqs.map((r) => r.author), a);                                                       // D-0105
  const order = reqs.map((r) => ({ r, stamp: eaTimeStamp(r.created) })).sort((x, y) => {
    const a1 = x.stamp ?? "99999999999999999", b1 = y.stamp ?? "99999999999999999";
    return a1 < b1 ? -1 : a1 > b1 ? 1 : x.r.guid < y.r.guid ? -1 : x.r.guid > y.r.guid ? 1 : 0;
  });
  for (const { r, stamp } of order) {
    const evidence: string[] = [];
    const who = authorCode(r.author, a);
    if (who.how === "fallback") evidence.push("AUTHOR_FALLBACK");
    if (who.how === "derived") evidence.push("AUTHOR_DERIVED");
    let t = stamp;
    if (!t) { t = fallbackStamp; evidence.push("UID_TIME_FALLBACK"); }
    let shifted = false;
    const from = t, key = from + who.code, next = cursor.get(key);   // every stamp from `from` up to the cursor is already taken: start there, not at `from` (BOM runs give every part one fallback stamp)
    if (next) { t = next; shifted = true; }
    while (taken.has(t + who.code)) { t = bumpMillisecond(t); shifted = true; }
    if (shifted) cursor.set(key, t);
    if (shifted) evidence.push("UID_COLLISION_SHIFTED");
    const uid = t + who.code;
    taken.add(uid);
    out.set(r.key, { uid, evidence });
  }
  return out;
}

export interface IdRequest { key: string; prefix: string; created: string; guid: string }

/** Ids numbered per prefix in EA creation order, ties by EA GUID, continuing after `highest` per prefix (MOD-015, MOD-017). */
export function allocateIds(reqs: IdRequest[], highest: Map<string, number>): Map<string, string> {
  const byPrefix = new Map<string, IdRequest[]>();
  for (const r of reqs) (byPrefix.get(r.prefix) ?? byPrefix.set(r.prefix, []).get(r.prefix)!).push(r);
  const out = new Map<string, string>();
  for (const [prefix, list] of [...byPrefix].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    list.sort((x, y) => {
      const a1 = eaTimeStamp(x.created) ?? "99999999999999999", b1 = eaTimeStamp(y.created) ?? "99999999999999999";
      return a1 < b1 ? -1 : a1 > b1 ? 1 : x.guid < y.guid ? -1 : x.guid > y.guid ? 1 : 0;
    });
    let n = highest.get(prefix) ?? 0;
    for (const r of list) {
      n++;
      if (n >= 99000) throw new Error(`ID_RANGE_EXHAUSTED ${prefix}: 99000 to 99999 is reserved for fixtures`);
      out.set(r.key, `${prefix}-${String(n).padStart(5, "0")}`);
    }
  }
  return out;
}
