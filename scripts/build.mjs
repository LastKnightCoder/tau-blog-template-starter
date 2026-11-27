import { lstat, readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { build } from "vite";
import AdmZip from "adm-zip";

const LOCALIZED_README_PATTERN = /^README\.([A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*)\.md$/;

async function copyLocalizedReadmes(sourceDir, targetDir) {
  const seen = new Set();
  const entries = (await readdir(sourceDir, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  for (const entry of entries) {
    const match = LOCALIZED_README_PATTERN.exec(entry.name);
    if (!match) continue;
    const sourcePath = path.join(sourceDir, entry.name);
    const stat = await lstat(sourcePath);
    if (stat.isSymbolicLink() || !stat.isFile())
      throw new Error(`多语言说明文档必须是普通文件，不能是符号链接：${entry.name}`);
    let locale;
    try {
      locale = new Intl.Locale(match[1]).toString();
    } catch {
      throw new Error(`多语言说明文档包含无效的语言标识：${entry.name}`);
    }
    if (seen.has(locale))
      throw new Error(`多语言说明文档包含重复的语言标识：${locale}（${entry.name}）`);
    const content = await readFile(sourcePath, "utf8");
    if (!content.trim()) throw new Error(`${entry.name} 必须包含插件介绍与使用说明`);
    seen.add(locale);
    await writeFile(path.join(targetDir, `README.${locale}.md`), content);
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { siteFields, i18n, catalogI18n, ...identity } = JSON.parse(
  await readFile(path.join(root, "template.json"), "utf8")
);
await build({ root });
for (const relative of new Set(Object.values(i18n?.resources ?? {}))) {
  const target = path.join(root, "dist/site", relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, await readFile(path.join(root, relative)));
}
const integrity = {};
async function walk(directory, prefix = "") {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name)
  )) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) await walk(path.join(directory, entry.name), relative + "/");
    else
      integrity["site/" + relative] = createHash("sha256")
        .update(await readFile(path.join(directory, entry.name)))
        .digest("hex");
  }
}
await walk(path.join(root, "dist/site"));
const manifest = {
  formatVersion: 1,
  apiVersion: 1,
  platform: "desktop",
  ...identity,
  ...(catalogI18n ? { i18n: catalogI18n } : {}),
  template: {
    protocolVersion: 1,
    root: "site",
    entries: ["index.html"],
    ...(siteFields ? { siteFields } : {}),
    ...(i18n ? { i18n } : {}),
  },
  integrity,
};
await writeFile(path.join(root, "dist/manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
await writeFile(path.join(root, "dist/README.md"), await readFile(path.join(root, "README.md")));
await copyLocalizedReadmes(root, path.join(root, "dist"));
const zip = new AdmZip();
zip.addLocalFolder(path.join(root, "dist"), identity.id);
await mkdir(path.join(root, "output"), { recursive: true });
const bytes = zip.toBuffer();
await writeFile(path.join(root, "output", `${identity.id}-${identity.version}.zip`), bytes);
console.log(
  JSON.stringify({ id: identity.id, files: Object.keys(integrity).length, zipBytes: bytes.length })
);
