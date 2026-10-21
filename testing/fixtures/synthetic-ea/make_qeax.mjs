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
  const G = (id) => guid("O", id);                                    // EA keeps the block a Part or Port points at as a GUID in PDATA1/2/3
  const obj = (type, name, packageId, o = {}) => {
    const id = ++ok;
    db.prepare(`INSERT INTO t_object (Object_ID,Object_Type,Name,Alias,Author,Note,Package_ID,Stereotype,CreatedDate,Classifier,ea_guid,ParentID,PDATA1,Multiplicity,Abstract,PDATA2,PDATA3)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, type, name, o.alias ?? null, o.author === undefined ? "Skelly, Spencer" : o.author, o.note ?? null,
      packageId, o.stereotype ?? null, o.created === undefined ? stamp(200 + id) : o.created, o.classifier ?? 0, guid("O", id), o.parent ?? 0, o.pdata1 ?? null, o.mult ?? null, o.abstract ?? null, o.pdata2 ?? null, o.pdata3 ?? null);
    for (const [k, v] of Object.entries(o.tags ?? {}))
      db.prepare("INSERT INTO t_objectproperties (Object_ID,Property,Value,ea_guid) VALUES (?,?,?,?)").run(id, k, v, guid("T", ++tk));
    return id;
  };
  const con = (type, src, dst, o = {}) => {
    const id = ++ck;
    db.prepare(`INSERT INTO t_connector (Connector_ID,Name,Direction,Notes,Connector_Type,SourceCard,DestCard,SourceIsAggregate,DestIsAggregate,Start_Object_ID,End_Object_ID,Stereotype,ea_guid,PDATA1,PDATA2,PDATA3,SourceRole,DestRole)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, o.name ?? null, o.direction ?? "Source -> Destination", o.notes ?? null, type, o.srcCard ?? null, o.dstCard ?? null,
      o.srcAgg ?? 0, o.dstAgg ?? 0, src, dst, o.stereotype ?? null, guid("C", id), o.p1 ?? null, o.p2 ?? null, o.p3 ?? null, o.srcRole ?? null, o.dstRole ?? null);
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
  const charger = obj("Class", "Charger", prod, { stereotype: "Physical Component", note: "Synthetic charger assembly.", tags: { Responsible: "unassigned", "Target-Trace": "<memo>", Brand: "Acme", "Zzz New Tag": "kept until decided" } });
  const canIf = obj("Class", "CAN Interface", prod, { stereotype: "Data Interface" });
  const sigCmd = obj("Signal", "Charge Current Command", prod, { stereotype: "Logical Signal" });
  const weird = obj("Class", "Mystery Thing", prod, { stereotype: "Totally Unmapped Stereotype" });
  // Usages owned by definitions
  const ctlUse = obj("Part", "controller", prod, { parent: charger, pdata1: G(controller), mult: "1", tags: { PN: "SYN-CTRL-1", "Piece Cost": "12.5", Status: "Approved" } });
  const pmUse = obj("Part", "modules", prod, { parent: charger, pdata1: G(pm), mult: "3" });
  obj("Part", "contactors", prod, { parent: charger, pdata1: G(contactor), mult: "2" });
  obj("Part", "", prod, { parent: charger, pdata1: G(contactor) });            // no name of its own: takes the type's name
  obj("Part", "mystery", prod, { parent: charger, pdata1: "{00000000-0000-0000-0000-000000999999}" });            // a block that is not in the export
  obj("Port", "can", prod, { parent: controller, pdata1: G(canIf) });
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
  const twinA = obj("Class", "Twin A", power, { stereotype: "Hardware Component", created: "2021-03-02 10:00:00" });
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
  obj("Part", "currentCmd", prod, { parent: gpi, stereotype: "FlowProperty", pdata1: G(sigCmd), tags: { direction: "in" } });
  obj("Part", "statusOut", prod, { parent: gpi, stereotype: "FlowProperty", pdata1: G(sigStatus), tags: { direction: "out" } });
  obj("Part", "noDirection", prod, { parent: gpi, stereotype: "FlowProperty", pdata1: G(sigStatus) });
  obj("Part", "untypedFlow", prod, { parent: gpi, stereotype: "FlowProperty", tags: { direction: "inout" } });
  const portA = obj("Port", "ctrlIn", prod, { parent: controller, pdata1: G(gpi) });
  const portB = obj("Port", "ctrlOut", prod, { parent: controller, pdata1: G(gpi) });
  const portC = obj("Port", "pmPort", power, { parent: pm, pdata1: G(gpi) });
  obj("Port", "auxIn", prod, { parent: controller, pdata1: G(gpi), mult: "0..2", tags: { isConjugated: "true" } });   // conjugated, counted port (D-0033)
  // Ports under Parts belong to the Part's block (V1 W-114): by PDATA3, by a unique same name, or added to the block
  const iIn = obj("Port", "ctrlIn", prod, { parent: ctlUse, pdata1: G(gpi), pdata3: G(portA) });
  const iOut = obj("Port", "ctrlOut", prod, { parent: ctlUse });
  obj("Port", "spare", prod, { parent: ctlUse, pdata1: G(canIf) });
  const iPm = obj("Port", "pmPort", power, { parent: pmUse, pdata3: G(portC) });
  con("Connector", iOut, iPm);                                                                // ports on two Parts of the Charger -> connect controller.ctrlOut to modules.pmPort
  con("Dependency", ctlUse, r2, { stereotype: "satisfy" });                                   // on the Part carrier: acts on its block
  con("Connector", portA, portB);                                                            // same owner -> connect
  con("Connector", portB, portC);                                                            // different owners -> review
  const fn2 = obj("Activity", "Monitor Output", fns, { stereotype: "System Function" });
  obj("Part", "", fns, { parent: fn, pdata1: G(fn2) });                                       // a Part inside a function that points at another function: an action used there
  obj("Object", "Module Unit 7", prod, { classifier: module_ });                          // an Object is a kind of its Class
  obj("Part", "numericRef", prod, { parent: twinA, pdata1: String(contactor) });            // a plain object id still resolves
  const a1 = obj("Action", "measure", fns, { parent: fn }), a2 = obj("Action", "adjust", fns, { parent: fn });
  con("ControlFlow", a1, a2, { name: "if ready", p2: "measurement ready */ and stable" });
  con("ControlFlow", a1, st);                                                                 // not usages -> review
  const s1 = obj("StateNode", "Idle", fns, { parent: st }), s2 = obj("StateNode", "Running", fns, { parent: st });
  con("StateFlow", s1, s2, { name: "start", p1: "Start button pressed", p2: "supply voltage ok", p3: "close contactor" });
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

  // Aggregation by kind, notes as link ends, flows between definitions, associations with use cases (IMP-113..118)
  const phase = obj("State", "Charging Phase", fns, { stereotype: "System State" });
  con("Aggregation", st, phase, { srcAgg: 1 });                                                // state in state
  con("Aggregation", uc, uc2, { srcAgg: 2 });                                                  // use case in use case
  con("Aggregation", sigStatus, sigCmd, { srcAgg: 2, dstCard: "2" });                          // signal in signal: item usage
  con("Aggregation", twinA, controller, { srcAgg: 2 }); con("Aggregation", controller, twinA, { srcAgg: 2 });   // a cycle: neither is written
  con("Aggregation", controller, gpi, { srcAgg: 2 });                                          // interface child of a part: port usage
  con("Aggregation", gpi, pm, { srcAgg: 2 });                                                  // part child of an interface: review (exception)
  const chA = obj("Change", "Change A", ctx), chB = obj("Change", "Change B", ctx);
  con("Aggregation", chA, chB, { srcAgg: 2 });                                                 // Change hierarchy: hasChild
  const issue = obj("Issue", "Loose Cable", ctx);
  con("Abstraction", issue, fn, { stereotype: "allocate" });                                  // note end: provisional tracesTo
  con("Usage", issue, charger);                                                               // note end: dependsOn
  con("Dependency", note, charger, { stereotype: "trace" });                                  // Info end: describes
  const pic2 = obj("Artifact", "Wiring Diagram", prod, { stereotype: "Image" });
  con("Dependency", pic2, charger, { stereotype: "trace" });                                  // Artifact end: describes
  con("Realisation", r2, pm);                                                                  // requirement drawn first: still allocate requirement to the part
  const pipe = obj("Activity", "Pipeline", fns, { stereotype: "System Function" });
  const stg1 = obj("Activity", "Stage One", fns, { stereotype: "System Function", parent: pipe }), stg2 = obj("Activity", "Stage Two", fns, { stereotype: "System Function", parent: pipe });
  con("ControlFlow", stg1, stg2, { name: "when done" });                                      // nested definitions: a succession in the owner
  const freeA = obj("Activity", "Free A", fns, { stereotype: "System Function" }), freeB = obj("Activity", "Free B", fns, { stereotype: "System Function" });
  con("Aggregation", pipe, freeB, { srcAgg: 2, dstCard: "1..2", dstRole: "second step" });     // activity in activity: action usage with role name and multiplicity
  con("Aggregation", pipe, freeB, { srcAgg: 2 });                                              // same ends again: a distinct usage (no merging by endpoints)
  con("ControlFlow", freeA, freeB, { p2: "go" });                                             // no shared owner: precedes
  const operator = obj("Actor", "Mechanic", ctx);
  con("Association", uc, operator); con("Association", operator, uc);                          // actor of the use case, once
  con("Association", uc2, pm);                                                                // participant

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
    obj("Part", `bulk${i}`, p, { parent: charger, pdata1: G(c), mult: String(1 + (i % 4)) });
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
