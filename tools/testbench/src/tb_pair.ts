/* Phone capture (D-0170, TBN-004): the bench PC serves one small page on the local network while a capture session is
 * open. The engineer scans a QR code; the phone's browser opens the page (no app, no sign-in); each photo is shrunk on
 * the phone and sent straight to the PC, where Testbench files it under the run step.
 *
 * Safety: the server runs only while a session is open and stops when it closes or expires; every request needs the
 * session's random token in its path; uploads are limited in size and type; nothing is served but the capture page.
 * Node modules are passed in (the Obsidian desktop shell gives `require("http")`; tests give the real modules). */

export interface PairDeps {
  http: { createServer(fn: (req: any, res: any) => void): any };
  os: { networkInterfaces(): Record<string, Array<{ family: string | number; address: string; internal: boolean }> | undefined> };
  randomHex(bytes: number): string;
}
export interface PairUpload { name: string; type: string; caption: string; bytes: Uint8Array }
export interface PairSession {
  token: string; url: string; urls: string[]; port: number; label: string; expires: number;
  received: Array<{ name: string; file: string; at: string }>;
  close(): Promise<void>;
}
export interface PairOptions {
  label: string; port?: number; minutes?: number; maxBytes?: number;
  /** file the upload; returns the vault path it was saved to */
  onFile(u: PairUpload): Promise<string>;
  onClose?(): void;
  now?(): number;
}
export const PAIR_MAX_BYTES = 30 * 1024 * 1024;
const OK_TYPE = /^(image\/(jpeg|png|webp|gif|heic|heif)|application\/pdf|text\/(csv|plain))$/;

/** Local IPv4 addresses a phone on the same network can reach, private ranges first. */
export function lanAddresses(os: PairDeps["os"]): string[] {
  const out: string[] = [];
  for (const list of Object.values(os.networkInterfaces())) for (const a of list ?? []) if ((a.family === "IPv4" || a.family === 4) && !a.internal) out.push(a.address);
  const rank = (ip: string): number => (/^192\.168\./.test(ip) ? 0 : /^10\./.test(ip) ? 1 : /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ? 2 : /^169\.254\./.test(ip) ? 9 : 5);
  return out.sort((a, b) => rank(a) - rank(b));
}

const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
/** The page the phone opens. Self-contained: no external scripts, fonts or images. */
export function phonePage(label: string, token: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Testbench capture</title><style>
body{font:17px/1.4 -apple-system,system-ui,sans-serif;margin:0;padding:16px;background:#f6f7f9;color:#1d2330}
h1{font-size:18px;margin:0 0 4px}.lab{color:#5b6475;font-size:14px;margin-bottom:14px}
.big{display:block;width:100%;padding:18px;font-size:19px;font-weight:600;border:0;border-radius:12px;background:#2557d6;color:#fff;margin:10px 0}
.sec{background:#fff;color:#2557d6;border:2px solid #2557d6}input[type=text]{width:100%;box-sizing:border-box;font-size:17px;padding:10px;border:1px solid #c9ced8;border-radius:8px}
ul{list-style:none;padding:0}li{background:#fff;border-radius:8px;padding:10px;margin:6px 0;font-size:15px}.ok{color:#1b7a3a}.bad{color:#b3261e}
</style></head><body><h1>Testbench capture</h1><div class="lab">${esc(label)}</div>
<label>Caption (optional)<input type="text" id="cap" placeholder="What does this show?"></label>
<input type="file" id="cam" accept="image/*" capture="environment" hidden><input type="file" id="pick" accept="image/*,.csv,.pdf,.txt" multiple hidden>
<button class="big" onclick="document.getElementById('cam').click()">Take photo</button>
<button class="big sec" onclick="document.getElementById('pick').click()">Choose photos or files</button>
<ul id="list"></ul>
<script>
const T=${JSON.stringify(token)},L=document.getElementById('list');
function row(t,c){const li=document.createElement('li');li.textContent=t;if(c)li.className=c;L.prepend(li);return li;}
async function shrink(f){if(!/^image\\/(jpeg|png|webp|heic|heif)$/.test(f.type))return f;try{const b=await createImageBitmap(f);const m=2000,s=Math.min(1,m/Math.max(b.width,b.height));
const c=document.createElement('canvas');c.width=Math.round(b.width*s);c.height=Math.round(b.height*s);c.getContext('2d').drawImage(b,0,0,c.width,c.height);
const out=await new Promise(r=>c.toBlob(r,'image/jpeg',0.85));return out?new File([out],f.name.replace(/\\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'}):f;}catch(e){return f;}}
async function send(files){for(const f0 of files){const li=row('Sending '+f0.name+'…');try{const f=await shrink(f0);
const q='name='+encodeURIComponent(f.name)+'&caption='+encodeURIComponent(document.getElementById('cap').value);
const r=await fetch('/c/'+T+'/upload?'+q,{method:'POST',headers:{'Content-Type':f.type||'application/octet-stream'},body:f});
const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||('HTTP '+r.status));li.textContent='Saved: '+(j.file||f.name);li.className='ok';}
catch(e){li.textContent='Not saved: '+f0.name+' ('+e.message+')';li.className='bad';}}}
document.getElementById('cam').onchange=e=>{send([...e.target.files]);e.target.value='';};
document.getElementById('pick').onchange=e=>{send([...e.target.files]);e.target.value='';};
</script></body></html>`;
}

/** Open a capture session: start the server, return the link for the QR code. */
export function openPairSession(deps: PairDeps, o: PairOptions): Promise<PairSession> {
  const token = deps.randomHex(16), now = o.now ?? Date.now, limit = o.maxBytes ?? PAIR_MAX_BYTES;
  const expires = now() + (o.minutes ?? 15) * 60_000;
  const received: PairSession["received"] = [];
  let closed = false, server: any = null;
  const json = (res: any, code: number, body: unknown): void => { res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify(body)); };
  const handler = (req: any, res: any): void => {
    const url = new URL(req.url ?? "/", "http://x"), parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] !== "c" || parts[1] !== token) { res.writeHead(404); res.end(); return; }
    if (now() > expires) { json(res, 410, { error: "This capture link has expired. Open a new one in Testbench." }); void session.close(); return; }
    if (req.method === "GET" && parts.length === 2) { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }); res.end(phonePage(o.label, token)); return; }
    if (req.method === "POST" && parts[2] === "upload") {
      const type = String(req.headers["content-type"] ?? "").split(";")[0]!.trim().toLowerCase();
      if (!OK_TYPE.test(type)) { json(res, 415, { error: `Files of type ${type || "unknown"} are not accepted.` }); req.resume(); return; }
      const chunks: Uint8Array[] = []; let size = 0, over = false;
      req.on("data", (c: Uint8Array) => { size += c.length; if (size > limit) { over = true; return; } chunks.push(c); });
      req.on("end", async () => {
        if (over) { json(res, 413, { error: `Larger than ${Math.round(limit / 1048576)} MB.` }); return; }
        const bytes = new Uint8Array(size); let off = 0; for (const c of chunks) { bytes.set(c, off); off += c.length; }
        const name = (url.searchParams.get("name") || "photo.jpg").slice(0, 120), caption = (url.searchParams.get("caption") || "").slice(0, 300);
        try { const file = await o.onFile({ name, type, caption, bytes }); received.push({ name, file, at: new Date(now()).toISOString() }); json(res, 200, { ok: true, file: file.slice(file.lastIndexOf("/") + 1) }); }
        catch (e) { json(res, 500, { error: String((e as Error)?.message ?? e) }); }
      });
      return;
    }
    res.writeHead(405); res.end();
  };
  const session: PairSession = { token, url: "", urls: [], port: 0, label: o.label, expires, received,
    close: () => new Promise<void>((resolve) => { if (closed || !server) { resolve(); return; } closed = true; clearTimeout(timer); server.close(() => resolve()); server.closeAllConnections?.(); o.onClose?.(); }) };
  const timer = setTimeout(() => { void session.close(); }, Math.max(1000, expires - now()));
  return new Promise((resolve, reject) => {
    server = deps.http.createServer(handler);
    // a phone that drops off Wi-Fi mid-upload must not hold a connection open for minutes
    server.requestTimeout = 120_000; server.headersTimeout = 30_000; server.keepAliveTimeout = 5_000;
    server.on("error", (e: unknown) => { clearTimeout(timer); reject(e); });
    server.listen(o.port ?? 0, "0.0.0.0", () => {
      const port = server.address().port as number, ips = lanAddresses(deps.os);
      session.port = port; session.urls = ips.map((ip) => `http://${ip}:${port}/c/${token}`); session.url = session.urls[0] ?? `http://127.0.0.1:${port}/c/${token}`;
      resolve(session);
    });
  });
}
