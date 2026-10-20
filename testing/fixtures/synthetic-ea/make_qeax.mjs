// Builds a synthetic Enterprise Architect .qeax (SQLite) for importer tests.
// Synthetic only (DAT-002): invented charger model, invented people. The file is generated at test time into a
// temp directory and is never committed (CI rejects .qeax files).
//
//   node make_qeax.mjs <out.qeax> [--scale N]
//
// Table and column names follow EA's own schema for the tables the importer reads.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DDL = [
  `CREATE TABLE t_package (Package_ID INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT, Parent_ID INTEGER, CreatedDate TEXT, ModifiedDate TEXT, Notes TEXT, ea_guid TEXT, Version TEXT)`,
  `CREATE TABLE t_object (Object_ID INTEGER PRIMARY KEY AUTOINCREMENT, Object_Type TEXT, Diagram_ID INTEGER, Name TEXT, Alias TEXT, Author TEXT, Version TEXT, Note TEXT, Package_ID INTEGER, Stereotype TEXT, NType INTEGER, Complexity TEXT, Effort INTEGER, Style TEXT, Backcolor INTEGER, CreatedDate TEXT, ModifiedDate TEXT, Status TEXT, Abstract TEXT, PDATA1 TEXT, PDATA2 TEXT, PDATA3 TEXT, PDATA4 TEXT, PDATA5 TEXT, Classifier INTEGER, ea_guid TEXT, ParentID INTEGER, Classifier_guid TEXT, Multiplicity TEXT)`,
  `CREATE TABLE t_connector (Connector_ID INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT, Direction TEXT, Notes TEXT, Connector_Type TEXT, SubType TEXT, SourceCard TEXT, SourceRole TEXT, SourceIsAggregate INTEGER, DestCard TEXT, DestRole TEXT, DestIsAggregate INTEGER, Start_Object_ID INTEGER, End_Object_ID INTEGER, Stereotype TEXT, ea_guid TEXT, PDATA1 TEXT, PDATA2 TEXT, PDATA3 TEXT, SeqNo INTEGER, DiagramID INTEGER)`,
  `CREATE TABLE t_objectproperties (PropertyID INTEGER PRIMARY KEY AUTOINCREMENT, Object_ID INTEGER, Property TEXT, Value TEXT, Notes TEXT, ea_guid TEXT)`,
  `CREATE TABLE t_xref (XrefID TEXT, Name TEXT, Type TEXT, Visibility TEXT, Namespace TEXT, "Requirement" TEXT, "Constraint" TEXT, "Behavior" TEXT, "Partition" TEXT, Description TEXT, Client TEXT, Supplier TEXT, Link TEXT)`,
  `CREATE TABLE t_document (DocID TEXT, DocName TEXT, Notes TEXT, Style TEXT, ElementID TEXT, ElementType TEXT, StrContent TEXT, BinContent BLOB, DocType TEXT, Author TEXT, DocDate TEXT)`,
  `CREATE TABLE t_diagram (Diagram_ID INTEGER PRIMARY KEY AUTOINCREMENT, Package_ID INTEGER, Name TEXT, Diagram_Type TEXT, ea_guid TEXT)`,
];

const guid = (kind, n) => `{${kind}${String(n).padStart(7, "0")}-0000-4000-8000-5E5E5E5E5E5E}`.toUpperCase();

export function buildSyntheticQeax(file, { scale = 0 } = {}) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.rmSync(file, { force: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode=DELETE; PRAGMA page_size=4096;");
  for (const s of DDL) db.exec(s);
  let pk = 0, ok = 0, ck = 0, tk = 0;
  const T0 = Date.UTC(2021, 2, 1, 8, 0, 0);
  const stamp = (i) => new Date(T0 + i * 3600_000).toISOString().replace("T", " ").slice(0, 19);

  const pkg = (name, parent, notes = null) => {
    const id = ++pk;
    db.prepare("INSERT INTO t_package (Package_ID,Name,Parent_ID,CreatedDate,Notes,ea_guid) VALUES (?,?,?,?,?,?)").run(id, name, parent, stamp(id), notes, guid("P", id));
    // EA also stores each package as a t_object row of type Package.
    db.prepare("INSERT INTO t_object (Object_ID,Object_Type,Name,Author,Package_ID,CreatedDate,ea_guid,ParentID) VALUES (?,?,?,?,?,?,?,0)")
      .run(100000 + id, "Package", name, "Skelly, Spencer", parent, stamp(id), guid("PO", id));
    return id;
  };
  const obj = (type, name, packageId, o = {}) => {
    const id = ++ok;
    db.prepare(`INSERT INTO t_object (Object_ID,Object_Type,Name,Alias,Author,Note,Package_ID,Stereotype,CreatedDate,Classifier,ea_guid,ParentID,PDATA1,Multiplicity,Abstract)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, type, name, o.alias ?? null, o.author === undefined ? "Skelly, Spencer" : o.author, o.note ?? null,
      packageId, o.stereotype ?? null, o.created === undefined ? stamp(200 + id) : o.created, o.classifier ?? 0, guid("O", id), o.parent ?? 0, o.pdata1 ?? null, o.mult ?? null, o.abstract ?? null);
    for (const [k, v] of Object.entries(o.tags ?? {}))
      db.prepare("INSERT INTO t_objectproperties (Object_ID,Property,Value,ea_guid) VALUES (?,?,?,?)").run(id, k, v, guid("T", ++tk));
    return id;
  };
  const con = (type, src, dst, o = {}) => {
    const id = ++ck;
    db.prepare(`INSERT INTO t_connector (Connector_ID,Name,Direction,Notes,Connector_Type,SourceCard,DestCard,SourceIsAggregate,DestIsAggregate,Start_Object_ID,End_Object_ID,Stereotype,ea_guid)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, o.name ?? null, o.direction ?? "Source -> Destination", o.notes ?? null, type, o.srcCard ?? null, o.dstCard ?? null,
      o.srcAgg ?? 0, o.dstAgg ?? 0, src, dst, o.stereotype ?? null, guid("C", id));
    return id;
  };

  db.exec("BEGIN");
  const model = pkg("Model", 0), ipc = pkg("IPC !", model);
  const reqs = pkg("01 Standards Requirements", ipc), prod = pkg("02 Product", ipc), fns = pkg("03 Functions", ipc), ctx = pkg("04 Context", ipc);
  const power = pkg("Power Train", prod, "Synthetic package description.");

  // Product structure (definitions)
  const module_ = obj("Class", "Generic Module", prod, { stereotype: "Module", abstract: "1" });
  const controller = obj("Class", "Controller", prod, { stereotype: "Hardware Component", note: "Synthetic charge controller.", alias: "CTRL", tags: { PN: "SYN-CTRL-1", "MFG PN": "MFG-1", Status: "Approved", Brand: "Acme" } });
  const pm = obj("Class", "Power Module", power, { stereotype: "Hardware Component", note: "Synthetic 30 kW module." });
  const contactor = obj("Class", "Contactor", power, { stereotype: "Hardware Component" });
  const fw = obj("Class", "Charge Firmware", prod, { stereotype: "Software Component" });
  const charger = obj("Class", "Charger", prod, { stereotype: "Physical Component", note: "Synthetic charger assembly." });
  const canIf = obj("Class", "CAN Interface", prod, { stereotype: "Data Interface" });
  const sigCmd = obj("Signal", "Charge Current Command", prod, { stereotype: "Logical Signal" });
  const weird = obj("Class", "Mystery Thing", prod, { stereotype: "Totally Unmapped Stereotype" });
  // Usages owned by definitions
  obj("Part", "controller", prod, { parent: charger, pdata1: String(controller), mult: "1" });
  obj("Part", "modules", prod, { parent: charger, pdata1: String(pm), mult: "3" });
  obj("Part", "contactors", prod, { parent: charger, pdata1: String(contactor), mult: "2" });
  obj("Part", "mystery", prod, { parent: charger, pdata1: "999999" });            // unresolvable type
  obj("Port", "can", prod, { parent: controller, classifier: canIf });
  // Requirements
  const r1 = obj("Requirement", "UL 2594 5.1 Enclosure", reqs, { stereotype: "functionalRequirement", note: "Synthetic: the charger enclosure shall be rated for outdoor use.\n## not a heading\n```\nunbalanced fence" });
  const r2 = obj("Requirement", "Charge Current Accuracy", ipc, { stereotype: "performanceRequirement", note: "Synthetic: output current within 1 %." });
  obj("Requirement", "Nested Requirement", reqs, { stereotype: "requirement", parent: r1 });
  // Behavior
  const fn = obj("Activity", "Provide Charge Power", fns, { stereotype: "System Function" });
  obj("Action", "regulate", fns, { parent: fn });
  obj("Activity", "Verify Isolation", fns, { stereotype: "testCase" });
  const st = obj("State", "Charging", fns, { stereotype: "System State" });
  const uc = obj("UseCase", "Charge a Vehicle", ctx);
  obj("Actor", "Operator", ctx);
  const note = obj("Note", "Design remark", ctx, { note: "A free note about the charger." });
  obj("Constraint", "Max Temperature", prod, { note: "T < 60 C" });
  obj("Event", "Plug In", ctx);
  obj("Boundary", "System Boundary", ctx);
  obj("Artifact", "Datasheet", prod, { stereotype: "Document" });
  obj("Synchronization", "Fork", fns);
  obj("Class", "No Author Element", prod, { stereotype: "Hardware Component", author: "", created: null });
  obj("Class", "Old Tool Author", prod, { stereotype: "Hardware Component", author: "7.1.0-2" });
  // Colliding names and timestamps
  obj("Class", "Controller", power, { stereotype: "Hardware Component", created: stamp(201) });
  obj("Class", "Twin A", power, { stereotype: "Hardware Component", created: "2021-03-02 10:00:00" });
  obj("Class", "Twin B", power, { stereotype: "Hardware Component", created: "2021-03-02 10:00:00" });

  // Connectors
  con("Generalization", controller, module_);                                              // specific -> general
  con("Aggregation", charger, pm, { srcCard: "1", dstCard: "3", srcAgg: 2 });               // composite: Charger owns Power Module
  con("Aggregation", charger, fw, { srcAgg: 1, dstCard: "1" });
  con("Aggregation", pm, st, { srcAgg: 2 });                                                // wrong endpoint kinds -> review
  con("Dependency", fn, r2, { stereotype: "satisfy" });
  con("Dependency", fn, r1, { stereotype: "satisfy" });
  con("Realisation", charger, uc);
  con("NoteLink", note, charger);
  con("Association", uc, charger);
  con("Connector", controller, pm);
  con("Sequence", fn, uc);
  con("Telepathy", fn, uc);                                                                 // unknown family


  // Flows and relationships added for translation coverage
  const sigStatus = obj("Signal", "Charger Status", prod, { stereotype: "Logical Signal" });
  const gpi = obj("Class", "Charge Port Interface", prod, { stereotype: "Generic Physical Interface" });
  obj("Part", "currentCmd", prod, { parent: gpi, stereotype: "FlowProperty", classifier: sigCmd, tags: { direction: "in" } });
  obj("Part", "statusOut", prod, { parent: gpi, stereotype: "FlowProperty", classifier: sigStatus, tags: { direction: "out" } });
  obj("Part", "noDirection", prod, { parent: gpi, stereotype: "FlowProperty", classifier: sigStatus });
  obj("Part", "untypedFlow", prod, { parent: gpi, stereotype: "FlowProperty", tags: { direction: "inout" } });
  const portA = obj("Port", "ctrlIn", prod, { parent: controller, classifier: gpi });
  const portB = obj("Port", "ctrlOut", prod, { parent: controller, classifier: gpi });
  const portC = obj("Port", "pmPort", power, { parent: pm, classifier: gpi });
  con("Connector", portA, portB);                                                            // same owner -> connect
  con("Connector", portB, portC);                                                            // different owners -> review
  const a1 = obj("Action", "measure", fns, { parent: fn }), a2 = obj("Action", "adjust", fns, { parent: fn });
  con("ControlFlow", a1, a2, { name: "if ready" });
  con("ControlFlow", a1, st);                                                                 // not usages -> review
  const s1 = obj("StateNode", "Idle", fns, { parent: st }), s2 = obj("StateNode", "Running", fns, { parent: st });
  con("StateFlow", s1, s2, { name: "start" });
  const vt = obj("Activity", "Verify Enclosure", fns, { stereotype: "testCase" });
  con("Dependency", vt, r1, { stereotype: "verify" });
  con("Dependency", vt, r2, { stereotype: "verify" });
  con("Dependency", uc, r1, { stereotype: "verify" });                                        // wrong kinds -> review
  con("Abstraction", charger, controller, { stereotype: "allocate" });
  con("Realisation", charger, fn);                                                            // part -> action: perform
  con("Realisation", charger, r1);                                                            // part -> requirement: allocate
  con("Realisation", r2, r1, { stereotype: "deriveReqt" });
  con("Dependency", r1, r2, { stereotype: "trace" });
  con("Dependency", controller, pm);
  con("Dependency", r1, r2, { stereotype: "refine" });
  const uc2 = obj("UseCase", "Authenticate", ctx);
  con("UseCase", uc, uc2, { stereotype: "include" });
  con("UseCase", uc2, uc, { stereotype: "extend" });
  con("Aggregation", charger, controller, { srcAgg: 2, dstCard: "1" });                       // controller usage exists: usage wins

  // Control nodes, triggers, attachments
  const fk = obj("Synchronization", "Split", fns, { parent: fn });
  const a3 = obj("Action", "branch one", fns, { parent: fn }), a4 = obj("Action", "branch two", fns, { parent: fn });
  con("ControlFlow", a2, fk); con("ControlFlow", fk, a3); con("ControlFlow", fk, a4);
  obj("Synchronization", "Odd Node", fns, { parent: fn });                                    // no flows -> ambiguous
  obj("Trigger", "start button", fns, { parent: st });
  obj("Trigger", "loose trigger", fns);                                                       // no state owner -> review
  const pic = obj("Artifact", "Wiring Picture", prod, { stereotype: "Image" });
  db.prepare("INSERT INTO t_document (DocID,DocName,ElementID,ElementType,BinContent,DocType) VALUES (?,?,?,?,?,?)")
    .run("D1", "wiring.png", guid("O", pic), "Attachment", new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]), "PNG");

  // Scale: many extra requirements and parts for volume tests
  for (let i = 0; i < scale; i++) {
    const p = pkg(`Bulk ${i % 20}`, prod);
    const c = obj("Class", `Bulk Part ${i}`, p, { stereotype: "Hardware Component", created: stamp(1000 + (i % 50)) });
    obj("Part", `bulk${i}`, p, { parent: charger, pdata1: String(c), mult: String(1 + (i % 4)) });
    obj("Requirement", `Bulk Requirement ${i}`, reqs, { stereotype: "functionalRequirement", created: stamp(1000 + (i % 50)) });
    if (i % 3 === 0) con("Aggregation", charger, c, { srcAgg: 2, dstCard: "2" });
  }
  db.prepare("INSERT INTO t_diagram (Package_ID,Name,Diagram_Type,ea_guid) VALUES (?,?,?,?)").run(prod, "Overview", "Logical", guid("D", 1));
  db.exec("COMMIT");
  db.close();
  return { elements: ok, connectors: ck, packages: pk };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[2]; if (!out) { console.error("usage: make_qeax.mjs <out.qeax> [--scale N]"); process.exit(2); }
  const i = process.argv.indexOf("--scale");
  console.log(JSON.stringify(buildSyntheticQeax(out, { scale: i > 0 ? +process.argv[i + 1] : 0 })));
}
