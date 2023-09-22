// @bun
// src/CopyBunPlugin.ts
import {readdir, copyFile, mkdir} from "fs/promises";
var isNotExpectedError = function(err) {
  if (err instanceof Error && err.message !== "File or folder exists")
    return true;
  return false;
};
async function copyDirToOutdir(pattern, outdir) {
  const dirEntries = await readdir(pattern, { withFileTypes: true });
  const dirFiles = filterFiles(dirEntries);
  dirFiles.forEach(async (entry) => {
    try {
      await copyFile(pattern + entry.name, outdir + entry.name);
    } catch (err) {
      if (isNotExpectedError(err))
        console.error(`Failed to copy ${entry.name} when copying from directory ${pattern} to ${outdir}`, err);
    }
  });
}
var toFileName = function(path) {
  const lastSlash = path.lastIndexOf("/");
  return lastSlash !== -1 ? path.slice(lastSlash + 1) : path;
};
var toFolderName = function(path) {
  const lastSlash = path.lastIndexOf("/");
  return lastSlash !== -1 ? path.slice(0, lastSlash + 1) : path + "/";
};
var filterFiles = (entries) => entries.filter((entry) => entry.isFile());
function CopyBunPlugin(pluginConfig) {
  return {
    name: "CopyBunPlugin",
    async setup(build) {
      if (!pluginConfig.patterns)
        return;
      if (!build.config.outdir)
        return;
      let outdir = build.config.outdir;
      if (!outdir.endsWith("/")) {
        outdir = outdir + "/";
      }
      pluginConfig.patterns.forEach(async (pattern) => {
        if (pattern.from.endsWith("/")) {
          try {
            await mkdir(pattern.to || outdir, { recursive: true });
          } catch (err) {
            if (isNotExpectedError(err)) {
              console.error(`Failed to create directory ${pattern.to || outdir} when trying to copy from ${pattern.from}`, err);
              return;
            }
          }
          try {
            await copyDirToOutdir(pattern.from, pattern.to || outdir);
          } catch (err) {
            if (isNotExpectedError(err))
              console.error(`Attempted to read dir ${pattern.from} when copying to ${pattern.to || outdir}, and failed.`, err);
          }
          return;
        }
        try {
          await mkdir(toFolderName(pattern.to || outdir), { recursive: true });
        } catch (err) {
          if (isNotExpectedError(err)) {
            console.error(`Failed to create directory ${toFolderName(pattern.to || outdir)} when trying to copy file ${pattern.from} to ${toFolderName(pattern.to || outdir)}`, err);
            return;
          }
        }
        try {
          await copyFile(pattern.from, pattern.to || outdir + toFileName(pattern.from));
        } catch (err) {
          if (isNotExpectedError(err))
            console.error(`failed to copy file ${pattern.from} to ${pattern.to || outdir + toFileName(pattern.from)}`, err);
        }
      });
    }
  };
}
export {
  CopyBunPlugin as default
};
