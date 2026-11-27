/* Read-only Canvas projection of one SysML usage and its explicit connections.
 * Canvas cards and lines never become model notes or relationship authority. */
import type { ModelIndex } from "./index.ts";
import type { CanvasResult, CanvasDoc, CanvasNode, CanvasEdge } from "./canvas.ts";
import { memberDetails } from "./member_nav.ts";

export const MEMBER_CANVAS_PREFIX = "mdse-member:";
export const MEMBER_CANVAS_LIMIT = 24;
export function memberConnectionCanvas(ix: ModelIndex, owner: string, key: string,
  limit = MEMBER_CANVAS_LIMIT): CanvasResult {
  const n = ix.notes.get(owner);
  const member = memberDetails(ix, owner).find((m) => m.key === key);
  if (!n || !member) throw new Error("This SysML member no longer exists. Refresh and select it again.");
  const total = member.connections.length, chosen = member.connections.slice(0, Math.max(0, Math.floor(limit)));
  const capped = chosen.length < total;
  const nodes: CanvasNode[] = [], edges: CanvasEdge[] = [];
  const ownerId = MEMBER_CANVAS_PREFIX + "owner", selectedId = MEMBER_CANVAS_PREFIX + "selected";
  nodes.push({ id: ownerId, type: "file", file: owner, x: 340, y: -290, width: 340, height: 170 });
  const typeLine = member.typePath
    ? `**Type definition:** [[${member.typePath}|${member.type}]]`
    : member.type ? `**Unresolved type:** ${member.type}` : "**Untyped usage**";
  nodes.push({ id: selectedId, type: "text", x: 340, y: 180, width: 430, height: 190, color: "4",
    text: [`**Selected ${member.kind} usage (not a note)**`, `\`${member.head}\``,
      typeLine, `**Owner:** [[${owner}]]`,
      `**Explicit links shown:** ${chosen.length} of ${total}`].join("\n\n") });
  const endCards = new Map<string, CanvasNode>();
  let left = 0, right = 0, unresolved = 0;
  for (let i = 0; i < chosen.length; i++) {
    const c = chosen[i]!, other = c.otherEnd;
    const missing = !other.resolved || !c.thisEnd.resolved;
    if (missing) unresolved++;
    const side = c.kind === "flow" && c.position === "b" ? "left" : "right";
    const idKey = side + "|" + other.text;
    let target = endCards.get(idKey);
    if (!target) {
      const row = side === "left" ? left++ : right++;
      const typ = other.path ? ix.notes.get(other.path) : null;
      const description = other.resolved
        ? `**Resolved member:** ${other.usage ?? "(unknown)"}`
        : "**Unresolved endpoint — review SysML**";
      const type = typ ? `**Endpoint type:** [[${other.path}|${typ.title}]]`
        : other.path ? `**Endpoint type:** [[${other.path}]]`
          : "**No separate definition note required**";
      target = { id: MEMBER_CANVAS_PREFIX + "endpoint:" + side + ":" + row, type: "text",
        x: side === "left" ? -470 : 1300, y: row * 260, width: 420, height: 170,
        color: other.resolved ? "5" : "1",
        text: [`**Endpoint: ${other.text}**`, description, type].join("\n\n") };
      endCards.set(idKey, target); nodes.push(target);
    }
    const flowIn = c.kind === "flow" && c.position === "b";
    const fromNode = flowIn ? target.id : selectedId, toNode = flowIn ? selectedId : target.id;
    const pair = c.kind === "flow" ? (flowIn
      ? `${other.text} → ${c.thisEnd.text}` : `${c.thisEnd.text} → ${other.text}`)
      : `${c.thisEnd.text} ↔ ${other.text}`;
    const label = [c.kind === "connect" && c.form && c.form !== "plain" ? c.form : c.kind,
      pair, missing ? "⚠ unresolved" : ""].filter(Boolean).join(" · ");
    const edge: CanvasEdge = { id: MEMBER_CANVAS_PREFIX + "statement:" + i, fromNode, toNode,
      fromSide: "right", toSide: "left",
      toEnd: c.kind === "flow" ? "arrow" : "none", label: label.slice(0, 150) };
    edges.push(edge);
  }
  const title = [n.title, member.name].join(" - ").replace(/[\\/:*?"<>|#^\[\]]/g, " ").slice(0, 90);
  return { doc: { nodes, edges }, notes: 1, unresolved, capped, groups: 0, hidden: 0,
    fileName: `Member Connections - ${title}.canvas`, saveFolder: n.folder };
}
