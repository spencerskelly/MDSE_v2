# Coverage of 52 inventoried SysML v2 relationship entries

> [!warning] This crosswalk measures documentation linkage only. It is neither a statement of OMG metamodel completeness nor verification of importer/Workbench support or individual parser acceptance. Source: user-supplied relationship workbook, sheet `SysML2 Relationships`. Language catalog: `governance/language/catalog.json`.

**52 source rows, 51 distinct names:** `Dependency` is in two categories. Separate language catalog contains 31 dedicated relationship-kind entries, but some language features/ownership constructs do not have their own relationship-kind notes.

| Source group | Name in workbook | Matching relationship-kind catalog ID, if confidently linked |
|---|---|---|
| Ownership and typing | Owning Membership | NOT LINKED — review other catalog kinds |
| Ownership and typing | Feature Membership | NOT LINKED — review other catalog kinds |
| Ownership and typing | Membership Import | import-membership |
| Ownership and typing | Namespace Import | import-namespace |
| Ownership and typing | Alias Membership | alias |
| Ownership and typing | Specialization | specialization |
| Ownership and typing | Subclassification | specialization |
| Ownership and typing | Feature Typing | feature-typing |
| Ownership and typing | Subsetting | subsetting |
| Ownership and typing | Reference Subsetting | reference-subsetting |
| Ownership and typing | Redefinition | redefinition |
| Ownership and typing | Feature Chaining | NOT LINKED — review other catalog kinds |
| Ownership and typing | Type Featuring | NOT LINKED — review other catalog kinds |
| Ownership and typing | Conjugation | conjugation |
| Ownership and typing | Union | NOT LINKED — review other catalog kinds |
| Ownership and typing | Intersection | NOT LINKED — review other catalog kinds |
| Ownership and typing | Disjoining | NOT LINKED — review other catalog kinds |
| Connections and behavior | Connection | connection-usage |
| Connections and behavior | Interface | interface-usage |
| Connections and behavior | Flow | flow-usage |
| Connections and behavior | Succession | succession |
| Connections and behavior | Succession Flow | succession-flow-usage |
| Connections and behavior | Binding Connector | bind |
| Connections and behavior | Allocation | allocation-usage |
| Connections and behavior | Assignment | NOT LINKED — review other catalog kinds |
| Connections and behavior | Perform | perform-action-usage |
| Connections and behavior | Transition | transition-usage |
| Connections and behavior | Transition Succession | NOT LINKED — review other catalog kinds |
| Connections and behavior | Derivation | derivation-connection |
| Connections and behavior | Dependency | dependency |
| Requirements and cases | Satisfy Requirement | satisfy-requirement-usage |
| Requirements and cases | Assert Constraint | NOT LINKED — review other catalog kinds |
| Requirements and cases | Require Constraint | NOT LINKED — review other catalog kinds |
| Requirements and cases | Verify Requirement | verify-requirement-usage |
| Requirements and cases | Subject | NOT LINKED — review other catalog kinds |
| Requirements and cases | Actor | NOT LINKED — review other catalog kinds |
| Requirements and cases | Stakeholder | NOT LINKED — review other catalog kinds |
| Requirements and cases | Objective | NOT LINKED — review other catalog kinds |
| Requirements and cases | Concern | NOT LINKED — review other catalog kinds |
| Requirements and cases | Include Use Case | include-use-case-usage |
| Requirements and cases | Exhibit State | exhibit-state-usage |
| Requirements and cases | View Expose | expose |
| Requirements and cases | Viewpoint Conformance | NOT LINKED — review other catalog kinds |
| Cross-cutting | Annotation | NOT LINKED — review other catalog kinds |
| Cross-cutting | Documentation | NOT LINKED — review other catalog kinds |
| Cross-cutting | Metadata Application | NOT LINKED — review other catalog kinds |
| Cross-cutting | Filter | NOT LINKED — review other catalog kinds |
| Cross-cutting | Import | import-membership / import-namespace |
| Cross-cutting | Dependency | dependency |
| Cross-cutting | Feature Value | NOT LINKED — review other catalog kinds |
| Cross-cutting | Multiplicity | NOT LINKED — review other catalog kinds |
| Cross-cutting | Type Argument | NOT LINKED — review other catalog kinds |

## Name coverage is not implementation coverage

- A link to the catalog is only a documented conceptual relation; the catalog itself labels many relationship examples as not individually accepted by the pinned parser.
- 'NOT LINKED' requires a review of usage/structure/annotation representation; do not invent a pseudo-SysML keyword to fill the row.
- The workbook includes metamodel membership, feature value, type argument and multiplicity entries, which may be expressible as declarations/features rather than standalone relationship statements.
- The existing language catalog also describes specialized forms (message, conditional succession, cross-subsetting, causation, multicausation and refinement) not named separately in the workbook. Do not drop these.
- Parser, importer, Workbench scanner, graphical view, document view, editor, round-trip and semantic-validation evidence must be tracked independently.

## Native textual relationship examples (not yet individually certified)

```sysml
part def Specialized :> Base;
part x : Type;
ref part y ::> x;
port p : ~PortDef;
connect a.p to b.p;
bind a.x = b.x;
flow of Payload from a.out to b.in;
succession first a then b;
perform action run : Run;
include use case login : Login;
```

Some examples depend on enclosing declarations and library bindings; never use this illustrative set as a standalone parser acceptance fixture. Exact lexical tokens `:`, `:>`, `::>`, `=>`, `:>>` are defined in OMG SysML v2.0 2026-03-02 §8.2.2.1.2 (https://www.omg.org/spec/SysML/2.0/Language/PDF).

See [the 29-field MDSE syntax crosswalk](OD_01_29_FIELD_NATIVE_SYNTAX_CROSSWALK.md) for canonical-v2 versus MDSE-only decisions, all still subject to OD-01 review.
