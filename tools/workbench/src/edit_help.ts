/* The "?" help (D-0031): a short definition and the options for each topic in the Edit lens. Text is bundled and shown in a
 * small popover, so there is no lookup and no wait. `note` names the full note in 99_System/04_Language (D-0028) when one exists. */
export interface EdHelp { title: string; what: string; options?: string[]; note?: string }

export const ED_HELP: Record<string, EdHelp> = {
  owns: { title: "Owned usage (has part / port / action / state / item)", what: "This definition contains an instance of the target, such as a charger that has 4 cells.", options: ["The usage kind follows the target's kind: part, port, action, state or item.", "Quantity, direction (items only), ordered and nonunique are properties of the usage."], note: "Part usage" },
  satisfy: { title: "Satisfies", what: "This part, action or state meets the requirement.", options: ["Target: a requirement.", "Use Verifies on a test case to show how it is checked."], note: "Satisfy" },
  verify: { title: "Verifies", what: "This verification case checks the requirement.", options: ["Target: a requirement. Written inside the case's objective."], note: "Verify" },
  allocate: { title: "Allocated to", what: "One element is realised by another, for example a function by a part. A typed mapping, stronger than a dependency.", options: ["Target: any definition.", "Use Dependency when you only know the two are related."], note: "Allocation (allocate)" },
  perform: { title: "Performs", what: "This part carries out the action. The part owns a usage of the action definition.", options: ["Target: an action definition.", "Name: the usage's name inside this part."], note: "Perform" },
  specializes: { title: "Specializes", what: "This definition is a kind of the target and inherits everything the target has.", options: ["Same kind of definition only (part with part, requirement with requirement).", "Not a dependency: use it for is-a, not for related-to."], note: "Specialization (definition)" },
  include: { title: "Includes use case", what: "This use case always includes the target's behaviour as a step.", options: ["Target: a use case.", "Name: the usage's name."], note: "Include" },
  extend: { title: "Extended by use case", what: "The target use case is an optional extension of this one, written as an optional [0..1] usage.", options: ["Target: a use case."], note: "Use case usage" },
  derivedFrom: { title: "Derived from", what: "This requirement is derived from the target requirement.", options: ["Requirement to requirement.", "Refines is for adding precision, not for deriving."], note: "Dependency" },
  refines: { title: "Refines", what: "This adds precision to the target.", options: ["Any definition to any definition."], note: "Dependency" },
  trace: { title: "Traces to", what: "The two are related and the relationship is not chosen yet.", options: ["Provisional: replace it with a stronger relationship when you can."], note: "Dependency" },
  dependsOn: { title: "Depends on", what: "This needs the target, with no further meaning.", options: ["Prefer Satisfy, Allocate or Refines when one fits."], note: "Dependency" },
  depKind: { title: "Kind of dependency", what: "A dependency is one SysML statement; its kind is kept as a comment tag the Workbench reads.", options: ["derivedFrom, refines, trace, dependsOn."], note: "Dependency" },
  usageKind: { title: "Usage kind", what: "What the owned element is: a part, port, item, action or state.", options: ["Set by the target: a part definition gives part, a port or interface definition gives port, and so on."] },
  name: { title: "Name", what: "The usage's identifier inside this definition. Letters, digits, underscore.", options: ["Referenced by connections and flows: a name used elsewhere in the block cannot be changed here."] },
  mult: { title: "Quantity (multiplicity)", what: "How many. 3, 0..1, 1..* or *. Blank means exactly one.", options: ["Written as [3] after the type."], note: "Multiplicity" },
  dir: { title: "Direction", what: "For an item: does it flow into, out of, or both ways through its owner.", options: ["in, out, inout, or none."], note: "Item usage" },
  ordered: { title: "Ordered", what: "The instances have a fixed order, like the cells in a string.", options: ["On or off."] },
  nonunique: { title: "Nonunique", what: "The same instance may appear more than once.", options: ["On or off. Rare."] },
  doc: { title: "Description", what: "Free text that explains why this relationship exists. Written as a doc comment inside it.", options: ["Plain words; no limit."], note: "Documentation" },
  custom: { title: "Other attribute", what: "A name and a value you define that the list does not offer, written as an attribute inside the relationship.", options: ["Name: letters, digits, underscore.", "Value: a number or text. Anything else is stored as a comment."], note: "Attribute usage" },
  target: { title: "Target", what: "The other end of the relationship. Changing it re-points the relationship; nothing else moves.", options: ["Only notes allowed for this kind are listed."] },
  remove: { title: "Remove", what: "Deletes this relationship, and the properties written inside it, from the SysML block. The notes at both ends stay.", options: ["You see the change first, and can undo it."] },
};
