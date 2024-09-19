/*
builds chrome and firefox extensions in dist folder

two different extensions are required because firefox and chrome manifests are incompatible (same manifest version, different schemes for the "background" key)
*/

import { cp, glob, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { chdir } from "node:process";

/*
 * Settings
 */
const browsers = ["chrome", "firefox"];
const manifestFile = "manifest.json";
const distFolder = "dist";
const srcFolder = "src";

/* 
Setup
*/
// clean

const cwd = process.cwd();

try {
  await rm(path.join(cwd, distFolder), { recursive: true });
} catch (err) {
  // be silent when the directory not exists
}

// load manifest.json
const manifestPath = path.join(cwd, srcFolder, manifestFile);
const manifest = JSON.parse(await readFile(manifestPath));

// create a folder for each broewser
browsers.forEach(async (browser) => {
  const distPath = path.join(cwd, distFolder, browser);
  await mkdir(distPath, { recursive: true });

  const patchPath = path.join(
    cwd,
    srcFolder,
    `${path.basename(
      manifestFile,
      path.extname(manifestFile)
    )}-patch-${browser}${path.extname(manifestFile)}`
  );
  const patch = JSON.parse(await readFile(patchPath));

  // simple patch: for each patched key overwrites original value with the value from patch
  const manifestPatched = manifest;
  for (const [key, value] of Object.entries(patch)) {
    manifestPatched[key] = value;
  }

  const patchedPath = path.join(distPath, manifestFile);
  await writeFile(patchedPath, JSON.stringify(manifestPatched, null, 2));

  // deep copy the rest
  chdir(path.join(cwd, srcFolder));
  const pathIterator = glob("*");

  for await (const srcPath of pathIterator) {
    if (
      srcPath.startsWith(
        path.basename(manifestFile, path.extname(manifestFile))
      ) &&
      srcPath.endsWith(path.extname(manifestFile))
    ) {
      continue;
    }
    await cp(srcPath, path.join(distPath, srcPath), { recursive: true });
  }
});
