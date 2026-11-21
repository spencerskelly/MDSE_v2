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
