/* Flow definitions (D-0169). Converted on 2026-11-26 from the PLM flow prototype (claude.ai canvas, prototype v2):
 * the prototype's sample values became placeholders, its sample rows were dropped (template rows such as disciplines and
 * document kinds were kept) and its record pickers were replaced by the note selected in the Workbench.
 * Edit this file to change a flow's sections or fields. Field ids are stored in saved flow records, so do not rename one
 * that is already in use; add a new id instead. */
import type { FlowDef, FlowBlock } from "./flows.ts";

export const REASON_BLOCKS: FlowBlock[] = [
 {
  "t": "head",
  "title": "Driving reason",
  "codes": "Required for every flow",
  "who": "Whoever starts the flow.",
  "intro": "Every flow starts with why. The reason is kept with the evidence and carried into the ECO and the ECN."
 },
 {
  "t": "group",
  "label": "Critical to the flow",
  "crit": true,
  "caption": "Why this work is being done",
  "fields": [
   {
    "id": "rs.type",
    "label": "Reason type",
    "kind": "select",
    "v": "",
    "req": true,
    "opts": [
     "",
     "Requirement change",
     "Issue or defect",
     "Test result",
     "Customer or field feedback",
     "Supplier or sourcing",
     "Regulatory or compliance",
     "Obsolescence",
     "Process improvement",
     "Other"
    ]
   },
   {
    "id": "rs.stmt",
    "label": "Reason statement",
    "kind": "area",
    "v": "",
    "req": true,
    "ph": "In a sentence or two: what is driving this work?"
   },
   {
    "id": "rs.src",
    "label": "Source reference",
    "v": "",
    "ph": "[issue, requirement, redline or test ID]"
   }
  ]
 },
 {
  "t": "group",
  "label": "Supporting details",
  "fields": [
   {
    "id": "rs.eco",
    "label": "Part of ECO",
    "kind": "select",
    "v": "Add to an existing ECO",
    "opts": [
     "Add to an existing ECO",
     "Start a new ECO",
     "Standalone (no ECO)"
    ]
   },
   {
    "id": "rs.econo",
    "label": "ECO number",
    "v": "",
    "ph": "[ECO number]"
   },
   {
    "id": "rs.by",
    "label": "Raised by",
    "v": "",
    "ph": "[name]"
   }
  ]
 }
];

export const FLOW_DEFS: FlowDef[] = [
 {
  "id": "CHG",
  "name": "Change",
  "group": "Change",
  "pick": "Part or assembly",
  "copy": false,
  "wasLabel": "Was:",
  "files": [
   {
    "f": "Change request note",
    "a": "Create",
    "fmt": "Markdown with YAML",
    "loc": "Changes"
   },
   {
    "f": "ECO note",
    "a": "Edit",
    "fmt": "Markdown with YAML",
    "loc": "Changes"
   },
   {
    "f": "Part or assembly note",
    "a": "Edit",
    "fmt": "Markdown with YAML",
    "loc": "Objects"
   },
   {
    "f": "ECN draft",
    "a": "Create",
    "fmt": "Markdown, exports to PDF",
    "loc": "Notices"
   }
  ],
  "subtypeId": "p.sub",
  "typeId": "p.type",
  "blocks": [
   {
    "t": "head",
    "n": 1,
    "title": "Raise the request",
    "codes": "04.09.02 · 06.03",
    "who": "Any engineer raises it; Systems triages it.",
    "intro": "Start from the part. The tool fills in what it knows from the feedback log and the part record."
   },
   {
    "t": "group",
    "label": "Critical to the change",
    "crit": true,
    "fields": [
     {
      "id": "cr.part",
      "label": "Affected part or assembly",
      "v": "",
      "req": true,
      "ph": "[part number] [description]",
      "from": "@label"
     },
     {
      "id": "cr.rev",
      "label": "Revision affected",
      "v": "",
      "req": true,
      "ph": "B",
      "from": "revision"
     },
     {
      "id": "cr.problem",
      "label": "Problem statement",
      "kind": "area",
      "v": "",
      "req": true,
      "ph": "What is wrong, or what should change?"
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "cr.id",
      "label": "Change request ID",
      "kind": "read",
      "dyn": "flowId"
     },
     {
      "id": "cr.source",
      "label": "Source",
      "kind": "select",
      "v": "Field feedback",
      "opts": [
       "Field feedback",
       "Production feedback",
       "Design review",
       "Series maintenance",
       "Value engineering"
      ]
     }
    ]
   },
   {
    "t": "head",
    "n": 2,
    "title": "Scope the impact",
    "codes": "04.14",
    "who": "Systems Engineer, with each affected discipline.",
    "intro": "Computed from the architecture. You confirm what is in scope."
   },
   {
    "t": "table",
    "id": "imp",
    "title": "Where used",
    "note": "Parents of this part, computed from the architecture",
    "cols": [
     {
      "k": "pn",
      "label": "Parent part"
     },
     {
      "k": "desc",
      "label": "Description"
     },
     {
      "k": "rev",
      "label": "Rev"
     },
     {
      "k": "pl",
      "label": "Product line"
     },
     {
      "k": "roll",
      "label": "Rev roll needed"
     },
     {
      "k": "inc",
      "label": "In this change",
      "edit": true,
      "opts": [
       "Yes",
       "No"
      ]
     }
    ],
    "rows": [],
    "src": "whereUsed"
   },
   {
    "t": "group",
    "label": "Reach of the change",
    "crit": true,
    "fields": [
     {
      "id": "imp.pl",
      "label": "Product lines affected",
      "kind": "read",
      "dyn": "lines"
     },
     {
      "id": "imp.req",
      "label": "Linked requirements",
      "kind": "read",
      "dyn": "reqs"
     },
     {
      "id": "imp.eco",
      "label": "Open ECOs on this part",
      "kind": "read",
      "dyn": "openEco"
     }
    ]
   },
   {
    "t": "head",
    "n": 3,
    "title": "Create the ECO",
    "codes": "04.13.01",
    "who": "Change owner.",
    "intro": "Prefilled from the impact analysis. State the reason and confirm the scope."
   },
   {
    "t": "group",
    "label": "Critical to the change",
    "crit": true,
    "fields": [
     {
      "id": "eco.reason",
      "label": "Reason for change",
      "kind": "area",
      "v": "",
      "req": true,
      "ph": "Why is this change needed?"
     },
     {
      "id": "eco.fff",
      "label": "Affects form, fit or function",
      "kind": "select",
      "v": "Review needed",
      "opts": [
       "Yes",
       "No",
       "Review needed"
      ]
     },
     {
      "id": "eco.eff",
      "label": "Effectivity",
      "kind": "select",
      "v": "Next build",
      "opts": [
       "Next build",
       "From serial or lot",
       "On approval"
      ]
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "eco.no",
      "label": "ECO number",
      "kind": "read",
      "dyn": "ecoNo"
     },
     {
      "id": "eco.scope",
      "label": "Scope",
      "kind": "area",
      "v": "",
      "ph": "Revise [part number] from rev B to rev C. Roll the parents [part number], [part number] and [part number]."
     }
    ]
   },
   {
    "t": "table",
    "id": "appr",
    "title": "Approvers",
    "note": "One per affected discipline",
    "cols": [
     {
      "k": "d",
      "label": "Discipline"
     },
     {
      "k": "a",
      "label": "Approver",
      "edit": true
     },
     {
      "k": "n",
      "label": "Needed",
      "edit": true,
      "opts": [
       "Yes",
       "No"
      ]
     }
    ],
    "rows": [
     {
      "d": "Mechanical",
      "a": "",
      "n": "Yes"
     },
     {
      "d": "Electrical",
      "a": "",
      "n": "Yes"
     },
     {
      "d": "Embedded",
      "a": "",
      "n": "Yes"
     },
     {
      "d": "Validation",
      "a": "",
      "n": "Yes"
     },
     {
      "d": "Lead Engineer",
      "a": "",
      "n": "Yes"
     }
    ]
   },
   {
    "t": "head",
    "n": 4,
    "title": "Change the design",
    "codes": "04.01 · 04.02 · 04.03",
    "who": "Mechanical, Electrical and Embedded.",
    "intro": "The part record, then its BOM. The element type decides which groups appear. CAD files stay in PDM; this holds the link and rev only."
   },
   {
    "t": "group",
    "label": "Critical to the part",
    "crit": true,
    "caption": "Identity, element type, and what controls form, fit and function",
    "fields": [
     {
      "id": "p.pn",
      "label": "Part number",
      "kind": "read",
      "tag": "Locked",
      "dyn": "pn"
     },
     {
      "id": "p.cur",
      "label": "Current revision",
      "kind": "read",
      "tag": "Locked",
      "dyn": "rev"
     },
     {
      "id": "p.new",
      "label": "New revision",
      "v": "",
      "tag": "Proposed",
      "ph": "C"
     },
     {
      "id": "p.desc",
      "label": "Description",
      "v": "",
      "ph": "[description]",
      "from": "@description"
     },
     {
      "id": "p.sub",
      "label": "Element type (MDSE Object subtype)",
      "kind": "select",
      "v": "electrical",
      "opts": [
       "mechanical",
       "electrical",
       "circuit",
       "software",
       "firmware",
       "part"
      ],
      "hint": "Mechanical parts show Material, color and finish. Electrical, circuit, firmware and software show firmware fields.",
      "from": "subtype"
     },
     {
      "id": "p.model",
      "label": "MDSE element",
      "kind": "read",
      "dyn": "model"
     },
     {
      "id": "p.type",
      "label": "Part type",
      "kind": "select",
      "v": "Assembly",
      "opts": [
       "Part",
       "Assembly"
      ],
      "from": "@partType"
     },
     {
      "id": "p.life",
      "label": "Lifecycle state",
      "kind": "select",
      "v": "Released",
      "opts": [
       "In design",
       "Released",
       "Phase out",
       "Obsolete"
      ],
      "from": "@life"
     },
     {
      "id": "p.uom",
      "label": "Unit of measure",
      "kind": "select",
      "v": "Each",
      "opts": [
       "Each",
       "Meter",
       "Kilogram"
      ]
     }
    ]
   },
   {
    "t": "group",
    "show": "mech",
    "label": "Mechanical parts",
    "crit": true,
    "caption": "Chosen from lists. Material controls fit and function.",
    "fields": [
     {
      "id": "m.mat",
      "label": "Material",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Aluminum 6061",
       "Steel, mild",
       "Stainless steel 304",
       "ABS",
       "Polycarbonate",
       "Nylon 6/6",
       "Other (specify in notes)"
      ]
     },
     {
      "id": "m.fin",
      "label": "Finish",
      "kind": "select",
      "v": "",
      "opts": [
       "",
       "None",
       "As machined",
       "Anodized",
       "Powder coat",
       "Painted",
       "Plated",
       "Textured (molded)",
       "Other (specify in notes)"
      ]
     },
     {
      "id": "m.col",
      "label": "Color",
      "kind": "select",
      "v": "",
      "opts": [
       "",
       "Black",
       "White",
       "Gray",
       "Natural",
       "Safety yellow",
       "Other (specify in notes)"
      ]
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "p.mb",
      "label": "Make or buy",
      "kind": "select",
      "v": "Make",
      "opts": [
       "Make",
       "Buy"
      ],
      "from": "@makeBuy"
     },
     {
      "id": "p.mfr",
      "label": "Manufacturer",
      "v": "",
      "ph": "[manufacturer]",
      "from": "manufacturer1"
     },
     {
      "id": "p.mpn",
      "label": "Manufacturer part number",
      "v": "",
      "ph": "[MPN]",
      "from": "mfgPn1"
     },
     {
      "id": "p.alt",
      "label": "Approved alternates",
      "v": "",
      "ph": "None"
     },
     {
      "id": "p.link",
      "label": "Drawing or spec link",
      "v": "",
      "ph": "[PDM link]"
     },
     {
      "id": "p.drev",
      "label": "Drawing rev",
      "v": "",
      "ph": "B"
     },
     {
      "id": "p.cert",
      "label": "Certification impact",
      "kind": "select",
      "v": "Review needed",
      "opts": [
       "None",
       "Review needed",
       "Recertify"
      ]
     },
     {
      "id": "p.notes",
      "label": "Change notes",
      "kind": "area",
      "v": "",
      "ph": "What changed on the part itself?"
     }
    ]
   },
   {
    "t": "group",
    "show": "fw",
    "label": "Firmware (electrical and embedded parts)",
    "fields": [
     {
      "id": "fw.ver",
      "label": "Firmware version",
      "v": "",
      "ph": "1.4.2"
     },
     {
      "id": "fw.hw",
      "label": "Target hardware rev",
      "v": "",
      "ph": "B"
     },
     {
      "id": "fw.src",
      "label": "Source reference",
      "v": "",
      "ph": "[repository tag]"
     }
    ]
   },
   {
    "t": "table",
    "show": "asm",
    "id": "bom",
    "title": "BOM lines",
    "note": "Children of this assembly. Edit quantity, rev and reference designators.",
    "cols": [
     {
      "k": "f",
      "label": "Find"
     },
     {
      "k": "pn",
      "label": "Part number"
     },
     {
      "k": "d",
      "label": "Description"
     },
     {
      "k": "rev",
      "label": "Rev",
      "edit": true
     },
     {
      "k": "q",
      "label": "Qty",
      "edit": true
     },
     {
      "k": "u",
      "label": "UoM"
     },
     {
      "k": "rd",
      "label": "Ref des",
      "edit": true
     },
     {
      "k": "mb",
      "label": "Make/Buy",
      "edit": true,
      "opts": [
       "Make",
       "Buy"
      ]
     },
     {
      "k": "l",
      "label": "Lifecycle",
      "edit": true,
      "opts": [
       "In design",
       "Released",
       "Phase out",
       "Obsolete"
      ]
     }
    ],
    "rows": [],
    "src": "children"
   },
   {
    "t": "head",
    "n": 5,
    "title": "Verify the change",
    "codes": "04.08 · Verify",
    "who": "Validation Engineer.",
    "intro": "Tests are picked from the change set, so only impacted tests run, by design rev."
   },
   {
    "t": "group",
    "label": "Critical to verification",
    "crit": true,
    "fields": [
     {
      "id": "v.rev",
      "label": "Design rev under test",
      "v": "",
      "ph": "C"
     },
     {
      "id": "v.reg",
      "label": "Regression scope",
      "kind": "select",
      "v": "Targeted",
      "opts": [
       "Targeted",
       "Full"
      ]
     },
     {
      "id": "v.unt",
      "label": "Requirements with no linked test",
      "kind": "read",
      "v": "[N] in the change set"
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "v.plan",
      "label": "Test plan link",
      "v": "",
      "ph": "[link]"
     },
     {
      "id": "v.dut",
      "label": "DUT plan",
      "v": "",
      "ph": "[serial numbers]"
     },
     {
      "id": "v.pre",
      "label": "Pre-compliance needed",
      "kind": "select",
      "v": "Yes",
      "opts": [
       "Yes",
       "No"
      ]
     },
     {
      "id": "v.eq",
      "label": "Equipment list",
      "kind": "read",
      "v": "Derived from the procedures: [N] items"
     }
    ]
   },
   {
    "t": "table",
    "id": "tests",
    "title": "Tests to run",
    "note": "Chosen from the change set",
    "cols": [
     {
      "k": "t",
      "label": "Test",
      "edit": true
     },
     {
      "k": "m",
      "label": "Method",
      "edit": true
     },
     {
      "k": "q",
      "label": "Requirement",
      "edit": true
     },
     {
      "k": "w",
      "label": "Why it runs",
      "edit": true
     },
     {
      "k": "r",
      "label": "Run",
      "edit": true,
      "opts": [
       "Yes",
       "No"
      ]
     }
    ],
    "rows": []
   },
   {
    "t": "head",
    "n": 6,
    "title": "Check system and operations",
    "codes": "04.07 · 04.11",
    "who": "Systems Engineer and Manufacturing Engineer.",
    "intro": "Does the change still fit the system, and can it still be built?"
   },
   {
    "t": "table",
    "id": "compat",
    "title": "Hardware and firmware compatibility",
    "note": "Computed across product lines",
    "cols": [
     {
      "k": "h",
      "label": "Hardware rev",
      "edit": true
     },
     {
      "k": "f",
      "label": "Firmware",
      "edit": true
     },
     {
      "k": "p",
      "label": "Product line",
      "edit": true
     },
     {
      "k": "s",
      "label": "Status",
      "edit": true
     }
    ],
    "rows": []
   },
   {
    "t": "group",
    "label": "Critical to operations",
    "crit": true,
    "fields": [
     {
      "id": "o.sup",
      "label": "New supplier",
      "kind": "select",
      "v": "No",
      "opts": [
       "Yes",
       "No"
      ]
     },
     {
      "id": "o.ll",
      "label": "Long-lead item",
      "kind": "read",
      "v": "[from ERP lead times]"
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "o.line",
      "label": "New line or station impact",
      "kind": "select",
      "v": "No",
      "opts": [
       "Yes",
       "No"
      ]
     },
     {
      "id": "o.notes",
      "label": "Planning notes",
      "kind": "area",
      "v": "",
      "ph": "Anything manufacturing, logistics, quality or service must know"
     }
    ]
   },
   {
    "t": "head",
    "n": 7,
    "title": "ECA tasks and documents",
    "codes": "04.13.02 · 04.13.03",
    "who": "Change owner and each affected owner.",
    "intro": "One task per affected item. Files stay in PDM; record the link and rev."
   },
   {
    "t": "table",
    "id": "eca",
    "title": "ECA tasks",
    "note": "Generated from the affected items",
    "cols": [
     {
      "k": "i",
      "label": "Affected item",
      "edit": true
     },
     {
      "k": "a",
      "label": "Action",
      "edit": true
     },
     {
      "k": "o",
      "label": "Owner",
      "edit": true
     },
     {
      "k": "s",
      "label": "Status",
      "edit": true,
      "opts": [
       "Open",
       "In progress",
       "Done"
      ]
     }
    ],
    "rows": []
   },
   {
    "t": "table",
    "id": "docs",
    "title": "Documentation at the release rev",
    "note": "Links only; files stay in PDM",
    "cols": [
     {
      "k": "d",
      "label": "Document"
     },
     {
      "k": "l",
      "label": "Link in PDM",
      "edit": true
     },
     {
      "k": "r",
      "label": "Rev",
      "edit": true
     },
     {
      "k": "p",
      "label": "Present",
      "edit": true,
      "opts": [
       "Yes",
       "No"
      ]
     }
    ],
    "rows": [
     {
      "d": "Drawing or spec",
      "l": "",
      "r": "",
      "p": "No"
     },
     {
      "d": "Schematic",
      "l": "",
      "r": "",
      "p": "No"
     },
     {
      "d": "Firmware release notes",
      "l": "",
      "r": "",
      "p": "No"
     },
     {
      "d": "Test report",
      "l": "",
      "r": "",
      "p": "No"
     },
     {
      "d": "Review record",
      "l": "",
      "r": "",
      "p": "No"
     }
    ]
   },
   {
    "t": "head",
    "n": 8,
    "title": "Release and close the loop",
    "codes": "04.13.04 · 04.10.02 · 04.09.01",
    "who": "Lead Engineer approves.",
    "intro": "The tool shows what is ready. Approval and the release action stay with you."
   },
   {
    "t": "table",
    "id": "ready",
    "title": "Release readiness",
    "note": "Computed",
    "cols": [
     {
      "k": "c",
      "label": "Check"
     },
     {
      "k": "r",
      "label": "Result"
     }
    ],
    "rows": [
     {
      "c": "Child parts released",
      "r": ""
     },
     {
      "c": "Reviews closed",
      "r": ""
     },
     {
      "c": "Requirements linked to tests",
      "r": ""
     },
     {
      "c": "Parents flagged for a rev roll",
      "r": ""
     },
     {
      "c": "Shared parts aligned across product lines",
      "r": ""
     }
    ]
   },
   {
    "t": "table",
    "id": "csv",
    "title": "ERP CSV preview",
    "note": "Item, rev, BOM and change reference",
    "cols": [
     {
      "k": "i",
      "label": "Item",
      "edit": true
     },
     {
      "k": "r",
      "label": "Rev",
      "edit": true
     },
     {
      "k": "b",
      "label": "BOM lines changed",
      "edit": true
     },
     {
      "k": "c",
      "label": "Change reference",
      "edit": true
     }
    ],
    "rows": []
   },
   {
    "t": "group",
    "label": "Critical to release",
    "crit": true,
    "fields": [
     {
      "id": "rel.subs",
      "label": "Sections submitted",
      "kind": "read",
      "dyn": "subCount"
     },
     {
      "id": "rel.who",
      "label": "Approver",
      "v": "",
      "req": true,
      "ph": "[Lead Engineer]"
     },
     {
      "id": "rel.dec",
      "label": "Approval decision",
      "kind": "select",
      "v": "Pending",
      "opts": [
       "Pending",
       "Approved",
       "Rejected"
      ]
     },
     {
      "id": "rel.date",
      "label": "Release date",
      "v": "",
      "req": true,
      "ph": "[date]"
     }
    ]
   },
   {
    "t": "group",
    "label": "Close the loop",
    "fields": [
     {
      "id": "rel.drift",
      "label": "Model update list",
      "kind": "read",
      "v": "Drift between released CAD outputs and the model: [N] items"
     },
     {
      "id": "rel.fb",
      "label": "Feedback to close",
      "kind": "read",
      "v": "The change request closes on release"
     }
    ]
   }
  ]
 },
 {
  "id": "NEW",
  "name": "New part",
  "group": "Change",
  "pick": "Existing part or assembly to copy (optional)",
  "copy": true,
  "wasLabel": "Source value:",
  "files": [
   {
    "f": "New part or assembly note",
    "a": "Create",
    "fmt": "Markdown with YAML",
    "loc": "Objects"
   },
   {
    "f": "Source part note",
    "a": "Edit",
    "fmt": "Markdown with YAML (link to the new part only)",
    "loc": "Objects"
   },
   {
    "f": "Requirement and verification notes",
    "a": "Create",
    "fmt": "Markdown with YAML",
    "loc": "Requirements"
   },
   {
    "f": "Release checklist",
    "a": "Create",
    "fmt": "Markdown",
    "loc": "Releases"
   }
  ],
  "subtypeId": "n.sub",
  "typeId": "n.type",
  "blocks": [
   {
    "t": "head",
    "n": 1,
    "title": "Start from",
    "codes": "Reuse search",
    "who": "Any engineer.",
    "intro": "Begin blank, or select an existing part or assembly and modify it as the new part. Part number, revision and lifecycle always start fresh, and the source part is never changed."
   },
   {
    "t": "group",
    "label": "Starting point",
    "crit": true,
    "fields": [
     {
      "id": "start.mode",
      "label": "Start from",
      "kind": "select",
      "v": "Existing part or assembly",
      "opts": [
       "Blank part",
       "Existing part or assembly"
      ],
      "req": true,
      "hint": "Changing the starting point reloads the form from it."
     }
    ]
   },
   {
    "t": "group",
    "show": "copy",
    "label": "Source part",
    "crit": true,
    "caption": "The part you are copying from",
    "fields": [
     {
      "id": "start.rel",
      "label": "Relationship to the source",
      "kind": "select",
      "v": "Derived from",
      "opts": [
       "Derived from",
       "Variant of",
       "Replaces"
      ],
      "hint": "Derived from and Variant of keep a link and leave the source alone. Replaces starts a change on the source."
     },
     {
      "id": "s.rev",
      "label": "Source revision",
      "kind": "read",
      "dyn": "srcRev"
     },
     {
      "id": "s.type",
      "label": "Source element type",
      "kind": "read",
      "dyn": "srcType"
     },
     {
      "id": "s.used",
      "label": "Source where-used",
      "kind": "read",
      "dyn": "srcUsed"
     }
    ]
   },
   {
    "t": "group",
    "show": "copy",
    "label": "Carry over from the source",
    "caption": "Choose what to copy. You can edit everything after.",
    "fields": [
     {
      "id": "start.c.def",
      "label": "Part definition fields",
      "kind": "select",
      "v": "Yes",
      "opts": [
       "Yes",
       "No"
      ]
     },
     {
      "id": "start.c.bom",
      "label": "BOM lines",
      "kind": "select",
      "v": "Yes",
      "opts": [
       "Yes",
       "No"
      ]
     },
     {
      "id": "start.c.req",
      "label": "Requirement links",
      "kind": "select",
      "v": "Yes",
      "opts": [
       "Yes",
       "No"
      ]
     },
     {
      "id": "start.c.tests",
      "label": "Test links",
      "kind": "select",
      "v": "Yes",
      "opts": [
       "Yes",
       "No"
      ]
     },
     {
      "id": "start.c.docs",
      "label": "Document links",
      "kind": "select",
      "v": "Yes",
      "opts": [
       "Yes",
       "No"
      ]
     }
    ]
   },
   {
    "t": "head",
    "n": 2,
    "title": "Identify the part",
    "codes": "04.01.02 · 04.02.02 · 04.03.02",
    "who": "Part owner.",
    "intro": "Identity and element type first. The part number is reserved on save. The element type decides which groups appear."
   },
   {
    "t": "group",
    "label": "Critical to the part",
    "crit": true,
    "caption": "Identity, element type, and what controls form, fit and function",
    "fields": [
     {
      "id": "n.pn",
      "label": "New part number",
      "kind": "read",
      "tag": "Reserved on save",
      "dyn": "newPn"
     },
     {
      "id": "n.rev",
      "label": "Starting revision",
      "v": "A",
      "tag": "Proposed"
     },
     {
      "id": "n.desc",
      "label": "Description",
      "v": "",
      "req": true,
      "ph": "What is this part?",
      "from": "@description"
     },
     {
      "id": "n.sub",
      "label": "Element type (MDSE Object subtype)",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "mechanical",
       "electrical",
       "circuit",
       "software",
       "firmware",
       "part"
      ],
      "hint": "Mechanical parts show Material, color and finish. Electrical, circuit, firmware and software show firmware fields.",
      "from": "subtype"
     },
     {
      "id": "n.model",
      "label": "MDSE element",
      "kind": "read",
      "dyn": "model"
     },
     {
      "id": "n.type",
      "label": "Part type",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Part",
       "Assembly"
      ],
      "from": "@partType"
     },
     {
      "id": "n.life",
      "label": "Lifecycle state",
      "kind": "select",
      "v": "In design",
      "opts": [
       "In design",
       "Released",
       "Phase out",
       "Obsolete"
      ]
     },
     {
      "id": "n.uom",
      "label": "Unit of measure",
      "kind": "select",
      "v": "Each",
      "opts": [
       "Each",
       "Meter",
       "Kilogram"
      ]
     }
    ]
   },
   {
    "t": "group",
    "show": "mech",
    "label": "Mechanical parts",
    "crit": true,
    "caption": "Chosen from lists. Material controls fit and function.",
    "fields": [
     {
      "id": "m.mat",
      "label": "Material",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Aluminum 6061",
       "Steel, mild",
       "Stainless steel 304",
       "ABS",
       "Polycarbonate",
       "Nylon 6/6",
       "Other (specify in notes)"
      ]
     },
     {
      "id": "m.fin",
      "label": "Finish",
      "kind": "select",
      "v": "",
      "opts": [
       "",
       "None",
       "As machined",
       "Anodized",
       "Powder coat",
       "Painted",
       "Plated",
       "Textured (molded)",
       "Other (specify in notes)"
      ]
     },
     {
      "id": "m.col",
      "label": "Color",
      "kind": "select",
      "v": "",
      "opts": [
       "",
       "Black",
       "White",
       "Gray",
       "Natural",
       "Safety yellow",
       "Other (specify in notes)"
      ]
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "n.used",
      "label": "Product line",
      "kind": "select",
      "v": "",
      "opts": [
       "",
       "IPC",
       "GSE",
       "MHE",
       "BMID",
       "PD",
       "RV",
       "PT"
      ],
      "from": "businessLine",
      "hint": "The governed businessLine list; IPC when more than one line uses it (MOD-188)."
     },
     {
      "id": "n.mb",
      "label": "Make or buy",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Make",
       "Buy"
      ],
      "from": "@makeBuy"
     },
     {
      "id": "n.mfr",
      "label": "Manufacturer",
      "v": "",
      "from": "manufacturer1"
     },
     {
      "id": "n.mpn",
      "label": "Manufacturer part number",
      "v": "",
      "from": "mfgPn1"
     },
     {
      "id": "n.alt",
      "label": "Approved alternates",
      "v": ""
     },
     {
      "id": "n.cert",
      "label": "Certification impact",
      "kind": "select",
      "v": "None",
      "opts": [
       "None",
       "Review needed",
       "Recertify"
      ]
     },
     {
      "id": "n.notes",
      "label": "Notes",
      "kind": "area",
      "v": "",
      "ph": "Anything to record about this part, including other material, color or finish"
     }
    ]
   },
   {
    "t": "head",
    "n": 3,
    "title": "Requirements and concept",
    "codes": "04.01.01 · 04.01.02 · 04.01.03",
    "who": "Discipline lead.",
    "intro": "Link the part to the model: the function it delivers and the requirements it satisfies. Check for similar parts before creating a new one."
   },
   {
    "t": "group",
    "label": "Critical to the part",
    "crit": true,
    "fields": [
     {
      "id": "c.func",
      "label": "Function delivered (MDSE Function)",
      "v": "",
      "req": true,
      "ph": "[Function]"
     },
     {
      "id": "c.reuse",
      "label": "Similar parts in the registry",
      "kind": "read",
      "v": "[N] found. Review before creating a new part."
     },
     {
      "id": "c.concept",
      "label": "Concept summary",
      "kind": "area",
      "v": "",
      "req": true,
      "ph": "How does this part deliver the function?"
     },
     {
      "id": "c.rev",
      "label": "Concept review",
      "kind": "select",
      "v": "Pending",
      "opts": [
       "Pending",
       "Approved",
       "Rework"
      ]
     }
    ]
   },
   {
    "t": "table",
    "id": "req",
    "title": "Requirements this part satisfies",
    "note": "Type is the MDSE Requirement subtype; Verified by is the Verification subtype",
    "cols": [
     {
      "k": "r",
      "label": "Requirement",
      "edit": true
     },
     {
      "k": "t",
      "label": "Type",
      "edit": true,
      "opts": [
       "",
       "functional",
       "design",
       "standard",
       "stakeholder",
       "engineering"
      ]
     },
     {
      "k": "v",
      "label": "Verified by",
      "edit": true,
      "opts": [
       "",
       "test",
       "analysis",
       "inspection",
       "demonstration"
      ]
     }
    ],
    "rows": []
   },
   {
    "t": "head",
    "n": 4,
    "title": "Design the part",
    "codes": "04.01.04 · 04.02.04 · 04.03.04",
    "who": "Mechanical, Electrical and Embedded.",
    "intro": "Details by discipline. CAD files stay in PDM; this holds the link and rev only."
   },
   {
    "t": "group",
    "show": "fw",
    "label": "Firmware (electrical and embedded parts)",
    "fields": [
     {
      "id": "fw.ver",
      "label": "Firmware version",
      "v": ""
     },
     {
      "id": "fw.hw",
      "label": "Target hardware rev",
      "v": ""
     },
     {
      "id": "fw.src",
      "label": "Source reference",
      "v": ""
     }
    ]
   },
   {
    "t": "group",
    "label": "Design data",
    "fields": [
     {
      "id": "n.link",
      "label": "Drawing or spec link",
      "v": "",
      "ph": "[PDM link]"
     },
     {
      "id": "n.drev",
      "label": "Drawing rev",
      "v": ""
     },
     {
      "id": "n.dfmea",
      "label": "DFMEA reviewed",
      "kind": "select",
      "v": "No",
      "opts": [
       "Yes",
       "No"
      ]
     }
    ]
   },
   {
    "t": "table",
    "show": "asm",
    "id": "bom",
    "title": "BOM lines",
    "note": "Children of this assembly",
    "cols": [
     {
      "k": "f",
      "label": "Find",
      "edit": true
     },
     {
      "k": "pn",
      "label": "Part number",
      "edit": true
     },
     {
      "k": "d",
      "label": "Description",
      "edit": true
     },
     {
      "k": "rev",
      "label": "Rev",
      "edit": true
     },
     {
      "k": "q",
      "label": "Qty",
      "edit": true
     },
     {
      "k": "u",
      "label": "UoM",
      "edit": true
     },
     {
      "k": "rd",
      "label": "Ref des",
      "edit": true
     },
     {
      "k": "mb",
      "label": "Make/Buy",
      "edit": true,
      "opts": [
       "",
       "Make",
       "Buy"
      ]
     },
     {
      "k": "l",
      "label": "Lifecycle",
      "edit": true,
      "opts": [
       "In design",
       "Released",
       "Phase out",
       "Obsolete"
      ]
     }
    ],
    "rows": [],
    "src": "children"
   },
   {
    "t": "head",
    "n": 5,
    "title": "Verify the part",
    "codes": "04.08 · Verify",
    "who": "Validation Engineer.",
    "intro": "Plan how each requirement will be shown to be met."
   },
   {
    "t": "group",
    "label": "Critical to verification",
    "crit": true,
    "fields": [
     {
      "id": "v.rev",
      "label": "Design rev under test",
      "v": "",
      "ph": "A"
     },
     {
      "id": "v.unt",
      "label": "Requirements with no linked test",
      "kind": "read",
      "v": "[N] still to link"
     },
     {
      "id": "v.pre",
      "label": "Pre-compliance needed",
      "kind": "select",
      "v": "No",
      "opts": [
       "Yes",
       "No"
      ]
     },
     {
      "id": "v.dut",
      "label": "DUT plan",
      "v": "",
      "ph": "[serial numbers]"
     }
    ]
   },
   {
    "t": "table",
    "id": "tests",
    "title": "Tests to run",
    "note": "Method is the MDSE Verification subtype",
    "cols": [
     {
      "k": "t",
      "label": "Test",
      "edit": true
     },
     {
      "k": "m",
      "label": "Method",
      "edit": true,
      "opts": [
       "",
       "test",
       "analysis",
       "inspection",
       "demonstration"
      ]
     },
     {
      "k": "r",
      "label": "Run",
      "edit": true,
      "opts": [
       "Yes",
       "No"
      ]
     }
    ],
    "rows": []
   },
   {
    "t": "head",
    "n": 6,
    "title": "Check operations",
    "codes": "04.11",
    "who": "Manufacturing Engineer.",
    "intro": "Can it be sourced and built?"
   },
   {
    "t": "group",
    "label": "Critical to operations",
    "crit": true,
    "fields": [
     {
      "id": "o.sup",
      "label": "New supplier",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Yes",
       "No"
      ]
     },
     {
      "id": "o.ll",
      "label": "Long-lead item",
      "kind": "read",
      "v": "[from ERP lead times]"
     },
     {
      "id": "o.line",
      "label": "New line or station impact",
      "kind": "select",
      "v": "No",
      "opts": [
       "Yes",
       "No"
      ]
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "o.notes",
      "label": "Planning notes",
      "kind": "area",
      "v": "",
      "ph": "Anything manufacturing, logistics, quality or service must know"
     }
    ]
   },
   {
    "t": "head",
    "n": 7,
    "title": "Documents and release",
    "codes": "04.13.03 · 04.01.08 · 04.10.02",
    "who": "Lead Engineer approves.",
    "intro": "Links only; files stay in PDM. The tool shows what is ready. Approval and the release action stay with you."
   },
   {
    "t": "table",
    "id": "docs",
    "title": "Documentation at the release rev",
    "note": "Links only; files stay in PDM",
    "cols": [
     {
      "k": "d",
      "label": "Document"
     },
     {
      "k": "l",
      "label": "Link in PDM",
      "edit": true
     },
     {
      "k": "r",
      "label": "Rev",
      "edit": true
     },
     {
      "k": "p",
      "label": "Present",
      "edit": true,
      "opts": [
       "Yes",
       "No"
      ]
     }
    ],
    "rows": [
     {
      "d": "Drawing or spec",
      "l": "",
      "r": "",
      "p": "No"
     },
     {
      "d": "Schematic",
      "l": "",
      "r": "",
      "p": "No"
     },
     {
      "d": "Firmware release notes",
      "l": "",
      "r": "",
      "p": "No"
     },
     {
      "d": "Test report",
      "l": "",
      "r": "",
      "p": "No"
     },
     {
      "d": "Review record",
      "l": "",
      "r": "",
      "p": "No"
     }
    ]
   },
   {
    "t": "table",
    "id": "csv",
    "title": "ERP CSV preview",
    "note": "Item, rev, BOM and change reference",
    "cols": [
     {
      "k": "i",
      "label": "Item",
      "edit": true
     },
     {
      "k": "r",
      "label": "Rev",
      "edit": true
     },
     {
      "k": "b",
      "label": "BOM lines",
      "edit": true
     },
     {
      "k": "c",
      "label": "Change reference",
      "edit": true
     }
    ],
    "rows": []
   },
   {
    "t": "group",
    "label": "Critical to release",
    "crit": true,
    "fields": [
     {
      "id": "rel.subs",
      "label": "Sections submitted",
      "kind": "read",
      "dyn": "subCount"
     },
     {
      "id": "rel.who",
      "label": "Approver",
      "v": "",
      "req": true,
      "ph": "[Lead Engineer]"
     },
     {
      "id": "rel.dec",
      "label": "Approval decision",
      "kind": "select",
      "v": "Pending",
      "opts": [
       "Pending",
       "Approved",
       "Rejected"
      ]
     },
     {
      "id": "rel.date",
      "label": "Release date",
      "v": "",
      "req": true,
      "ph": "[date]"
     }
    ]
   }
  ]
 },
 {
  "id": "RDL",
  "name": "Redline",
  "group": "Change",
  "pick": "Drawing (Document note)",
  "copy": false,
  "wasLabel": "Was:",
  "files": [
   {
    "f": "Stamped redline copy",
    "a": "Create",
    "fmt": "PDF or PNG (uncontrolled)",
    "loc": "Redlines"
   },
   {
    "f": "Marked-up file",
    "a": "Edit",
    "fmt": "Inkling markup, PDF export",
    "loc": "Redlines"
   },
   {
    "f": "Deviation list",
    "a": "Edit",
    "fmt": "Markdown table",
    "loc": "Deviations"
   }
  ],
  "blocks": [
   {
    "t": "head",
    "n": 1,
    "title": "Identify the drawing",
    "codes": "Not in EA yet",
    "who": "Anyone who finds an issue on a drawing.",
    "intro": "Pick the drawing. The tool shows its current rev, its status and any redlines already open, so the same issue is not raised twice. Changing the drawing reloads the form."
   },
   {
    "t": "group",
    "label": "Critical to the redline",
    "crit": true,
    "caption": "Which drawing, at which rev, and why",
    "fields": [
     {
      "id": "r.rev",
      "label": "Drawing rev",
      "kind": "read",
      "dyn": "dRev",
      "tag": "Locked to this rev"
     },
     {
      "id": "r.status",
      "label": "Drawing status",
      "kind": "read",
      "dyn": "dStatus"
     },
     {
      "id": "r.reason",
      "label": "Reason for the redline",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Production issue",
       "Inspection finding",
       "Supplier question",
       "Assembly issue",
       "Design review",
       "Other"
      ]
     },
     {
      "id": "r.urg",
      "label": "Urgency",
      "kind": "select",
      "v": "Routine",
      "opts": [
       "Routine",
       "Before next build",
       "Stop build"
      ]
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "r.part",
      "label": "Part documented",
      "kind": "read",
      "dyn": "dPart"
     },
     {
      "id": "r.type",
      "label": "Drawing type",
      "kind": "read",
      "dyn": "dType"
     },
     {
      "id": "r.used",
      "label": "Where used",
      "kind": "read",
      "dyn": "dUsed"
     },
     {
      "id": "r.by",
      "label": "Raised by",
      "v": "",
      "ph": "[name]"
     }
    ]
   },
   {
    "t": "table",
    "id": "opendev",
    "title": "Redlines already open on this drawing",
    "note": "From the deviation list",
    "cols": [
     {
      "k": "id",
      "label": "Deviation",
      "edit": true
     },
     {
      "k": "item",
      "label": "Item",
      "edit": true
     },
     {
      "k": "applies",
      "label": "Applies to",
      "edit": true
     },
     {
      "k": "age",
      "label": "Age",
      "edit": true
     },
     {
      "k": "status",
      "label": "Status",
      "edit": true
     }
    ],
    "rows": []
   },
   {
    "t": "head",
    "n": 2,
    "title": "Make the markup copy",
    "codes": "Not in EA yet",
    "who": "Redline author.",
    "intro": "The tool exports a copy of the released drawing at its rev, stamped REDLINE and not controlled. Mark up the copy; the released drawing is never edited. The tool links the copy and the markup, and files stay in PDM."
   },
   {
    "t": "group",
    "label": "Critical to the markup",
    "crit": true,
    "fields": [
     {
      "id": "m.copy",
      "label": "Copy to mark up",
      "kind": "read",
      "dyn": "dCopy"
     },
     {
      "id": "m.tool",
      "label": "Markup tool",
      "kind": "select",
      "v": "Inkling",
      "req": true,
      "opts": [
       "Inkling",
       "Other markup tool"
      ]
     },
     {
      "id": "m.link",
      "label": "Marked-up file",
      "v": "",
      "req": true,
      "ph": "[link to the marked-up file]"
     },
     {
      "id": "m.sheets",
      "label": "Sheets marked",
      "v": "",
      "ph": "For example sheets 1 and 3"
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "m.fmt",
      "label": "Copy format",
      "kind": "select",
      "v": "PDF",
      "opts": [
       "PDF",
       "PNG"
      ]
     },
     {
      "id": "m.stamp",
      "label": "Stamp",
      "kind": "read",
      "v": "Drawing number, rev, redline ID and date"
     },
     {
      "id": "m.stale",
      "label": "If the drawing is revised first",
      "kind": "read",
      "v": "The redline is flagged for a re-check against the new rev"
     }
    ]
   },
   {
    "t": "head",
    "n": 3,
    "title": "Describe the deviations",
    "codes": "Not in EA yet",
    "who": "Redline author.",
    "intro": "One row per marked change. Each row becomes an entry on the deviation list."
   },
   {
    "t": "group",
    "label": "Critical to the deviation",
    "crit": true,
    "caption": "Scope and whether it touches form, fit or function",
    "fields": [
     {
      "id": "d.summary",
      "label": "Summary of the redline",
      "kind": "area",
      "v": "",
      "req": true,
      "ph": "What is being marked up, and why?"
     },
     {
      "id": "d.fff",
      "label": "Affects form, fit or function",
      "kind": "select",
      "v": "Review needed",
      "opts": [
       "No",
       "Yes",
       "Review needed"
      ]
     },
     {
      "id": "d.applies",
      "label": "Applies to",
      "kind": "select",
      "v": "This build or lot only",
      "opts": [
       "This build or lot only",
       "Until incorporated",
       "Until a date"
      ]
     },
     {
      "id": "d.eff",
      "label": "Lot, serial range or quantity",
      "v": "",
      "ph": "[lot or serial range]"
     }
    ]
   },
   {
    "t": "table",
    "id": "items",
    "title": "Deviation items",
    "note": "Type includes Material, Color and Finish for mechanical drawings",
    "cols": [
     {
      "k": "n",
      "label": "#",
      "edit": true
     },
     {
      "k": "zone",
      "label": "Sheet and zone",
      "edit": true
     },
     {
      "k": "type",
      "label": "Type",
      "edit": true,
      "opts": [
       "",
       "Dimension",
       "Tolerance",
       "Note",
       "Material",
       "Color",
       "Finish",
       "BOM or part number",
       "Title block",
       "Other"
      ]
     },
     {
      "k": "what",
      "label": "What changes",
      "edit": true
     },
     {
      "k": "from",
      "label": "From",
      "edit": true
     },
     {
      "k": "to",
      "label": "To",
      "edit": true
     }
    ],
    "rows": []
   },
   {
    "t": "head",
    "n": 4,
    "title": "Send it out",
    "codes": "Not in EA yet",
    "who": "Redline author; approver signs off.",
    "intro": "The marked-up copy goes out only after approval. The stamp keeps it from being mistaken for the released drawing."
   },
   {
    "t": "group",
    "label": "Critical to sending",
    "crit": true,
    "fields": [
     {
      "id": "s.appr",
      "label": "Approver",
      "v": "",
      "req": true,
      "ph": "[approver]"
     },
     {
      "id": "s.dec",
      "label": "Approval decision",
      "kind": "select",
      "v": "Pending",
      "opts": [
       "Pending",
       "Approved",
       "Rejected"
      ]
     },
     {
      "id": "s.to",
      "label": "Sent to",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Supplier",
       "Manufacturing",
       "Internal team"
      ]
     },
     {
      "id": "s.who",
      "label": "Recipient",
      "v": "",
      "ph": "[recipient]"
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "s.method",
      "label": "Method",
      "kind": "select",
      "v": "Email",
      "opts": [
       "Email",
       "Supplier portal",
       "Shared folder"
      ]
     },
     {
      "id": "s.date",
      "label": "Date sent",
      "v": "",
      "ph": "[date sent]"
     },
     {
      "id": "s.status",
      "label": "Sent status",
      "kind": "read",
      "v": "Not sent yet"
     }
    ]
   },
   {
    "t": "head",
    "n": 5,
    "title": "Add to the deviation list",
    "codes": "Not in EA yet",
    "who": "The tool creates the entries; the owner sees them through.",
    "intro": "Each marked change becomes an open entry on the deviation list. It stays open until the team decides to incorporate or cancel it."
   },
   {
    "t": "table",
    "id": "entries",
    "title": "Entries created",
    "note": "Computed from sections 1 to 3",
    "cols": [
     {
      "k": "id",
      "label": "Deviation",
      "edit": true
     },
     {
      "k": "dwg",
      "label": "Drawing and rev",
      "edit": true
     },
     {
      "k": "items",
      "label": "Items",
      "edit": true
     },
     {
      "k": "applies",
      "label": "Applies to",
      "edit": true
     },
     {
      "k": "status",
      "label": "Status",
      "edit": true
     }
    ],
    "rows": []
   },
   {
    "t": "group",
    "label": "Critical to follow-up",
    "crit": true,
    "fields": [
     {
      "id": "l.owner",
      "label": "Owner",
      "v": "",
      "req": true,
      "ph": "[who sees it through]"
     },
     {
      "id": "l.review",
      "label": "Review by",
      "v": "",
      "req": true,
      "ph": "[date]"
     },
     {
      "id": "l.plan",
      "label": "Planned disposition",
      "kind": "select",
      "v": "Undecided",
      "opts": [
       "Undecided",
       "Incorporate (start a change)",
       "Cancel"
      ]
     },
     {
      "id": "l.eco",
      "label": "Linked change",
      "kind": "read",
      "v": "None yet"
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "l.notify",
      "label": "Notify the team",
      "kind": "select",
      "v": "Yes",
      "opts": [
       "Yes",
       "No"
      ]
     }
    ]
   },
   {
    "t": "head",
    "n": 6,
    "title": "Incorporate or cancel",
    "codes": "Not in EA yet",
    "who": "The team, at the deviation review. This section is done later.",
    "intro": "Incorporated items start a change with the drawing and rev prefilled. Cancelled items close with a reason."
   },
   {
    "t": "table",
    "id": "decide",
    "title": "Decisions",
    "note": "One per deviation item",
    "cols": [
     {
      "k": "d",
      "label": "Deviation item",
      "edit": true
     },
     {
      "k": "dec",
      "label": "Decision",
      "edit": true,
      "opts": [
       "Undecided",
       "Incorporate",
       "Cancel",
       "Keep open"
      ]
     },
     {
      "k": "why",
      "label": "Reason or linked change",
      "edit": true
     },
     {
      "k": "by",
      "label": "Decided by",
      "edit": true
     }
    ],
    "rows": []
   },
   {
    "t": "group",
    "label": "Critical to the decision",
    "crit": true,
    "fields": [
     {
      "id": "x.subs",
      "label": "Sections submitted",
      "kind": "read",
      "dyn": "subCount"
     },
     {
      "id": "x.who",
      "label": "Reviewer",
      "v": "",
      "req": true,
      "ph": "[reviewer]"
     },
     {
      "id": "x.date",
      "label": "Review date",
      "v": "",
      "req": true,
      "ph": "[review date]"
     },
     {
      "id": "x.next",
      "label": "What happens next",
      "kind": "read",
      "v": "Incorporated items open a change from the change form"
     }
    ]
   }
  ]
 },
 {
  "id": "ISS",
  "name": "Issue",
  "group": "Change",
  "pick": "Element the issue is on",
  "copy": false,
  "wasLabel": "Was:",
  "files": [
   {
    "f": "Issue note",
    "a": "Create",
    "fmt": "Markdown with YAML (MDSE Issue)",
    "loc": "Issues"
   },
   {
    "f": "Related element note",
    "a": "Edit",
    "fmt": "Markdown with YAML (adds a link to the issue)",
    "loc": "Objects"
   },
   {
    "f": "Evidence attachments",
    "a": "Create",
    "fmt": "Pictures, logs, PDF",
    "loc": "Issues/attachments"
   }
  ],
  "blocks": [
   {
    "t": "head",
    "title": "Identify the element",
    "codes": "Issue",
    "who": "Anyone who finds a problem.",
    "intro": "Pick the element the issue is about: a part, a requirement, firmware, a test. The tool shows its class and rev, and the issues already open against it, so the same issue is not logged twice. Changing the element reloads the form."
   },
   {
    "t": "group",
    "label": "Critical to the issue",
    "crit": true,
    "caption": "What element, at which rev, found where",
    "fields": [
     {
      "id": "i.cls",
      "label": "Element class",
      "kind": "read",
      "dyn": "cls"
     },
     {
      "id": "i.rev",
      "label": "Element rev",
      "kind": "read",
      "dyn": "rev",
      "tag": "Locked to this rev"
     },
     {
      "id": "i.where",
      "label": "Where it was found",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Design review",
       "Test",
       "Production",
       "Field",
       "Supplier"
      ]
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "i.owner",
      "label": "Element owner",
      "kind": "read",
      "dyn": "owner"
     },
     {
      "id": "i.used",
      "label": "Where used",
      "kind": "read",
      "dyn": "used"
     }
    ]
   },
   {
    "t": "table",
    "id": "open",
    "title": "Issues already open on this element",
    "note": "From the issue list",
    "cols": [
     {
      "k": "id",
      "label": "Issue"
     },
     {
      "k": "title",
      "label": "Title"
     },
     {
      "k": "sev",
      "label": "Severity"
     },
     {
      "k": "status",
      "label": "Status"
     }
    ],
    "rows": [],
    "src": "issues"
   },
   {
    "t": "head",
    "title": "Describe the issue",
    "codes": "Issue",
    "who": "Whoever found it.",
    "intro": "What is wrong, how bad it is, and what it puts at risk. Add the pictures or logs that show it."
   },
   {
    "t": "group",
    "label": "Critical to the issue",
    "crit": true,
    "caption": "Enough for someone else to find it again",
    "fields": [
     {
      "id": "d.title",
      "label": "Issue title",
      "v": "",
      "req": true,
      "ph": "One line"
     },
     {
      "id": "d.sev",
      "label": "Severity",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Critical",
       "Major",
       "Minor"
      ]
     },
     {
      "id": "d.risk",
      "label": "Lifecycle risk",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Safety",
       "Compliance",
       "Quality",
       "Reliability",
       "Schedule",
       "Supportability"
      ]
     },
     {
      "id": "d.desc",
      "label": "Description",
      "kind": "area",
      "v": "",
      "req": true,
      "ph": "What happens, and what was expected?"
     },
     {
      "id": "d.steps",
      "label": "How to reproduce",
      "kind": "area",
      "v": "",
      "ph": "Steps, setup, firmware and hardware versions"
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "d.build",
      "label": "Found in build or lot",
      "v": "",
      "ph": "[build or lot]"
     },
     {
      "id": "d.link",
      "label": "Evidence file or link",
      "v": "",
      "ph": "[picture, log or report]"
     },
     {
      "id": "d.by",
      "label": "Found by",
      "v": "",
      "ph": "[name]"
     }
    ]
   },
   {
    "t": "head",
    "title": "Resolution",
    "codes": "Issue",
    "who": "Element owner, with Systems if form, fit or function is touched.",
    "intro": "Record what will be done about it. A resolution that needs work starts the flows listed below, so the work is linked back to this issue."
   },
   {
    "t": "group",
    "label": "Critical to the resolution",
    "crit": true,
    "fields": [
     {
      "id": "r.type",
      "label": "Resolution",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Fix the design",
       "Workaround",
       "Accept as is",
       "Defer",
       "Not an issue"
      ]
     },
     {
      "id": "r.desc",
      "label": "What will be done",
      "kind": "area",
      "v": "",
      "req": true,
      "ph": "The resolution in plain words"
     },
     {
      "id": "r.owner",
      "label": "Resolution owner",
      "v": "",
      "req": true,
      "ph": "[name]"
     },
     {
      "id": "r.due",
      "label": "Target date",
      "v": "",
      "ph": "[date]"
     },
     {
      "id": "r.ver",
      "label": "Needs verification",
      "kind": "select",
      "v": "Yes",
      "opts": [
       "Yes",
       "No"
      ]
     }
    ]
   },
   {
    "t": "table",
    "id": "follow",
    "title": "Flows this resolution starts",
    "note": "Each one gets its own flow ID",
    "cols": [
     {
      "k": "flow",
      "label": "Flow"
     },
     {
      "k": "need",
      "label": "Needed",
      "edit": true,
      "opts": [
       "Yes",
       "No"
      ]
     },
     {
      "k": "id",
      "label": "Flow ID"
     },
     {
      "k": "why",
      "label": "Why"
     }
    ],
    "rows": [
     {
      "flow": "Change",
      "need": "No",
      "id": "[assigned on start]",
      "why": "A released part or document changes"
     },
     {
      "flow": "Redline",
      "need": "No",
      "id": "[assigned on start]",
      "why": "A drawing needs a marked-up fix now"
     },
     {
      "flow": "Firmware",
      "need": "No",
      "id": "[assigned on start]",
      "why": "Firmware properties change"
     },
     {
      "flow": "Test plan",
      "need": "No",
      "id": "[assigned on start]",
      "why": "The fix needs verifying"
     },
     {
      "flow": "Specify",
      "need": "No",
      "id": "[assigned on start]",
      "why": "A requirement was missing or unclear"
     }
    ]
   },
   {
    "t": "head",
    "title": "Status and close",
    "codes": "Issue",
    "who": "Issue owner.",
    "intro": "The issue closes when its resolution is done and verified. Closing is a person action; the tool records it."
   },
   {
    "t": "group",
    "label": "Critical to closing",
    "crit": true,
    "fields": [
     {
      "id": "c.status",
      "label": "Issue status",
      "kind": "select",
      "v": "Open",
      "opts": [
       "Open",
       "Resolved",
       "Verified",
       "Closed"
      ]
     },
     {
      "id": "c.rev",
      "label": "Resolved in rev",
      "v": "",
      "ph": "[rev]"
     },
     {
      "id": "c.ver",
      "label": "Verified by",
      "v": "",
      "ph": "[test report ID or name]"
     },
     {
      "id": "c.date",
      "label": "Closed on",
      "v": "",
      "ph": "[date]"
     }
    ]
   }
  ]
 },
 {
  "id": "REV",
  "name": "Review and approve",
  "group": "Change",
  "pick": "ECO note",
  "copy": false,
  "wasLabel": "Was:",
  "files": [
   {
    "f": "Approval record",
    "a": "Create",
    "fmt": "Markdown with YAML",
    "loc": "Approvals"
   },
   {
    "f": "ECO note",
    "a": "Edit",
    "fmt": "Markdown with YAML (adds the decision)",
    "loc": "Changes"
   },
   {
    "f": "Review comments",
    "a": "Create",
    "fmt": "Markdown",
    "loc": "Approvals"
   }
  ],
  "blocks": [
   {
    "t": "head",
    "title": "Select the effort",
    "codes": "Review",
    "who": "Approvers and change owners.",
    "intro": "One place to find an ongoing effort. Pick an ECO and the tool lists the flows inside it, with each flow’s ID and how many sections are submitted. Changing the effort reloads the form."
   },
   {
    "t": "group",
    "label": "Critical to the review",
    "crit": true,
    "caption": "What is being approved, and why",
    "fields": [
     {
      "id": "e.reason",
      "label": "Driving reason",
      "kind": "read",
      "dyn": "reason"
     },
     {
      "id": "e.phase",
      "label": "Phase",
      "kind": "read",
      "dyn": "phase"
     },
     {
      "id": "e.flows",
      "label": "Flows",
      "kind": "read",
      "dyn": "flows"
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "e.title",
      "label": "Title",
      "kind": "read",
      "dyn": "title"
     },
     {
      "id": "e.owner",
      "label": "Change owner",
      "kind": "read",
      "dyn": "owner"
     },
     {
      "id": "e.opened",
      "label": "Opened",
      "kind": "read",
      "dyn": "opened"
     }
    ]
   },
   {
    "t": "table",
    "id": "flows",
    "title": "Flows in this effort",
    "note": "Open any flow by its flow ID or GUID",
    "cols": [
     {
      "k": "type",
      "label": "Flow"
     },
     {
      "k": "id",
      "label": "Flow ID"
     },
     {
      "k": "status",
      "label": "Status"
     },
     {
      "k": "subs",
      "label": "Sections submitted"
     }
    ],
    "rows": [],
    "src": "ecoFlows"
   },
   {
    "t": "head",
    "title": "Review the details",
    "codes": "Review",
    "who": "Each approver, for their function.",
    "intro": "What changed, and what is still open. Open items are work not yet submitted in a flow; they are the reason to hold an approval."
   },
   {
    "t": "table",
    "id": "changes",
    "title": "What changed",
    "note": "From the submitted sections",
    "cols": [
     {
      "k": "item",
      "label": "Item",
      "edit": true
     },
     {
      "k": "from",
      "label": "From",
      "edit": true
     },
     {
      "k": "to",
      "label": "To",
      "edit": true
     },
     {
      "k": "what",
      "label": "Change",
      "edit": true
     }
    ],
    "rows": []
   },
   {
    "t": "table",
    "id": "open",
    "title": "Still open in the flows",
    "note": "Not yet submitted",
    "cols": [
     {
      "k": "what",
      "label": "Open item",
      "edit": true
     },
     {
      "k": "who",
      "label": "Owner",
      "edit": true
     }
    ],
    "rows": []
   },
   {
    "t": "group",
    "label": "Critical to the review",
    "crit": true,
    "fields": [
     {
      "id": "v.read",
      "label": "I reviewed the evidence",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Yes",
       "Partly",
       "No"
      ]
     },
     {
      "id": "v.role",
      "label": "Reviewing as",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Mechanical",
       "Electrical",
       "Systems",
       "Validation",
       "Software",
       "Product",
       "Manufacturing"
      ]
     }
    ]
   },
   {
    "t": "head",
    "title": "Approve",
    "codes": "Review",
    "who": "Each function named on the ECO.",
    "intro": "Each function records its own decision. People decide; the tool records who, what and when, and saves it as evidence."
   },
   {
    "t": "table",
    "id": "appr",
    "title": "Approvals by function",
    "note": "Change the decision for your function",
    "cols": [
     {
      "k": "fn",
      "label": "Function"
     },
     {
      "k": "who",
      "label": "Approver",
      "edit": true
     },
     {
      "k": "dec",
      "label": "Decision",
      "edit": true,
      "opts": [
       "Pending",
       "Approve",
       "Approve with comments",
       "Reject"
      ]
     },
     {
      "k": "note",
      "label": "Comment",
      "edit": true
     }
    ],
    "rows": [
     {
      "fn": "Mechanical",
      "who": "",
      "dec": "Pending",
      "note": ""
     },
     {
      "fn": "Electrical",
      "who": "",
      "dec": "Pending",
      "note": ""
     },
     {
      "fn": "Systems",
      "who": "",
      "dec": "Pending",
      "note": ""
     },
     {
      "fn": "Validation",
      "who": "",
      "dec": "Pending",
      "note": ""
     },
     {
      "fn": "Software",
      "who": "",
      "dec": "Pending",
      "note": ""
     },
     {
      "fn": "Product",
      "who": "",
      "dec": "Pending",
      "note": ""
     }
    ]
   },
   {
    "t": "group",
    "label": "Critical to the decision",
    "crit": true,
    "fields": [
     {
      "id": "a.final",
      "label": "Overall decision",
      "kind": "select",
      "v": "Pending",
      "opts": [
       "Pending",
       "Approve",
       "Approve with comments",
       "Reject"
      ]
     },
     {
      "id": "a.cond",
      "label": "Conditions or comments",
      "kind": "area",
      "v": "",
      "ph": "Anything that must be done before release"
     },
     {
      "id": "a.date",
      "label": "Decision date",
      "v": "",
      "ph": "[date]"
     }
    ]
   }
  ]
 },
 {
  "id": "OPT",
  "name": "Options and alternates",
  "group": "Change",
  "pick": "Part or assembly",
  "copy": false,
  "wasLabel": "Was:",
  "files": [
   {
    "f": "Options and alternates note",
    "a": "Create",
    "fmt": "Markdown with YAML",
    "loc": "Options"
   },
   {
    "f": "Current part note",
    "a": "Edit",
    "fmt": "Markdown with YAML (adds approved alternates)",
    "loc": "Objects"
   },
   {
    "f": "Comparison table",
    "a": "Create",
    "fmt": "CSV and Markdown",
    "loc": "Options"
   }
  ],
  "blocks": [
   {
    "t": "head",
    "title": "What needs a substitute",
    "codes": "Options",
    "who": "Whoever needs another part or assembly.",
    "intro": "Pick the part or assembly in question. The tool lists where it is used and the requirements any substitute must meet, so candidates are judged against the same list. Changing the part reloads the form."
   },
   {
    "t": "group",
    "label": "Critical to the selection",
    "crit": true,
    "caption": "What is being replaced, and what is true of it today",
    "fields": [
     {
      "id": "o.cls",
      "label": "Element",
      "kind": "read",
      "dyn": "cls"
     },
     {
      "id": "o.life",
      "label": "Lifecycle",
      "kind": "read",
      "dyn": "life"
     },
     {
      "id": "o.used",
      "label": "Where used",
      "kind": "read",
      "dyn": "used"
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "o.alts",
      "label": "Alternates on record",
      "kind": "read",
      "dyn": "alts"
     },
     {
      "id": "o.scope",
      "label": "Substitute applies to",
      "kind": "select",
      "v": "All uses",
      "opts": [
       "All uses",
       "One assembly only",
       "One build or lot only"
      ]
     }
    ]
   },
   {
    "t": "table",
    "id": "reqs",
    "title": "Requirements a substitute must meet",
    "note": "Traced from the part’s requirements",
    "cols": [
     {
      "k": "id",
      "label": "Requirement"
     },
     {
      "k": "req",
      "label": "Requirement text"
     },
     {
      "k": "val",
      "label": "Needed value"
     },
     {
      "k": "src",
      "label": "Subtype"
     }
    ],
    "rows": [],
    "src": "requirements"
   },
   {
    "t": "head",
    "title": "Candidates and specs",
    "codes": "Options",
    "who": "Engineer proposing the substitute.",
    "intro": "List each candidate and compare its specs with what is needed and with the current part."
   },
   {
    "t": "table",
    "id": "cand",
    "title": "Candidates",
    "note": "A candidate can be a part or an assembly",
    "cols": [
     {
      "k": "name",
      "label": "Candidate",
      "edit": true
     },
     {
      "k": "type",
      "label": "Type",
      "edit": true,
      "opts": [
       "",
       "Part",
       "Assembly"
      ]
     },
     {
      "k": "meets",
      "label": "Meets requirements",
      "edit": true,
      "opts": [
       "",
       "Yes",
       "Partly",
       "No"
      ]
     },
     {
      "k": "fff",
      "label": "Same form, fit, function",
      "edit": true,
      "opts": [
       "",
       "Yes",
       "Partly",
       "No"
      ]
     },
     {
      "k": "note",
      "label": "Notes",
      "edit": true
     }
    ],
    "rows": []
   },
   {
    "t": "table",
    "id": "specs",
    "title": "Spec comparison",
    "note": "Candidate A and B are the first two rows above",
    "cols": [
     {
      "k": "spec",
      "label": "Spec",
      "edit": true
     },
     {
      "k": "need",
      "label": "Needed",
      "edit": true
     },
     {
      "k": "cur",
      "label": "Current part",
      "edit": true
     },
     {
      "k": "a",
      "label": "Candidate A",
      "edit": true
     },
     {
      "k": "b",
      "label": "Candidate B",
      "edit": true
     }
    ],
    "rows": []
   },
   {
    "t": "head",
    "title": "Select",
    "codes": "Options",
    "who": "Engineer; approver signs off in Review and approve.",
    "intro": "Choose one candidate and say why. The choice is recorded as an approved alternate and can start a Change or New part flow."
   },
   {
    "t": "group",
    "label": "Critical to the selection",
    "crit": true,
    "fields": [
     {
      "id": "s.pick",
      "label": "Selected",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Keep the current part"
      ],
      "optsFrom": "cand:name"
     },
     {
      "id": "s.why",
      "label": "Why this one",
      "kind": "area",
      "v": "",
      "req": true,
      "ph": "What decided it?"
     },
     {
      "id": "s.alt",
      "label": "Record as approved alternate",
      "kind": "select",
      "v": "Yes",
      "opts": [
       "Yes",
       "No"
      ]
     },
     {
      "id": "s.next",
      "label": "Starts",
      "kind": "select",
      "v": "Change flow",
      "opts": [
       "Change flow",
       "New part flow",
       "Nothing yet"
      ]
     }
    ]
   }
  ]
 },
 {
  "id": "SPC",
  "name": "Specify",
  "group": "Define",
  "pick": "Function or element",
  "copy": false,
  "wasLabel": "Current:",
  "files": [
   {
    "f": "Function note",
    "a": "Edit",
    "fmt": "Markdown with YAML (MDSE Function)",
    "loc": "Functions"
   },
   {
    "f": "Design note",
    "a": "Edit",
    "fmt": "Markdown with YAML (MDSE Design)",
    "loc": "Designs"
   },
   {
    "f": "Requirement notes",
    "a": "Create",
    "fmt": "One note per requirement (MDSE Requirement)",
    "loc": "Requirements"
   },
   {
    "f": "Trace canvas",
    "a": "Create",
    "fmt": "Obsidian canvas",
    "loc": "Requirements"
   }
  ],
  "blocks": [
   {
    "t": "head",
    "title": "Choose what to specify",
    "codes": "Specify",
    "who": "Systems Engineer, with the owning function.",
    "intro": "Pick a function or element. The tool shows how well it is defined today: its requirements, designs and the gaps it can see. Changing the element reloads the form."
   },
   {
    "t": "group",
    "label": "Critical to the specification",
    "crit": true,
    "caption": "What is being defined, and what is missing",
    "fields": [
     {
      "id": "s.cls",
      "label": "Class",
      "kind": "read",
      "dyn": "cls"
     },
     {
      "id": "s.reqs",
      "label": "Requirements today",
      "kind": "read",
      "dyn": "reqs"
     },
     {
      "id": "s.gaps",
      "label": "Gaps found",
      "kind": "read",
      "dyn": "gaps"
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "s.parent",
      "label": "Parent",
      "kind": "read",
      "dyn": "parent"
     },
     {
      "id": "s.des",
      "label": "Design today",
      "kind": "read",
      "dyn": "designs"
     }
    ]
   },
   {
    "t": "head",
    "title": "Define the function",
    "codes": "Specify",
    "who": "Systems Engineer.",
    "intro": "What the function does, in one testable statement, with its inputs, outputs, trigger and performance. A statement with no performance value is the most common gap."
   },
   {
    "t": "group",
    "label": "Critical to the function",
    "crit": true,
    "fields": [
     {
      "id": "f.name",
      "label": "Function name",
      "v": "",
      "req": true
     },
     {
      "id": "f.stmt",
      "label": "Statement",
      "kind": "area",
      "v": "",
      "req": true,
      "ph": "The system shall…"
     },
     {
      "id": "f.perf",
      "label": "Performance (value and unit)",
      "v": "",
      "req": true,
      "ph": "For example, within 2 s"
     },
     {
      "id": "f.trig",
      "label": "Trigger or mode",
      "v": ""
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "f.in",
      "label": "Inputs",
      "v": ""
     },
     {
      "id": "f.out",
      "label": "Outputs",
      "v": ""
     }
    ]
   },
   {
    "t": "head",
    "title": "Define the design",
    "codes": "Specify",
    "who": "The owning function.",
    "intro": "How the design satisfies the function, and what it connects to."
   },
   {
    "t": "group",
    "label": "Critical to the design",
    "crit": true,
    "fields": [
     {
      "id": "d.name",
      "label": "Design name",
      "v": "",
      "req": true
     },
     {
      "id": "d.how",
      "label": "Design approach",
      "kind": "area",
      "v": "",
      "req": true,
      "ph": "How does it satisfy the function?"
     },
     {
      "id": "d.limit",
      "label": "Constraints",
      "v": "",
      "ph": "Size, power, standards"
     }
    ]
   },
   {
    "t": "table",
    "id": "ifc",
    "title": "Interfaces",
    "note": "Each interface should have a protocol",
    "cols": [
     {
      "k": "ifc",
      "label": "Interface",
      "edit": true
     },
     {
      "k": "with",
      "label": "Connects to",
      "edit": true
     },
     {
      "k": "type",
      "label": "Type",
      "edit": true,
      "opts": [
       "",
       "Electrical",
       "Mechanical",
       "Radio",
       "Software"
      ]
     },
     {
      "k": "proto",
      "label": "Protocol",
      "edit": true
     }
    ],
    "rows": []
   },
   {
    "t": "head",
    "title": "Write the requirements",
    "codes": "Specify",
    "who": "Systems Engineer.",
    "intro": "One requirement per row. Each is a single testable statement with a subtype and a way to verify it."
   },
   {
    "t": "table",
    "id": "reqs",
    "title": "Requirements",
    "note": "Subtype is the MDSE Requirement subtype",
    "cols": [
     {
      "k": "id",
      "label": "ID",
      "edit": true
     },
     {
      "k": "st",
      "label": "Statement",
      "edit": true
     },
     {
      "k": "sub",
      "label": "Subtype",
      "edit": true,
      "opts": [
       "",
       "functional",
       "design",
       "standard",
       "stakeholder",
       "engineering"
      ]
     },
     {
      "k": "vm",
      "label": "Verify by",
      "edit": true,
      "opts": [
       "",
       "test",
       "analysis",
       "inspection",
       "demonstration"
      ]
     },
     {
      "k": "src",
      "label": "Source",
      "edit": true
     }
    ],
    "rows": [],
    "src": "requirements"
   },
   {
    "t": "group",
    "label": "Critical to the definition",
    "crit": true,
    "caption": "Checked by the author before submitting",
    "fields": [
     {
      "id": "q.one",
      "label": "Each requirement is one testable statement",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Yes",
       "No"
      ]
     },
     {
      "id": "q.ver",
      "label": "Each requirement has a verification method",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Yes",
       "No"
      ]
     },
     {
      "id": "q.trace",
      "label": "Each requirement traces to a function or stakeholder need",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Yes",
       "No"
      ]
     }
    ]
   }
  ]
 },
 {
  "id": "FWC",
  "name": "Firmware",
  "group": "Define",
  "pick": "Firmware part",
  "copy": false,
  "wasLabel": "Current release:",
  "files": [
   {
    "f": "firmware.properties.yaml",
    "a": "Edit",
    "fmt": "YAML (diff against the current release)",
    "loc": "firmware repo"
   },
   {
    "f": "Release notes",
    "a": "Create",
    "fmt": "Markdown",
    "loc": "Releases"
   },
   {
    "f": "Firmware element note",
    "a": "Edit",
    "fmt": "Markdown with YAML (MDSE Object, firmware)",
    "loc": "Objects"
   }
  ],
  "blocks": [
   {
    "t": "head",
    "title": "Identify the firmware",
    "codes": "Firmware",
    "who": "Software Engineer.",
    "intro": "Pick the firmware release being changed. The tool loads its properties file, so every edit below shows against the current release. Changing the release reloads the form."
   },
   {
    "t": "group",
    "label": "Critical to the change",
    "crit": true,
    "caption": "Which firmware, which hardware",
    "fields": [
     {
      "id": "fw.name",
      "label": "Firmware",
      "kind": "read",
      "dyn": "name"
     },
     {
      "id": "fw.rel",
      "label": "Release state",
      "kind": "read",
      "dyn": "rel"
     },
     {
      "id": "fw.hw",
      "label": "Runs on",
      "kind": "read",
      "dyn": "hw"
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "fw.repo",
      "label": "Repository",
      "kind": "read",
      "dyn": "repo"
     },
     {
      "id": "fw.branch",
      "label": "Working branch",
      "v": "",
      "ph": "[branch]"
     }
    ]
   },
   {
    "t": "head",
    "title": "Set the properties",
    "codes": "Firmware",
    "who": "Software Engineer.",
    "intro": "These are the properties that define a firmware release. Edit the ones this change needs. The file below updates as you type, with each changed line marked, so reviewers see the change without a code diff."
   },
   {
    "t": "group",
    "label": "Critical properties",
    "crit": true,
    "caption": "Anything here can break compatibility",
    "fields": [
     {
      "id": "f.version",
      "label": "Version",
      "v": "",
      "req": true,
      "y": "version",
      "from": "revision"
     },
     {
      "id": "f.hw",
      "label": "Target hardware",
      "v": "",
      "req": true,
      "y": "target_hardware",
      "ylist": true,
      "hint": "Separate with commas"
     },
     {
      "id": "f.boot",
      "label": "Minimum bootloader",
      "v": "",
      "y": "bootloader_min"
     },
     {
      "id": "f.proto",
      "label": "Network protocol",
      "kind": "select",
      "v": "",
      "opts": [
       "",
       "thread-1.3",
       "thread-1.4",
       "none"
      ],
      "y": "protocol"
     },
     {
      "id": "f.dbc",
      "label": "CAN database",
      "v": "",
      "y": "can_database"
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting properties",
    "fields": [
     {
      "id": "f.schema",
      "label": "Config schema",
      "v": "",
      "y": "config_schema"
     },
     {
      "id": "f.wlm",
      "label": "Wireless load management",
      "kind": "select",
      "v": "",
      "opts": [
       "",
       "enabled",
       "disabled"
      ],
      "y": "wireless_load_management"
     },
     {
      "id": "f.fault",
      "label": "Fault report limit (s)",
      "v": "",
      "y": "fault_report_s"
     },
     {
      "id": "f.ota",
      "label": "Over-the-air update",
      "kind": "select",
      "v": "",
      "opts": [
       "",
       "true",
       "false"
      ],
      "y": "ota_update"
     },
     {
      "id": "f.log",
      "label": "Log level",
      "kind": "select",
      "v": "",
      "opts": [
       "",
       "error",
       "warn",
       "info",
       "debug"
      ],
      "y": "log_level"
     }
    ]
   },
   {
    "t": "yaml",
    "title": "firmware.properties.yaml",
    "note": "Changed lines are highlighted and show the current release value."
   },
   {
    "t": "head",
    "title": "Compatibility and requirements",
    "codes": "Firmware",
    "who": "Software Engineer, with Systems.",
    "intro": "Say what the change breaks and what it must still satisfy."
   },
   {
    "t": "group",
    "label": "Critical to the release",
    "crit": true,
    "fields": [
     {
      "id": "c.back",
      "label": "Backward compatible",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Yes",
       "No",
       "With conditions"
      ]
     },
     {
      "id": "c.hw",
      "label": "Needs a hardware rev",
      "v": "",
      "ph": "None, or the rev"
     },
     {
      "id": "c.method",
      "label": "How it reaches units",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Over the air",
       "Service tool",
       "Factory only"
      ]
     },
     {
      "id": "c.roll",
      "label": "Rollback available",
      "kind": "select",
      "v": "Yes",
      "opts": [
       "Yes",
       "No"
      ]
     }
    ]
   },
   {
    "t": "table",
    "id": "reqs",
    "title": "Requirements this firmware satisfies",
    "note": "Re-verify any that this change touches",
    "cols": [
     {
      "k": "id",
      "label": "Requirement"
     },
     {
      "k": "req",
      "label": "Requirement text"
     },
     {
      "k": "st",
      "label": "Status"
     }
    ],
    "rows": [],
    "src": "requirements"
   },
   {
    "t": "head",
    "title": "Release notes and verification",
    "codes": "Firmware",
    "who": "Software Engineer; Validation Engineer.",
    "intro": "Notes for the people who will install it, and the link to the test plan that verifies it."
   },
   {
    "t": "group",
    "label": "Critical to the release",
    "crit": true,
    "fields": [
     {
      "id": "n.notes",
      "label": "Release notes",
      "kind": "area",
      "v": "",
      "req": true,
      "ph": "What changed, for whoever installs it"
     },
     {
      "id": "n.tag",
      "label": "Release tag",
      "v": "",
      "ph": "[tag]"
     },
     {
      "id": "n.plan",
      "label": "Test plan flow ID",
      "v": "",
      "ph": "[TPL flow ID]"
     },
     {
      "id": "n.issue",
      "label": "Issue fixed",
      "v": "",
      "ph": "[ISS flow ID]"
     }
    ]
   }
  ]
 },
 {
  "id": "TPL",
  "name": "Test plan",
  "group": "Verify",
  "pick": "ECO note",
  "copy": false,
  "wasLabel": "Was:",
  "files": [
   {
    "f": "Test plan note",
    "a": "Create",
    "fmt": "Markdown with YAML",
    "loc": "Test plans"
   },
   {
    "f": "Test plan canvas",
    "a": "Create",
    "fmt": "Obsidian canvas",
    "loc": "Test plans"
   },
   {
    "f": "Test case notes",
    "a": "Edit",
    "fmt": "Markdown with YAML (MDSE Verification)",
    "loc": "Verification"
   },
   {
    "f": "Setup notes",
    "a": "Edit",
    "fmt": "Markdown with YAML (MDSE Setup)",
    "loc": "Setups"
   }
  ],
  "blocks": [
   {
    "t": "head",
    "title": "What is changing",
    "codes": "Test plan",
    "who": "Validation Engineer.",
    "intro": "Pick the effort. The tool lists the changed parts and the requirements they touch. Those lead to the test cases below. Changing the effort reloads the form."
   },
   {
    "t": "group",
    "label": "Critical to the plan",
    "crit": true,
    "caption": "What the plan has to cover",
    "fields": [
     {
      "id": "p.items",
      "label": "Changed items",
      "kind": "read",
      "dyn": "items"
     },
     {
      "id": "p.reqs",
      "label": "Requirements touched",
      "kind": "read",
      "dyn": "reqs"
     },
     {
      "id": "p.cases",
      "label": "Test cases suggested",
      "kind": "read",
      "dyn": "cases"
     }
    ]
   },
   {
    "t": "table",
    "id": "changed",
    "title": "Changed items",
    "note": "From the effort",
    "cols": [
     {
      "k": "item",
      "label": "Item",
      "edit": true
     },
     {
      "k": "rev",
      "label": "Rev",
      "edit": true
     },
     {
      "k": "kind",
      "label": "Kind",
      "edit": true
     }
    ],
    "rows": []
   },
   {
    "t": "table",
    "id": "reqs",
    "title": "Requirements touched",
    "note": "Each needs a verification",
    "cols": [
     {
      "k": "id",
      "label": "Requirement"
     },
     {
      "k": "req",
      "label": "Requirement text"
     },
     {
      "k": "ver",
      "label": "Verified by"
     }
    ],
    "rows": [],
    "src": "requirements"
   },
   {
    "t": "head",
    "title": "Choose the test cases",
    "codes": "Test plan",
    "who": "Validation Engineer.",
    "intro": "Suggested cases come from the changed parts and requirements. Include the ones this change needs, say why, and give each a setup. A case left without a setup cannot be placed on the canvas."
   },
   {
    "t": "table",
    "id": "cases",
    "title": "Test cases for consideration",
    "note": "Include, drop or reassign the setup",
    "cols": [
     {
      "k": "inc",
      "label": "Include",
      "edit": true,
      "opts": [
       "Yes",
       "No"
      ]
     },
     {
      "k": "test",
      "label": "Test case",
      "edit": true
     },
     {
      "k": "why",
      "label": "Why",
      "edit": true
     },
     {
      "k": "setup",
      "label": "Setup",
      "edit": true,
      "opts": [
       "",
       "Bench: supply and load",
       "Thermal chamber",
       "Hardware in the loop",
       "EMC lab",
       "Field site"
      ]
     },
     {
      "k": "vt",
      "label": "Method",
      "edit": true,
      "opts": [
       "Test",
       "Analysis",
       "Inspection",
       "Demonstration"
      ]
     }
    ],
    "rows": [],
    "src": "verifications"
   },
   {
    "t": "head",
    "title": "Set up the canvas",
    "codes": "Test plan",
    "who": "Validation Engineer.",
    "intro": "The included tests, grouped by setup. This becomes an Obsidian canvas in the vault, with each card linked to its test case note."
   },
   {
    "t": "canvas",
    "title": "Test plan canvas",
    "note": "Updates as you include or reassign tests.",
    "from": "cases",
    "include": "inc",
    "group": "setup",
    "item": "test",
    "file": "Test plan.canvas"
   },
   {
    "t": "group",
    "label": "Critical to the plan",
    "crit": true,
    "fields": [
     {
      "id": "pl.name",
      "label": "Plan name",
      "v": "",
      "req": true,
      "ph": "[plan name]"
     },
     {
      "id": "pl.level",
      "label": "Level",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Component",
       "Subsystem",
       "System"
      ]
     },
     {
      "id": "pl.entry",
      "label": "Entry criteria",
      "kind": "area",
      "v": "",
      "ph": "What must be true before testing starts"
     },
     {
      "id": "pl.exit",
      "label": "Exit criteria",
      "kind": "area",
      "v": "",
      "ph": "What counts as done"
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "pl.start",
      "label": "Planned start",
      "v": "",
      "ph": "[date]"
     },
     {
      "id": "pl.end",
      "label": "Planned end",
      "v": "",
      "ph": "[date]"
     },
     {
      "id": "pl.owner",
      "label": "Plan owner",
      "v": "",
      "ph": "[name]"
     }
    ]
   },
   {
    "t": "head",
    "title": "Issue the plan",
    "codes": "Test plan",
    "who": "Validation Engineer; reviewer signs off in Review and approve.",
    "intro": "Each included case becomes a Test report flow when its test is run."
   },
   {
    "t": "group",
    "label": "Critical to issuing",
    "crit": true,
    "fields": [
     {
      "id": "is.status",
      "label": "Plan status",
      "kind": "select",
      "v": "Draft",
      "opts": [
       "Draft",
       "Issued"
      ]
     },
     {
      "id": "is.reports",
      "label": "Test report flows",
      "kind": "read",
      "v": "One per included test case, created when the test is run"
     }
    ]
   }
  ]
 },
 {
  "id": "TRP",
  "name": "Test report",
  "group": "Verify",
  "pick": "Verification case",
  "copy": false,
  "wasLabel": "Was:",
  "files": [
   {
    "f": "Test report",
    "a": "Create",
    "fmt": "Markdown with procedure, results and embedded pictures",
    "loc": "Test reports"
   },
   {
    "f": "Test report PDF",
    "a": "Create",
    "fmt": "PDF export of the report",
    "loc": "Test reports"
   },
   {
    "f": "Pictures",
    "a": "Create",
    "fmt": "PNG or JPG",
    "loc": "Test reports/attachments"
   },
   {
    "f": "Test case note",
    "a": "Edit",
    "fmt": "Markdown with YAML (result and report link)",
    "loc": "Verification"
   }
  ],
  "blocks": [
   {
    "t": "head",
    "title": "Select the test",
    "codes": "Test report",
    "who": "Test technician or Validation Engineer.",
    "intro": "Pick the test case from the plan. The tool loads its procedure, setup and the requirement it verifies, so the report is filled out against the approved procedure. Changing the test reloads the form."
   },
   {
    "t": "group",
    "label": "Critical to the report",
    "crit": true,
    "caption": "What is being tested, and against what",
    "fields": [
     {
      "id": "t.req",
      "label": "Requirement verified",
      "kind": "read",
      "dyn": "req"
     },
     {
      "id": "t.setup",
      "label": "Setup",
      "kind": "read",
      "dyn": "setup"
     },
     {
      "id": "t.unit",
      "label": "Unit under test (item)",
      "kind": "read",
      "dyn": "unit"
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "t.plan",
      "label": "From test plan",
      "kind": "read",
      "dyn": "plan"
     },
     {
      "id": "t.method",
      "label": "Method",
      "kind": "read",
      "dyn": "method"
     }
    ]
   },
   {
    "t": "head",
    "title": "Record the setup",
    "codes": "Test report",
    "who": "Test technician.",
    "intro": "Exactly what was tested and what it was tested with, so the result can be repeated."
   },
   {
    "t": "group",
    "label": "Critical to the result",
    "crit": true,
    "fields": [
     {
      "id": "u.sn",
      "label": "Unit serial number",
      "v": "",
      "req": true,
      "ph": "[serial]"
     },
     {
      "id": "u.hw",
      "label": "Hardware rev",
      "v": "",
      "req": true,
      "ph": "[rev]"
     },
     {
      "id": "u.fw",
      "label": "Firmware version",
      "v": "",
      "req": true,
      "ph": "[version]"
     },
     {
      "id": "u.date",
      "label": "Test date",
      "v": "",
      "req": true,
      "ph": "[date]"
     },
     {
      "id": "u.by",
      "label": "Tested by",
      "v": "",
      "req": true,
      "ph": "[name]"
     }
    ]
   },
   {
    "t": "table",
    "id": "inst",
    "title": "Instruments used",
    "note": "Calibration must be current",
    "cols": [
     {
      "k": "name",
      "label": "Instrument",
      "edit": true
     },
     {
      "k": "id",
      "label": "Asset ID",
      "edit": true
     },
     {
      "k": "cal",
      "label": "Calibration due",
      "edit": true
     }
    ],
    "rows": []
   },
   {
    "t": "head",
    "title": "Procedure and results",
    "codes": "Test report",
    "who": "Test technician.",
    "intro": "Each step of the approved procedure, with the expected result. Record the measured value and a result for every step."
   },
   {
    "t": "table",
    "id": "steps",
    "title": "Procedure steps",
    "note": "The procedure is read-only; record the result",
    "cols": [
     {
      "k": "n",
      "label": "#",
      "edit": true
     },
     {
      "k": "step",
      "label": "Procedure step",
      "edit": true
     },
     {
      "k": "exp",
      "label": "Expected",
      "edit": true
     },
     {
      "k": "val",
      "label": "Measured",
      "edit": true
     },
     {
      "k": "res",
      "label": "Result",
      "edit": true,
      "opts": [
       "",
       "Pass",
       "Fail",
       "Not run"
      ]
     },
     {
      "k": "note",
      "label": "Notes",
      "edit": true
     }
    ],
    "rows": []
   },
   {
    "t": "head",
    "title": "Pictures",
    "codes": "Test report",
    "who": "Test technician.",
    "intro": "Attach the pictures that show the setup and the result. Each is copied into the vault and embedded in the report next to its step."
   },
   {
    "t": "table",
    "id": "pics",
    "title": "Pictures attached",
    "note": "Name the file, tie it to a step",
    "cols": [
     {
      "k": "file",
      "label": "Picture file",
      "edit": true
     },
     {
      "k": "step",
      "label": "Step",
      "edit": true
     },
     {
      "k": "cap",
      "label": "Caption",
      "edit": true
     }
    ],
    "rows": []
   },
   {
    "t": "head",
    "title": "Conclusion",
    "codes": "Test report",
    "who": "Test technician; Validation Engineer signs off.",
    "intro": "The overall result and anything that did not go to procedure. A failure starts an Issue flow."
   },
   {
    "t": "group",
    "label": "Critical to the conclusion",
    "crit": true,
    "fields": [
     {
      "id": "k.res",
      "label": "Overall result",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Pass",
       "Fail",
       "Incomplete"
      ]
     },
     {
      "id": "k.dev",
      "label": "Deviations from the procedure",
      "kind": "area",
      "v": "",
      "ph": "None, or what differed and why"
     },
     {
      "id": "k.issue",
      "label": "Issue flow ID",
      "v": "",
      "ph": "[ISS flow ID, if the result is Fail]"
     },
     {
      "id": "k.rev",
      "label": "Reviewed by",
      "v": "",
      "ph": "[name]"
     }
    ]
   }
  ]
 },
 {
  "id": "DOC",
  "name": "Document",
  "group": "Define",
  "pick": "ECO note",
  "copy": false,
  "wasLabel": "Was:",
  "files": [
   {
    "f": "Document change list",
    "a": "Create",
    "fmt": "Markdown table",
    "loc": "Documents"
   },
   {
    "f": "Document notes",
    "a": "Edit",
    "fmt": "Markdown with YAML (MDSE Document, link and rev only)",
    "loc": "Documents"
   },
   {
    "f": "Draft revisions",
    "a": "Create",
    "fmt": "Markdown or the document’s own format",
    "loc": "Documents/drafts"
   }
  ],
  "blocks": [
   {
    "t": "head",
    "title": "Find the documentation",
    "codes": "Document",
    "who": "Anyone responsible for documentation; Product owns the service manual.",
    "intro": "Pick the effort. The tool lists the documents that refer to the changed items, with their current rev, so nothing is missed. Changing the effort reloads the form."
   },
   {
    "t": "group",
    "label": "Critical to the documentation",
    "crit": true,
    "caption": "What the change touches",
    "fields": [
     {
      "id": "x.found",
      "label": "Documents found",
      "kind": "read",
      "dyn": "found"
     },
     {
      "id": "x.need",
      "label": "Flagged for update",
      "kind": "read",
      "dyn": "need"
     }
    ]
   },
   {
    "t": "group",
    "label": "Supporting details",
    "fields": [
     {
      "id": "x.title",
      "label": "Effort title",
      "kind": "read",
      "dyn": "title"
     },
     {
      "id": "x.by",
      "label": "Documentation owner",
      "v": "",
      "ph": "[name]"
     }
    ]
   },
   {
    "t": "head",
    "title": "Decide what changes",
    "codes": "Document",
    "who": "Document owners.",
    "intro": "For each existing document, decide whether it changes. CAD and drawing files stay in PDM; the tool keeps the link and rev only."
   },
   {
    "t": "table",
    "id": "existing",
    "title": "Existing documents",
    "note": "Set the action for each",
    "cols": [
     {
      "k": "name",
      "label": "Document",
      "edit": true
     },
     {
      "k": "type",
      "label": "Type",
      "edit": true
     },
     {
      "k": "rev",
      "label": "Rev",
      "edit": true
     },
     {
      "k": "loc",
      "label": "Where it lives",
      "edit": true
     },
     {
      "k": "act",
      "label": "Action",
      "edit": true,
      "opts": [
       "",
       "No change",
       "Update",
       "Retire",
       "Not sure"
      ]
     }
    ],
    "rows": []
   },
   {
    "t": "group",
    "label": "Critical to the change",
    "crit": true,
    "fields": [
     {
      "id": "d.why",
      "label": "What in the change affects the documents",
      "kind": "area",
      "v": "",
      "req": true,
      "ph": "In a sentence or two"
     },
     {
      "id": "d.when",
      "label": "Needed by",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "Before release",
       "At release",
       "After release"
      ]
     }
    ]
   },
   {
    "t": "head",
    "title": "New and revised documents",
    "codes": "Document",
    "who": "Document owners.",
    "intro": "List each document to write or revise, with its owner and a one-line change summary. These are the rows the ECN lists as documents changed."
   },
   {
    "t": "table",
    "id": "new",
    "title": "Documents to create or revise",
    "note": "Each row gets a draft in the vault",
    "cols": [
     {
      "k": "name",
      "label": "Document",
      "edit": true
     },
     {
      "k": "type",
      "label": "Type",
      "edit": true,
      "opts": [
       "",
       "Drawing",
       "Work instruction",
       "Test procedure",
       "Datasheet",
       "Service manual",
       "User manual",
       "Release notes",
       "Label"
      ]
     },
     {
      "k": "act",
      "label": "Action",
      "edit": true,
      "opts": [
       "",
       "New",
       "Revise"
      ]
     },
     {
      "k": "own",
      "label": "Owner",
      "edit": true
     },
     {
      "k": "sum",
      "label": "Change summary",
      "edit": true
     }
    ],
    "rows": []
   },
   {
    "t": "head",
    "title": "Draft and link",
    "codes": "Document",
    "who": "Document owners.",
    "intro": "Where each draft lives, and how it will be released."
   },
   {
    "t": "group",
    "label": "Critical to release",
    "crit": true,
    "fields": [
     {
      "id": "r.loc",
      "label": "Draft location",
      "v": "",
      "req": true,
      "ph": "[link or vault path]"
     },
     {
      "id": "r.rel",
      "label": "Released with",
      "kind": "select",
      "v": "",
      "req": true,
      "opts": [
       "",
       "The ECO",
       "Its own release"
      ]
     },
     {
      "id": "r.notes",
      "label": "Notes for the reviewer",
      "kind": "area",
      "v": ""
     }
    ]
   }
  ]
 }
];
