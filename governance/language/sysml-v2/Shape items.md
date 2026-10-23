---
type: Language Element
id: shape-items
category: library
kind: annotation
keyword: "item x : ShapeItems::RectangularCuboid;"
metaclass: "ItemUsage typed by a ShapeItems definition (Geometry library)"
library: "ShapeItems, SpatialItems"
usage: rare
status: Draft
---
# Shape items

**Standard library concept** · **Annotation** · **Rare** · `item x : ShapeItems::RectangularCuboid;` · SysML v2 standard library (ShapeItems, SpatialItems), not a language keyword. Metaclass: `ItemUsage typed by a ShapeItems definition (Geometry library)`

Standard geometric shapes (lines, circles, rectangles, spheres, cylinders, cuboids and others) that give an item dimensions such as length, width, height or radius. Spatial items place items in space.

## Can be declared in

- an item or part usage

## Can specialize, be typed by, or refer to

- a ShapeItems definition (for example RectangularCuboid, CircularCylinder, Sphere)

## What separates it from [[Item usage]]

An item usage says something exists and flows or is held. A shape item says what geometry it has. Use shapes when size and placement matter to the engineering question.

## Example

```sysml
item housing : ShapeItems::RectangularCuboid;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
