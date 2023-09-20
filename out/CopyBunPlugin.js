// src/CopyBunPlugin.ts
var {readdir, copyFile, constants: fsConstants, mkdir} = (()=>({}));
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
      await copyFile(pattern + entry.name, outdir + entry.name, fsConstants.COPYFILE_FICLONE);
    } catch (err) {
      if (isNotExpectedError(err))
        console.error(`Failed to copy ${entry.name} when copying from ${pattern} to ${outdir}`, err);
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
            if (isNotExpectedError(err))
              console.error(`Directory ${pattern.to || outdir} already exists!`);
          }
          try {
            await copyDirToOutdir(pattern.from, pattern.to || outdir);
          } catch (err) {
            if (isNotExpectedError(err))
              console.error(`Attempted to read dir ${pattern.from}, and failed.`, err);
          }
          return;
        }
        try {
          await mkdir(toFolderName(pattern.to || outdir), { recursive: true });
        } catch (err) {
          if (isNotExpectedError(err))
            console.error(`Directory ${toFolderName(pattern.to || outdir)} already exists!`);
        }
        try {
          await copyFile(pattern.from, pattern.to || outdir + toFileName(pattern.from), fsConstants.COPYFILE_FICLONE);
        } catch (err) {
          if (isNotExpectedError(err))
            console.error(`failed to copy file ${pattern.from} to ${pattern.to || outdir}`, err);
        }
      });
    }
  };
}
export {
  CopyBunPlugin as default
};
