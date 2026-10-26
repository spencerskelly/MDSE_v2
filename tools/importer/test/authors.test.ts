import test from "node:test";
import assert from "node:assert/strict";
import { resolveLogins, authorCode, type AuthorOptions } from "../src/identity.ts";

const base: AuthorOptions = { authorMap: { "Spencer Skelly": "skellyspencer" }, fallbackCode: "skellyspencer", unmappedNames: [] };

test("D-0105: a short EA login takes the code of the person it belongs to, with the most letters known", () => {
  const o = resolveLogins(["skellys", "Floria Koerfer", "koerfefl", "Legaspi, Chesca", "legaspic", "nobody", "kirchnes"], base);
  assert.equal(authorCode("skellys", o).code, "skellyspencer", "a known code that starts with the login");
  assert.equal(authorCode("koerfefl", o).code, "koerferfloria", "last name letters, then first name letters");
  assert.equal(authorCode("legaspic", o).code, "legaspichesca");
  assert.equal(authorCode("nobody", o).code, "nobody-------", "no match: left as it is");
  assert.equal(authorCode("kirchnes", o).code, "kirchnes-----");
});

test("D-0105: a login that fits two people stays as it is", () => {
  const o = resolveLogins(["Ann Smith", "Alan Smith", "smitha"], base);
  assert.equal(authorCode("smitha", o).code, "smitha-------");
});

test("D-0105: an explicit mapping always wins", () => {
  const o = resolveLogins(["skellys"], { ...base, authorMap: { ...base.authorMap, skellys: "spencerskelly" } });
  assert.equal(authorCode("skellys", o).code, "spencerskelly");
});
