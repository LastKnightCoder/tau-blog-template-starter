import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { build } from "vite";
import AdmZip from "adm-zip";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const identity = JSON.parse(await readFile(path.join(root, "template.json"), "utf8"));
await build({ root });
const integrity = {};
async function walk(directory, prefix = "") {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) await walk(path.join(directory, entry.name), relative + "/");
    else integrity["site/" + relative] = createHash("sha256").update(await readFile(path.join(directory, entry.name))).digest("hex");
  }
}
await walk(path.join(root, "dist/site"));
const manifest = { formatVersion: 1, apiVersion: 1, platform: "desktop", ...identity, template: { protocolVersion: 1, root: "site", entries: ["index.html"] }, integrity };
await writeFile(path.join(root, "dist/manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
await writeFile(path.join(root, "dist/README.md"), await readFile(path.join(root, "README.md")));
const zip = new AdmZip();
zip.addLocalFolder(path.join(root, "dist"), identity.id);
await mkdir(path.join(root, "output"), { recursive: true });
const bytes = zip.toBuffer();
await writeFile(path.join(root, "output", `${identity.id}-${identity.version}.zip`), bytes);
console.log(JSON.stringify({ id: identity.id, files: Object.keys(integrity).length, zipBytes: bytes.length }));
