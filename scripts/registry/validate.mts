import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { descriptors } from "./descriptors.mts";

const root = resolve(import.meta.dirname, "../..");

function exportedProps(source: string) {
  const result = new Set<string>();
  const propsBlock = /(?:export )?interface [A-Za-z]+Props[^\{]*\{([\s\S]*?)^}/gm;
  for (const match of source.matchAll(propsBlock)) {
    for (const prop of match[1].matchAll(/^\s*([A-Za-z][A-Za-z0-9]*)\??\s*:/gm)) result.add(prop[1]);
  }
  if (source.includes("export type MagneticButtonProps") && /type AnchorProps[\s\S]*?href\??\s*:/m.test(source)) result.add("href");
  return result;
}

const failures: string[] = [];
for (const descriptor of descriptors) {
  const source = readFileSync(resolve(root, descriptor.sourceFile), "utf8");
  const exported = exportedProps(source);
  for (const [name] of descriptor.props) {
    if (!exported.has(name)) failures.push(`${descriptor.slug}: documented prop ${name} is not exported by its Props type`);
  }
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}