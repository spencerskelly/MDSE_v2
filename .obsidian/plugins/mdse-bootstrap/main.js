/* MDSE Bootstrap 0.1.0. Runs when the vault opens, after the person has chosen "Trust author and enable plugins".
 * It cannot grant that trust (Obsidian keeps it outside the vault). What it does once it runs:
 *   1. read .obsidian/plugin-lock.yaml and check each shipped plugin's files against the recorded SHA-256;
 *   2. enable every locked plugin that passes (a plugin that fails stays off and is reported);
 *   3. write the governed settings from the lock into each plugin's data.json (BOO-005);
 *   4. enable the required core plugins and switch off the prohibited ones;
 *   5. when .vault.yaml has no author, ask for a name once, derive the 13-character code (MOD-002), write it and the person note.
 * Pure helpers are exported for tests; the plugin class needs Obsidian. */
"use strict";

function deriveAuthorCode(name) {
  const clean = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
  let first = "", last = "";
  if (name.includes(",")) { const p = name.split(","); last = clean(p[0] || ""); first = clean(p[1] || ""); }
  else { const t = name.trim().split(/\s+/); first = clean(t[0] || ""); last = t.length > 1 ? clean(t[t.length - 1] || "") : ""; }
  return (last + first + "-------------").slice(0, 13);
}

/** Reads the lock written by the base vault: {requiredCorePlugins, disabledCorePlugins, plugins: {id: {version, settings, sha256: {file: hex}}}}. */
function parseLock(text) {
  const out = { requiredCorePlugins: [], disabledCorePlugins: [], plugins: {} };
  let cur = null, inHash = false;
  const list = (v) => v.replace(/^\[|\]$/g, "").split(",").map((s) => s.trim()).filter(Boolean);
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    if (/^\s*#/.test(raw) || !raw.trim()) continue;
    let m;
    if ((m = /^requiredCorePlugins:\s*(.*)$/.exec(raw))) { out.requiredCorePlugins = list(m[1]); continue; }
    if ((m = /^disabledCorePlugins:\s*(.*)$/.exec(raw))) { out.disabledCorePlugins = list(m[1]); continue; }
    if ((m = /^  ([A-Za-z0-9_.-]+):\s*$/.exec(raw))) { cur = out.plugins[m[1]] = { version: "", settings: null, sha256: {} }; inHash = false; continue; }
    if (!cur) continue;
    if ((m = /^    version:\s*"?([^"]+)"?\s*$/.exec(raw))) { cur.version = m[1]; inHash = false; continue; }
    if ((m = /^    settings:\s*(.*)$/.exec(raw))) { inHash = false; try { cur.settings = m[1].trim() === "default" ? null : JSON.parse(m[1]); } catch (_) { cur.settings = null; } continue; }
    if (/^    sha256:\s*$/.test(raw)) { inHash = true; continue; }
    if (inHash && (m = /^      ([A-Za-z0-9_.-]+):\s*([0-9a-f]{64})\s*$/.exec(raw))) { cur.sha256[m[1]] = m[2]; continue; }
    if (/^    \S/.test(raw)) inHash = false;
  }
  return out;
}

async function sha256Hex(bytes) {
  const d = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const norm = (s) => s.replace(/\r\n/g, "\n");
const encode = (s) => new TextEncoder().encode(s);

/** Compare each locked file with the lock. Text is normalised to LF before hashing, as the lock was written. */
async function verifyPlugin(readText, id, entry) {
  const bad = [];
  for (const [file, want] of Object.entries(entry.sha256)) {
    let text = null; try { text = await readText(`.obsidian/plugins/${id}/${file}`); } catch (_) { /* missing */ }
    if (text === null || text === undefined) { bad.push(`${file} missing`); continue; }
    if ((await sha256Hex(encode(norm(text)))) !== want) bad.push(`${file} differs`);
  }
  return bad;
}

/** Governed keys win; the person's other keys stay (BOO-005). Returns the merged object and whether anything changed. */
function mergeGoverned(current, governed) {
  const next = { ...(current || {}) }; let changed = false;
  for (const [k, v] of Object.entries(governed || {})) if (JSON.stringify(next[k]) !== JSON.stringify(v)) { next[k] = v; changed = true; }
  return { next, changed };
}

function personNote(name, code, tz) {
  return `---\nname: ${JSON.stringify(name)}\nauthorCode: ${code}\ntimezone: ${tz}\npreviousCodes: []\neaNames: []\ntags: [person]\n---\n# ${name}\n`;
}

if (typeof module !== "undefined") module.exports = { deriveAuthorCode, parseLock, verifyPlugin, mergeGoverned, personNote, sha256Hex };

let obsidian = null; try { obsidian = require("obsidian"); } catch (_) { /* tests run without Obsidian */ }
if (obsidian) {
  const { Plugin, Notice, Modal, Setting } = obsidian;
  class NameModal extends Modal {
    constructor(app, done) { super(app); this.done = done; this.value = ""; }
    onOpen() {
      const { contentEl } = this; contentEl.addClass("mdse-bs-modal");
      contentEl.createEl("h2", { text: "Who is working in this vault?" });
      contentEl.createEl("p", { text: "Your full name sets your author code. It is written into every new note's uid. You enter it once." });
      const preview = contentEl.createEl("p"); const err = contentEl.createEl("p", { cls: "mdse-bs-bad" });
      const show = () => { preview.empty(); preview.appendText("Author code: "); preview.createEl("code", { text: this.value.trim() ? deriveAuthorCode(this.value) : "(enter a name)" }); };
      show();
      new Setting(contentEl).setName("Full name").setDesc("First and last name, for example Spencer Skelly.").addText((t) => { t.setPlaceholder("First Last").onChange((v) => { this.value = v; show(); }); setTimeout(() => t.inputEl.focus(), 50); });
      new Setting(contentEl).addButton((b) => b.setButtonText("Save").setCta().onClick(() => {
        const n = this.value.trim(); if (!/[A-Za-z]/.test(n) || n.split(/\s+/).length < 2 && !n.includes(",")) { err.setText("Enter a first and last name."); return; }
        this.done(n); this.close();
      }));
    }
    onClose() { this.contentEl.empty(); }
  }

  module.exports = class MdseBootstrap extends Plugin {
    async onload() {
      this.unloaded = false; this.running = false;
      this.addCommand({ id: "check-vault", name: "Check and repair this vault", callback: () => this.run(true) });
      this.app.workspace.onLayoutReady(() => { setTimeout(() => { if (!this.unloaded) this.run(false); }, 1500); });
    }
    onunload() { this.unloaded = true; }
    async readText(p) { const a = this.app.vault.adapter; return (await a.exists(p)) ? a.read(p) : null; }
    async run(manual) {
      if (this.running) return; this.running = true;
      const report = [];
      try {
        const a = this.app.vault.adapter, lockText = await this.readText(".obsidian/plugin-lock.yaml");
        if (lockText === null) { new Notice("MDSE Bootstrap: .obsidian/plugin-lock.yaml is missing; nothing was checked."); return; }
        const lock = parseLock(lockText), plugins = this.app.plugins;
        // 1-3: verify, apply governed settings, enable
        for (const [id, entry] of Object.entries(lock.plugins)) {
          if (id === this.manifest.id) continue;
          const bad = await verifyPlugin((p) => this.readText(p), id, entry);
          if (bad.length) { report.push(`${id}: not enabled, ${bad.join(", ")}`); continue; }
          if (entry.settings) {
            const path = `.obsidian/plugins/${id}/data.json`; let cur = {};
            try { const t = await this.readText(path); if (t) cur = JSON.parse(t); } catch (_) { cur = {}; }
            const m = mergeGoverned(cur, entry.settings);
            if (m.changed) { await a.write(path, JSON.stringify(m.next, null, 2) + "\n"); if (plugins.enabledPlugins.has(id)) report.push(`${id}: settings updated; reload the plugin to apply`); }
          }
          if (!plugins.enabledPlugins.has(id)) {
            try { await plugins.enablePluginAndSave(id); report.push(`${id}: enabled`); } catch (e) { report.push(`${id}: could not enable (${e && e.message ? e.message : e})`); }
          }
        }
        // 4: core plugins
        const core = this.app.internalPlugins;
        if (core && core.getPluginById) {
          for (const id of lock.requiredCorePlugins) { const p = core.getPluginById(id); if (p && !core.getEnabledPluginById(id)) { try { await core.enablePlugin(id); report.push(`core ${id}: enabled`); } catch (_) { report.push(`core ${id}: could not enable`); } } }
          for (const id of lock.disabledCorePlugins) { if (core.getEnabledPluginById && core.getEnabledPluginById(id)) { try { await core.disablePlugin(id); report.push(`core ${id}: turned off`); } catch (_) { /* leave */ } } }
        }
        // 5: author
        await this.ensureAuthor();
      } catch (e) { report.push("failed: " + (e && e.message ? e.message : e)); }
      finally { this.running = false; }
      if (report.length) new Notice("MDSE Bootstrap\n" + report.join("\n"), 10000);
      else if (manual) new Notice("MDSE Bootstrap: everything is in order.");
    }
    async ensureAuthor() {
      const y = await this.readText(".vault.yaml"); if (y === null) return;
      const m = /^author:\s*(\S*)\s*$/m.exec(y);
      if (m && m[1] && m[1] !== "UNINITIALIZED") return;
      const name = await new Promise((res) => { const mo = new NameModal(this.app, res); mo.onClose = () => { mo.contentEl.empty(); res(null); }; mo.open(); });
      if (!name) return;
      const code = deriveAuthorCode(name), a = this.app.vault.adapter;
      await a.write(".vault.yaml", m ? y.replace(/^author:.*$/m, `author: ${code}`) : y.replace(/\n?$/, `\nauthor: ${code}\n`));
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles", dir = "99_System/04_People";
      if (!(await a.exists(dir))) await a.mkdir(dir);
      const p = `${dir}/${name}.md`; if (!(await a.exists(p))) await a.write(p, personNote(name, code, tz));
      new Notice(`MDSE: author code ${code} saved.`);
    }
  };
}
