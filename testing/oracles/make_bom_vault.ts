/* Test helper (D-0146): prints a small imported BOM vault as JSON for the Workbench plugin oracles. */
import { readFileSync } from "node:fs";
import { buildBom, parseDelimited } from "../../tools/importer/src/bom.ts";
const classes = JSON.parse(readFileSync(new URL("../../tools/core/src/classes.json", import.meta.url),"utf8"));
const HEAD = "Parent Part Number\tParent CL1\tParent CL2\tParent Part Name\tParent Source\tParent State\tLinenumber\tChild Part Number\tChild CL1\tChild CL2\tChild Name\tChild Source\tChild State\tSSC\tReference Designator\tCild Notes\tFrom\tTO\tAmount\tUnit\tParent Rev";
const row = (n: number, pn: string, name: string) => ["TOP-1","-A","01","TOP ASSEMBLY","make","PRODUCTION",String(n),pn,"-A","01",name,"buy","PRODUCTION","","","","","","1","ea","TOP-1-A01"].join("\t");
const names = ["SCREW MACH 8-32","WIDGET TURBO","WIDGET DELUXE","WIDGET SCREW M4","GIZMO ONE"];
const r = buildBom(parseDelimited([HEAD, ...names.map((x,i)=>row(i+1,"P"+(i+1),x))].join("\n")), { sourceName:"b.tsv", fingerprint:"a".repeat(64), runDate:"2026-11-08T10:00:00", authorCode:"skellyspencer", classes, existing:null, pending:[], revisionNotes:true } as any);
console.log(JSON.stringify(Object.fromEntries(r.files.filter((f:any)=>f.path.endsWith(".md")).map((f:any)=>[f.path,f.content]))));
