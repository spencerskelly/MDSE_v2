import test from "node:test";
import assert from "node:assert/strict";
import { buildIndex } from "../src/index.ts";
import { addTermNote, buildTermCatalog, commonTerms, emptyTermCatalog, searchTermCatalog, tokenizeTerms } from "../src/term_discovery.ts";

const note = (name: string, type: string, text: string, description = "", other = "") =>
  `---
type: ${type}
uid: 20261120180000${name.replace(/[^A-Za-z]/g, "").slice(0, 10)}
name: ${name}
description: ${description}
${other}---
# ${name}

${text}
`;

test("shared-term discovery finds legacy requirements, verification cases and parts across source fields", () => {
  const files = new Map<string, string>([
    ["20/REQ.md", note("Battery Cooling", "Requirement", "The charging controller monitors battery temperature and stops when overheated.", "Cooling fan shutdown threshold", "aliases: [ThermalSafe]\nid: REQ-00123\n")],
    ["40/VER.md", note("Overtemperature verification", "Verification", "Test battery cooling at 60 C. Confirm shutdown, and inspect the fan.", "Temperature test procedure", "id: VER-00123\n")],
    ["30/OBJ.md", note("Cooling Fan", "Object", "Battery pack air circulation. The fan receives power when enabled.", "Thermal fan design", "partNumber: 5913495D\n")],
    ["30/NOTE.md", note("CAN Controller", "Object", "CANH CANL; 500k signaling without thermal shutdown.", "", "id: OBJ-00077\n")],
    ["50/IGNORE.md", "# This is not a governed model note\n\nCooling battery fan."],
  ]);
  const ix = buildIndex(files);
  assert.equal(ix.notes.size, 4);
  const original = JSON.stringify([...files]);
  const c = buildTermCatalog(ix);
  assert.equal(c.indexed, 4);
  const battery = searchTermCatalog(c, "battery");
  assert.equal(battery.total, 3);
  assert.deepEqual(battery.groups.map((g) => g.type).sort(), ["Object", "Requirement", "Verification"]);
  assert.ok(battery.groups.every((g) => g.total === 1));
  const cooling = searchTermCatalog(c, "cooling fan");
  assert.equal(cooling.total, 3);
  assert.deepEqual(cooling.terms, ["cooling", "fan"]);
  assert.equal(searchTermCatalog(c, "cooling fan CANH").total, 0, "all terms must belong to the same note");
  assert.equal(searchTermCatalog(c, "cool").total, 0, "partial-word coincidences must not be treated as a match");
  assert.equal(searchTermCatalog(c, "thermalSafe").total, 1, "aliases are indexed");
  assert.equal(searchTermCatalog(c, "REQ-00123").total, 1, "identities and hyphenated identifiers are supported");
  assert.equal(searchTermCatalog(c, "5913495D").total, 1, "part number text is searchable");
  assert.equal(searchTermCatalog(c, "shutdown", 25, "Verification").groups[0]?.type, "Verification");
  assert.equal(searchTermCatalog(c, "shutdown", 25, "Requirement").total, 1);
  assert.equal(searchTermCatalog(c, "shutdown", 25, "Object").total, 1);
  const common = commonTerms(c, 30, 2, true);
  const fan = common.find((e) => e.word === "fan");
  assert.ok(fan);
  assert.equal(fan!.notes, 3);
  assert.equal(fan!.types, 3);
  assert.ok(!common.some((e) => e.word === "the" || e.word === "shall"));
  assert.ok(common.every((e) => e.types >= 2));
  const first = searchTermCatalog(c, "battery");
  assert.ok(first.groups.every((g) => g.matches.every((m) => m.fields.length && m.excerpt.length)));
  assert.deepEqual(searchTermCatalog(c, "battery"), first, "the result order must be stable");
  assert.equal(JSON.stringify([...files]), original, "word discovery must be strictly read-only");
  assert.equal(ix.edges.length, 0, "shared terms never create SysML or YAML relationships");
  assert.equal(ix.notes.size, 4, "plain markdown is not silently promoted to a governed element");
});

test("term search has exact per-type counts and deterministic pagination without duplicating notes", () => {
  const c = emptyTermCatalog(), files = new Map<string, string>();
  for (let i = 0; i < 100; i++)
    files.set("20/R" + i + ".md", note("Voltage test " + i, i < 60 ? "Requirement" : "Verification",
      "The voltage threshold is validated in a controlled procedure.", "Test voltage"));
  const ix = buildIndex(files);
  for (const n of ix.notes.values()) addTermNote(c, n);
  assert.equal(c.indexed, 100);
  for (const n of ix.notes.values()) addTermNote(c, n);
  assert.equal(c.indexed, 100, "incremental indexing of the same path is idempotent");
  const x = searchTermCatalog(c, "voltage", 10);
  assert.equal(x.total, 100);
  assert.deepEqual(x.groups.map((g) => [g.type, g.total, g.matches.length]), [
    ["Requirement", 60, 10], ["Verification", 40, 10]]);
  assert.equal(x.truncated, true);
  assert.equal(searchTermCatalog(c, "voltage", 60).total, 100);
  assert.equal(searchTermCatalog(c, "voltage", 60).truncated, false);
  assert.equal(searchTermCatalog(c, "voltage", 8, "Verification").total, 40);
  assert.equal(searchTermCatalog(c, "voltage", 8, "Object").total, 0);
  assert.equal(new Set(x.groups.flatMap((g) => g.matches.map((r) => r.path))).size, 20);
  const forbidden = new Map(c.notes);
  Object.defineProperty(forbidden, Symbol.iterator, {
    value: () => { throw new Error("Search must not iterate the full vault after building the index"); } });
  assert.equal(searchTermCatalog({ ...c, notes: forbidden }, "voltage", 5).total, 100);
});

test("term tokenizer retains engineering symbols without introducing partial matches", () => {
  assert.deepEqual(tokenizeTerms("CANH/CANL, OCPP-1.6J 5k NTC and 5913495D"), [
    "canh", "canl", "ocpp-1", "ocpp", "1", "6j", "5k", "ntc", "and", "5913495d"]);
  assert.deepEqual(tokenizeTerms("fan/temperature sensor fan"), ["fan", "temperature", "sensor", "fan"]);
  assert.equal(searchTermCatalog(emptyTermCatalog(), "").total, 0);
  assert.equal(commonTerms(emptyTermCatalog()).length, 0);
});
