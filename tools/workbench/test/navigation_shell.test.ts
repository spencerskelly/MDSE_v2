import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { stripTypeScriptTypes } from "node:module";

// Execute the actual plugin shell against a minimal Obsidian API. Unlike a
// source-only regex test, these cases exercise the navigation callbacks.
const pluginSource = stripTypeScriptTypes(fs.readFileSync(new URL("../src/plugin.ts", import.meta.url), "utf8"), { mode: "strip" });
const obsidian = {
  Plugin: class {}, ItemView: class {}, PluginSettingTab: class {},
  FuzzySuggestModal: class {}, Modal: class {},
};
const sandbox = {
  module: { exports: {} }, require: (name: string) => {
    if (name === "obsidian") return obsidian;
    throw new Error("Unexpected module: " + name);
  },
  WB: {}, CLASSES: {}, MDSE: {}, setTimeout, clearTimeout, console,
};
vm.runInNewContext(pluginSource + "\nmodule.exports.__navTest = { openArtifact, hostFor };", sandbox, { filename: "plugin.ts" });
const Plugin = (sandbox.module as any).exports;
const { openArtifact, hostFor } = Plugin.__navTest;

test("table navigation uses existing Workbench without opening editor tabs", async () => {
  const calls: string[] = [];
  const panel = { view: { app_: { setLens: (lens: string) => calls.push("lens:" + lens) } } };
  const workspace = {
    getLeavesOfType: (type: string) => { assert.equal(type, "mdse-panel"); return [panel]; },
    revealLeaf: async (leaf: unknown) => { assert.equal(leaf, panel); calls.push("reveal"); },
    getLeaf: () => { throw new Error("Workbench navigation created an editor tab"); },
  };
  const plugin = Object.create(Plugin.prototype);
  plugin.app = { workspace };
  plugin.openPanel = async () => { calls.push("panel"); };
  plugin.ensureIndex = async () => { calls.push("index"); };
  plugin.syncSelection = () => { calls.push("selection"); };
  await plugin.openTable("structure");
  assert.deepEqual(calls, ["panel", "index", "lens:structure", "reveal", "selection"]);
});

test("note and canvas artifacts open new editor tabs and reuse existing tabs", async () => {
  const leaves: any[] = [];
  const opened: string[] = [], revealed: string[] = [];
  const workspace = {
    rootSplit: {},
    iterateAllLeaves: (fn: (leaf: any) => void) => leaves.forEach(fn),
    getMostRecentLeaf: () => null,
    getLeaf: (type: string) => {
      assert.equal(type, "tab");
      const leaf = {
        view: { file: null as any },
        openFile: async function (file: any) { this.view.file = file; opened.push(file.path); },
      };
      leaves.push(leaf);
      return leaf;
    },
    revealLeaf: async (leaf: any) => { revealed.push(leaf.view.file?.path); },
  };
  const note = { path: "20_Product Architecture/Controller.md" };
  const canvas = { path: "99_System/22_Views/Workbench Preview 1.canvas" };
  await openArtifact({ workspace }, note);
  await openArtifact({ workspace }, canvas);
  await openArtifact({ workspace }, note);
  assert.deepEqual(opened, [note.path, canvas.path]);
  assert.deepEqual(revealed, [note.path, canvas.path, note.path]);
  assert.equal(leaves.length, 2);
});

test("host note navigation follows editor-tab policy", async () => {
  let openedType: string | null = null;
  const file = { path: "example.md" };
  const workspace = {
    rootSplit: {}, iterateAllLeaves: (_fn: unknown) => {},
    getMostRecentLeaf: () => null,
    getLeaf: (type: string) => {
      openedType = type;
      return { openFile: async (_file: unknown) => {}, view: { file } };
    },
    revealLeaf: async (_leaf: unknown) => {},
  };
  const plugin = {
    app: {
      workspace, vault: { getAbstractFileByPath: (p: string) => p === file.path ? file : null },
      metadataCache: { getFirstLinkpathDest: () => null },
    },
  };
  hostFor(plugin).openNote(file.path);
  await new Promise((r) => setImmediate(r));
  assert.equal(openedType, "tab");
});

test("panel no longer offers a main-window table launcher", () => {
  const panel = fs.readFileSync(new URL("../src/panel.ts", import.meta.url), "utf8");
  assert.doesNotMatch(panel, /Table in main window/);
  assert.match(pluginSource, /Show MDSE table in Workbench/);
});


test("search result and Pick notes use the pinned Canvas writer, not a new preview", () => {
  const panel = fs.readFileSync(new URL("../src/panel.ts", import.meta.url), "utf8");
  assert.match(panel, /"Add selected to current Canvas"/);
  assert.match(panel, /busy\(place, "Adding…", \(\) => host\.addToCanvas!\("", \[\.\.\.pickSel\], destination\)\)/);
  assert.match(panel, /busy\(fresh, "Creating…", \(\) => host\.openPickCanvas!\(/);
  assert.match(panel, /busy\(addSelected, "Adding…", \(\) => host\.addToCanvas!\("", picked\(\), target\)\)/);
  assert.match(panel, /busy\(b, "Adding…", \(\) => host\.addToCanvas!\("", \[hit\.path\], target!\)\)/);
  assert.doesNotMatch(panel, /busy\(place, "Placing…", \(\) => host\.openPickCanvas!\(/);
});

test("Canvas search action refuses to target a different Canvas after indexing", async () => {
  const plugin = Object.create(Plugin.prototype);
  const notes = new Map([["20_Model/Note A.md", {}]]);
  plugin.ix = { notes };
  plugin.previews = new Map();
  plugin.app = { workspace: { revealLeaf: async () => {} } };
  let destination = "Saved/Original.canvas";
  plugin.canvasTarget = () => ({ path: destination, leaf: {} });
  plugin.ensureIndex = async () => { destination = "Saved/Other.canvas"; };
  let wasWritten = false;
  plugin.editTarget = async () => { wasWritten = true; };
  await assert.rejects(hostFor(plugin).addToCanvas("", ["20_Model/Note A.md"], "Saved/Original.canvas"),
    /Canvas target changed or closed/);
  assert.equal(wasWritten, false);
});

test("Canvas search action adds multiple notes to the named Canvas without replacing it", async () => {
  const plugin = Object.create(Plugin.prototype);
  const canvasPath = "Saved/Investigation.canvas";
  const notes = new Map([["20_Model/Note A.md", {}], ["20_Model/Note B.md", {}]]);
  const existing = { nodes: [{ id: "existing", type: "file", file: "20_Model/Existing.md", x: 17, y: 28, width: 220, height: 100 }], edges: [] };
  let stored = JSON.stringify(existing);
  const calls: string[] = [];
  plugin.ix = { notes };
  plugin.previews = new Map();
  plugin.canvasTarget = () => ({ path: canvasPath, leaf: { id: "saved-leaf" } });
  plugin.ensureIndex = async () => {};
  plugin.app = { workspace: { revealLeaf: async () => { calls.push("reveal"); } } };
  plugin.editTarget = async (target: any, change: (text: string) => string | null) => {
    assert.equal(target.path, canvasPath);
    const updated = change(stored);
    if (updated !== null) stored = updated;
    calls.push("write");
  };
  sandbox.WB.addToCanvas = (doc: any, _index: any, _anchor: any, paths: string[]) => ({
    doc: { nodes: [...doc.nodes, ...paths.map((p) => ({ id: p, type: "file", file: p, x: 500, y: 600, width: 220, height: 100 }))], edges: doc.edges },
    added: paths.length, present: 0, lineIds: [],
  });
  sandbox.WB.refreshCanvas = (doc: any) => ({ doc, linesAdded: 0, linesRemoved: 0 });
  const result = await hostFor(plugin).addToCanvas("", ["20_Model/Note A.md", "20_Model/Note B.md"], canvasPath);
  assert.match(result, /Added 2 notes to Saved\/Investigation\.canvas/);
  assert.deepEqual(calls, ["write", "reveal"]);
  const output = JSON.parse(stored);
  assert.equal(output.nodes.length, 3);
  assert.deepEqual(output.nodes[0], existing.nodes[0]);
});


test("Canvas tab changes refresh search destination without resetting an active edit form", () => {
  assert.match(pluginSource, /workspace\.on\("active-leaf-change"/);
  assert.match(pluginSource, /panel\.lens\?\.\(\) !== "edit"/);
  assert.match(pluginSource, /panel\.refresh\?\.\(\)/);
});
