/* Load the vendored sql.js engine under Node (tests and command-line tools). Plugins embed the same files instead. */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { SqlStatic } from "./mdse_db.ts";

const VENDOR = new URL("../vendor/sqljs/", import.meta.url);
export async function loadSqlJsNode(): Promise<SqlStatic> {
  const require = createRequire(import.meta.url);
  const init = require(fileURLToPath(new URL("sql-wasm.js", VENDOR))) as (o: { wasmBinary: Uint8Array }) => Promise<SqlStatic>;
  return init({ wasmBinary: new Uint8Array(readFileSync(new URL("sql-wasm.wasm", VENDOR))) });
}
