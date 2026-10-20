---
type: Language Index
id: sysml-v2-language
status: Draft
---
# SysML v2 language in MDSE

108 constructs, one note each: what it is, which elements it can come from and go to, and what separates it from the most similar construct. Source: the OMG SysML v2 specification; keywords and forms checked against the Pilot Implementation grammar (`SysML.xtext`).

Every construct is available. Engineers use a handful of them most of the time, so the notes carry a use level: **Everyday** (28), **Common** (38), **Occasional** (27), **Rare** (15).

## Everyday

| Construct | Kind | Written as | Use |
|---|---|---|---|
| [[Part definition]] | Definition | `part def` | A class of physical or logical system components that has identity and structure and can own parts, ports and behaviour. |
| [[Part usage]] | Usage | `part name : Type` | A particular use of a part definition inside an owning context: this assembly contains one of these, in this role. |
| [[Attribute definition]] | Definition | `attribute def` | A definition of a data type: a value with no identity (a number with unit, a record of fields, a quantity kind). |
| [[Attribute usage]] | Usage | `attribute name : Type` | A named value held by a definition or usage, typed by an attribute definition (for example `ratedPower : PowerValue`). |
| [[Port definition]] | Definition | `port def` | A definition of an interaction point on a part: what can enter or leave through it (directed features, nested ports). |
| [[Port usage]] | Usage | `port name : Type` | A named interaction point on a part, typed by a port definition. |
| [[Allocation definition]] | Definition | `allocation def` | A definition of an allocation relationship between a source and a target, for example logical to physical, or function to component. |
| [[Allocation (allocate)]] | Relationship | `allocate a to b;` | A statement that one element is allocated to another (`allocate a to b;`). |
| [[Action definition]] | Definition | `action def` | A definition of behaviour: something that happens, with inputs, outputs and a decomposition into steps. |
| [[Action usage]] | Usage | `action name : Type` | A step of behaviour inside another action or a part (`action charge : ChargeVehicle;`). |
| [[Requirement definition]] | Definition | `requirement def` | A definition of a stated need: a subject, a text and constraints that a design must meet. |
| [[Requirement usage]] | Usage | `requirement name : Type` | A use of a requirement definition at a place in a requirement tree or inside a verification objective. |
| [[Verification case definition]] | Definition | `verification def` | A definition of how requirements are verified: a subject, a method and an objective that verifies requirements and returns a verdict. |
| [[Verification case usage]] | Usage | `verification name : Type` | A use of a verification case applied to a subject (`verification v : TestCharger;`). |
| [[Specialization (definition)]] | Relationship | `def A :> B` | The relationship that makes one definition a more specific kind of another. |
| [[Feature typing]] | Relationship | `usage : Definition` | The relationship that says a usage is an instance of a definition (`part c : Charger`). |
| [[Import (membership)]] | Relationship | `import Pkg::Name;` | Makes a member of another namespace visible by its simple name in this one. |
| [[Package]] | Structure | `package Name { }` | The basic container that groups elements and gives them qualified names. |
| [[Comment]] | Annotation | `comment /* text */` | Free text attached to an element or to the enclosing namespace. |
| [[Documentation]] | Annotation | `doc /* text */` | The description of the element that owns it. |
| [[Multiplicity]] | Structure | `[n]  [lo..hi]  [*]` | How many of a usage may exist: `[3]`, `[0..1]`, `[1..*]`. |
| [[Parameter direction]] | Structure | `in x; out y; inout z` | The direction keywords on a usage declare whether it is an input, an output or both of its owner (`in`, `out`, `inout`). |
| [[Subject]] | Usage | `subject s : Type;` | The thing a requirement, case or analysis is about. |
| [[Perform]] | Relationship | `perform action name : ActionDef;` | States that a part performs an action: the link from structure to behaviour. |
| [[Satisfy]] | Relationship | `satisfy Req by Element;` | States that a design element (a part, action or state) satisfies a requirement. |
| [[Verify]] | Relationship | `verify Req;` | Inside a verification objective, names a requirement the case verifies. |
| [[Succession]] | Relationship | `first a then b;` | States that one occurrence (action, state, event) ends before another starts. |
| [[Expression]] | Structure | `a + b;  v <= 480 [V];  x.y.z;  x ? a : b` | Operators, feature chains and units that compute or compare values. |

## Common

| Construct | Kind | Written as | Use |
|---|---|---|---|
| [[Item definition]] | Definition | `item def` | A class of things that can flow, be stored, or be handled: material, energy, data, a document, a person as a payload. |
| [[Item usage]] | Usage | `item name : Type` | One use of an item definition: a payload on a flow, or something a part carries or stores. |
| [[Connection definition]] | Definition | `connection def` | A definition of a relationship between parts that has its own properties or structure, with two or more ends. |
| [[Connection (connect)]] | Relationship | `connect a to b;` | A particular link between the features of a context, optionally typed by a connection definition (`connect a to b`). |
| [[Interface definition]] | Definition | `interface def` | A definition of a connection between ports that fixes what passes across it (the ends are port definitions). |
| [[Interface usage]] | Relationship | `interface : Def connect a to b;` | A use of an interface definition connecting two ports: `interface : PowerInterface connect charger.out to vehicle.in;` |
| [[Flow definition]] | Definition | `flow def` | A definition of an item flow: what is transferred between two features (a payload type and ends). |
| [[Flow]] | Relationship | `flow of P from a to b;` | A transfer of a payload from one feature to another (`flow of Current from a.out to b.in;`). |
| [[State definition]] | Definition | `state def` | A definition of a condition a thing can be in, with entry, do and exit behaviour and transitions to other states. |
| [[State usage]] | Usage | `state name : Type` | A state of its owner, possibly with nested states (`state ready;`). |
| [[Constraint definition]] | Definition | `constraint def` | A definition of a Boolean condition over features: it holds or does not (`voltage <= 480 [V]`). |
| [[Constraint usage]] | Usage | `constraint name : Type` | A use of a constraint definition, or an inline condition, inside a definition or requirement. |
| [[Calculation definition]] | Definition | `calc def` | A definition of a computation that takes inputs and returns a value (a function in the mathematical sense). |
| [[Calculation usage]] | Usage | `calc name : Type` | A use of a calculation to derive a value inside a definition. |
| [[Use case definition]] | Definition | `use case def` | A definition of how actors use a subject to get a result, with included and extended behaviour. |
| [[Use case usage]] | Usage | `use case name : Type` | A use of a use case, in the subject's context (`use case charge : ChargeVehicleUseCase;`). |
| [[Enumeration definition]] | Definition | `enum def` | A definition of a closed set of named values. |
| [[Enumeration usage]] | Usage | `enum name : Type` | A use of an enumeration definition: a feature whose value is one of the named values. |
| [[Subsetting]] | Relationship | `usage :> otherUsage` | The relationship that says the things a usage identifies are a subset of the things another usage identifies (`part leftWheel :> wheels`). |
| [[Redefinition]] | Relationship | `usage :>> inheritedUsage` | The relationship that replaces an inherited usage in a specializing definition with a refined one (`:>>` or `redefines`). |
| [[Conjugation]] | Relationship | `port p : ~PortDef` | The relationship that makes a port definition the mirror of another: inputs become outputs and outputs become inputs (`~` before the type). |
| [[Dependency]] | Relationship | `dependency from A to B` | A directed relationship stating that the client depends on the supplier, with no further semantics. |
| [[Import (namespace)]] | Relationship | `import Pkg::*;  import Pkg::**;` | Makes every public member of another namespace visible. |
| [[Feature modifiers]] | Structure | `abstract \| variation \| ref \| readonly \| derived \| end \| constant \| ordered \| nonunique` | Prefix and suffix words that change how a definition or usage behaves: `abstract` (cannot be instantiated), `variation` (choose one variant), `ref` (reference only), `derived`, `ordered`, `nonunique`, `end` (a connection end). |
| [[Value binding]] | Structure | `= expr  :=  default = expr` | Gives a usage a value or a default value (`ratedPower = 30 [kW]`). |
| [[Reference usage]] | Usage | `ref x : Type;` | A usage that points at something owned elsewhere, such as a parameter, a subject or an end. |
| [[Return]] | Structure | `return r : Type;` | Declares the result of a calculation or expression-bearing definition. |
| [[Actor]] | Usage | `actor name : PartDef;` | A part that interacts with the subject of a case or requirement: the driver, the service engineer, an external system. |
| [[Objective]] | Usage | `objective { }` | The goal of a case: the requirement(s) a verification must show, or what an analysis must answer. |
| [[Assume and require constraint]] | Usage | `assume constraint c { } / require constraint c { }` | The parts of a requirement: `assume` is what must hold for the requirement to apply, `require` is what the subject must meet. |
| [[Exhibit]] | Relationship | `exhibit state name : StateDef;` | States that a part exhibits a state machine: the link from structure to states. |
| [[Include]] | Relationship | `include use case u : UseCase;` | States that one use case always runs another as part of itself. |
| [[Binding connector]] | Relationship | `bind a = b;` | States that two features always have the same value or identify the same thing. |
| [[Transition]] | Relationship | `transition first a accept sig if g do act then b;` | A move from one state (or action) to the next, with an optional trigger (`accept`), guard (`if`) and effect (`do`). |
| [[Accept]] | Statement | `accept p : Payload;` | An action that waits to receive a payload (a signal, an item) and then proceeds. |
| [[Send]] | Statement | `send p via port;` | An action that sends a payload through a port or to a target. |
| [[Decide, merge, fork, join]] | Statement | `decide; merge; fork; join;` | Control nodes in an action: `decide` chooses one branch, `merge` rejoins branches, `fork` starts parallel branches, `join` waits for all. |
| [[Entry, do, exit]] | Statement | `entry action a; do action b; exit action c;` | The actions a state runs when entered, while in it, and when left. |

## Occasional

| Construct | Kind | Written as | Use |
|---|---|---|---|
| [[Concern definition]] | Definition | `concern def` | A definition of a stakeholder interest that views and requirements address (cost, safety, serviceability). |
| [[Concern usage]] | Usage | `concern name : Type` | A use of a concern, framed by a viewpoint or requirement (`frame concern`). |
| [[Analysis case definition]] | Definition | `analysis def` | A definition of an analysis that computes results about a subject for an objective (trade study, thermal analysis). |
| [[Analysis case usage]] | Usage | `analysis name : Type` | A use of an analysis case with its subject and result. |
| [[View definition]] | Definition | `view def` | A definition of a rendered selection of model content that answers a viewpoint. |
| [[View usage]] | Usage | `view name : Type` | A use of a view that exposes elements and renders them (`view v { expose Charger::*; render asTreeDiagram; }`). |
| [[Viewpoint definition]] | Definition | `viewpoint def` | A definition of the stakeholder concerns a view has to address. |
| [[Viewpoint usage]] | Usage | `viewpoint name : Type` | A use of a viewpoint that a view conforms to. |
| [[Metadata definition]] | Definition | `metadata def` | A definition of an annotation type attached to elements (a tag with typed fields such as `Safety`, `Approved`). |
| [[Metadata usage]] | Usage | `metadata name : Type` | A use that attaches metadata to an element: `@Safety { level = 3; }` or `#Safety part x;`. |
| [[Reference subsetting]] | Relationship | `usage ::> otherFeature` | The relationship that makes a usage refer to another feature rather than own a new one (`::>` or `references`). |
| [[Alias]] | Relationship | `alias Short for Pkg::LongName;` | Gives an existing element another name in a namespace. |
| [[Library package]] | Structure | `library package Name { }` | A package marked as reusable library content, such as units, quantities or a company part catalog. |
| [[Prefix metadata]] | Annotation | `#Tag part x;` | Applies a metadata definition to an element with `#` in front of its declaration. |
| [[Metadata annotation]] | Annotation | `@Tag { field = v; }` | Attaches a metadata value to an element in its body (`@Safety { level = 3; }`) or to others with `about`. |
| [[Visibility]] | Structure | `public \| protected \| private` | Controls whether a member is visible from outside its namespace. |
| [[Variation and variant]] | Structure | `variation part def V { variant part a; }` | Declares a variation point whose members are the allowed choices (variants). |
| [[Event occurrence]] | Usage | `event occurrence e;  event a.b;` | Marks an occurrence that happens at a point in time within a context, such as a message being received. |
| [[Stakeholder]] | Usage | `stakeholder name : PartDef;` | A party with an interest in a requirement or viewpoint. |
| [[Assert constraint]] | Usage | `assert constraint c { }` | States that a constraint holds (or, with `not`, does not hold) within the owner. |
| [[Frame]] | Usage | `frame concern c;` | Names a concern that a requirement or viewpoint addresses. |
| [[Expose]] | Relationship | `expose Pkg::**;` | Names the model content a view shows. |
| [[Succession flow]] | Relationship | `succession flow of P from a to b;` | A flow whose source must finish before the target starts. |
| [[Message]] | Relationship | `message m of P from a to b;` | A transfer of a payload shown between occurrences without saying which features carry it. |
| [[Assign]] | Statement | `assign x := expr;` | An action that sets the value of a feature. |
| [[If]] | Statement | `if cond { } else { }` | Runs one block of actions or another depending on a condition. |
| [[While, loop, for]] | Statement | `while c { } / loop { } until c; / for x in xs { }` | Repeats a block of actions while a condition holds, until one does, or for each item. |

## Rare

| Construct | Kind | Written as | Use |
|---|---|---|---|
| [[Occurrence definition]] | Definition | `occurrence def` | A definition of anything that exists over time and can have a start and end. |
| [[Occurrence usage]] | Usage | `occurrence name : Type` | A use of an occurrence definition. |
| [[Individual definition]] | Definition | `individual def` | A definition of a single, particular thing (this serial number, this vehicle) rather than a class. |
| [[Individual usage]] | Usage | `individual name : Type` | A usage that refers to one individual over its life; combine with `snapshot` and `timeslice` for states in time. |
| [[Case definition]] | Definition | `case def` | A generic definition of an analysis, verification or use case that has a subject, objective and result. |
| [[Case usage]] | Usage | `case name : Type` | A use of a generic case definition in a context, with its subject and objective. |
| [[Rendering definition]] | Definition | `rendering def` | A definition of how a view's content is presented (tree, table, diagram). |
| [[Rendering usage]] | Usage | `rendering name : Type` | A use of a rendering inside a view (`render asTable;`). |
| [[Cross subsetting]] | Relationship | `end x crosses y` | The relationship that says what a connection end sees from the far end of the connection (`crosses`). |
| [[Filter]] | Statement | `filter @Safety;` | A Boolean condition on a package that limits which of its members an import or view sees (`filter @Safety;`). |
| [[Textual representation]] | Annotation | `rep language "x" /* code */` | Embeds code in another language (a formula, a script) as the body of a model element. |
| [[Snapshot]] | Usage | `snapshot name : Type;` | A part or occurrence frozen at one moment in time. |
| [[Timeslice]] | Usage | `timeslice name : Type;` | A part or occurrence over a span of its life, such as the time a charger is in service. |
| [[Render]] | Statement | `render asTree;` | Selects how a view is displayed. |
| [[Terminate]] | Statement | `terminate;` | Ends the enclosing occurrence early, before its normal end, and everything it contains. |

## How MDSE uses these notes

- The `## SysML v2` block of a note is authoritative (D-0003). These notes define the language that block is written in; they are not model notes and the Workbench index skips `99_System`.
- The Workbench scanner recognizes every construct listed here; a statement it does not recognize is reported, not dropped. Which constructs become relationships is stated in each note.
- Add or correct a construct in `governance/language/catalog.json` and run `node scripts/build-language.mjs --write`.
