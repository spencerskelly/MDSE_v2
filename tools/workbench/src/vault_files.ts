/* Getting a vault into memory: a folder (picker, drop or <input webkitdirectory>) or an MDSE.zip. Text notes only;
 * attachments and other binaries are not read. Paths are vault-relative with forward slashes. */

const WANT = /\.(md)$/i;
const MAX_FILE = 5 * 1024 * 1024;

export async function readZip(buf: ArrayBuffer): Promise<Map<string, string>> {
  const u8 = new Uint8Array(buf), dv = new DataView(buf), out = new Map<string, string>();
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("Not a ZIP file (no end-of-archive record).");
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error("ZIP central directory is damaged.");
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), usize = dv.getUint32(p + 24, true);
    const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
    p += 46 + nlen + xlen + clen;
    if (name.endsWith("/") || !(WANT.test(name) || /Parser Check\.md$/.test(name)) || usize > MAX_FILE) continue;
    const lnlen = dv.getUint16(off + 26, true), lxlen = dv.getUint16(off + 28, true), start = off + 30 + lnlen + lxlen;
    const raw = u8.subarray(start, start + csize);
    let data: Uint8Array;
    if (method === 0) data = raw;
    else if (method === 8) {
      const ds = new DecompressionStream("deflate-raw"), w = ds.writable.getWriter();
      void w.write(raw).then(() => w.close());
      data = new Uint8Array(await new Response(ds.readable).arrayBuffer());
    } else throw new Error(`ZIP entry ${name} uses unsupported compression method ${method}.`);
    out.set(name, dec.decode(data));
  }
  return out;
}

export async function readFileList(list: FileList | File[]): Promise<Map<string, string>> {
  const files = [...list], out = new Map<string, string>();
  const rel = (f: File): string => ((f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name);
  const prefix = files.length && rel(files[0]!).includes("/") ? rel(files[0]!).split("/")[0] + "/" : "";   // drop the picked folder's own name
  for (const f of files) {
    const p = rel(f).startsWith(prefix) ? rel(f).slice(prefix.length) : rel(f);
    if (/(^|\/)\.(obsidian|git)\//.test(p) || !WANT.test(p) || f.size > MAX_FILE) continue;
    out.set(p, await f.text());
  }
  return out;
}

interface DirHandle { entries(): AsyncIterable<[string, { kind: string; getFile?: () => Promise<File> } & DirHandle]> }
export async function readDirHandle(dir: DirHandle, prefix = "", out = new Map<string, string>()): Promise<Map<string, string>> {
  for await (const [name, h] of dir.entries()) {
    if (name === ".git" || name === ".obsidian" || name === "node_modules") continue;
    if (h.kind === "directory") await readDirHandle(h, prefix + name + "/", out);
    else if (WANT.test(name)) { const f = await h.getFile!(); if (f.size <= MAX_FILE) out.set(prefix + name, await f.text()); }
  }
  return out;
}
