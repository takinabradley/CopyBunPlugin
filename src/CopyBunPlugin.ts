import type { BunPlugin, PluginBuilder } from 'bun'
import { type Dirent } from 'node:fs'
import { readdir, copyFile, mkdir } from 'node:fs/promises'

// TODO: Add mode fs.constants.COPYFILE_FICLONE to copyFile calls in Bun 1.0.3.
// Currently broken.

interface CopyBunPluginConfig {
  patterns?: CopyPluginPattern[]
}

interface CopyPluginPattern {
  from: string
  to?: string
}

function isNotExpectedError (err: unknown): boolean {
  if (err instanceof Error && err.message !== 'File or folder exists') return true
  return false
}

const filterFiles = (entries: Dirent[]): Dirent[] => entries.filter(entry => entry.isFile())

async function copyDirToOutdir (pattern: string, outdir: string): Promise<void> {
  const dirEntries = await readdir(pattern, { withFileTypes: true })
  const dirFiles = filterFiles(dirEntries)
  dirFiles.forEach(async (entry: Dirent) => {
    try {
      await copyFile(pattern + entry.name, outdir + entry.name)
    } catch (err) {
      if (isNotExpectedError(err)) console.error(`Failed to copy ${entry.name} when copying from directory ${pattern} to ${outdir}`, err)
    }
  })
}

function toFileName (path: string): string {
  const lastSlash = path.lastIndexOf('/')
  return lastSlash !== -1 ? path.slice(lastSlash + 1) : path
}

function toFolderPath (path: string): string {
  const lastSlash = path.lastIndexOf('/')
  return lastSlash !== -1 ? path.slice(0, lastSlash + 1) : path + '/'
}

export default function CopyBunPlugin (pluginConfig: CopyBunPluginConfig): BunPlugin {
  return {
    name: 'CopyBunPlugin',
    async setup (build: PluginBuilder): Promise<void> {
      // Do nothing if there's no patterns, or no outdir
      if (!pluginConfig.patterns) return
      if (!build.config.outdir) return
      // if outdir wasn't specified with a `/`, add one for god's sake.
      let outdir: string = build.config.outdir
      if (!outdir.endsWith('/')) {
        outdir = outdir + '/'
      }

      // This is all very async, and I'm not waiting around to babysit.
      // Try not to bombard fs with multiple requests to copy/write the same
      // things
      // const patterns = removeDuplicatePatterns(pluginConfig.patterns)

      pluginConfig.patterns.forEach(async (pattern: CopyPluginPattern): Promise<void> => {
        // If copying directories to other directories...
        if (pattern.from.endsWith('/')) {
          // attempt to make the 'to' directory:
          try {
            await mkdir(pattern.to || outdir, { recursive: true })
          } catch (err) {
            if (isNotExpectedError(err)) {
              console.error(`Failed to create directory ${pattern.to || outdir} when trying to copy from ${pattern.from}`, err)
              return
            }
          }

          // attempt to copy the 'from' directory to it
          try {
            await copyDirToOutdir(pattern.from, pattern.to || outdir)
          } catch (err) {
            if (isNotExpectedError(err)) console.error(`Attempted to read dir ${pattern.from} when copying to ${pattern.to || outdir}, and failed.`, err)
          }

          return
        }

        // If copying files somewhere under another file name....

        // Attempt to create the parent directory for the new file
        try {
          await mkdir(toFolderPath(pattern.to || outdir), { recursive: true })
        } catch (err) {
          if (isNotExpectedError(err)) {
            console.error(`Failed to create directory ${toFolderPath(pattern.to || outdir)} when trying to copy file ${pattern.from} to ${toFolderPath(pattern.to || outdir)}`, err)
            return
          }
        }

        // attempt to copy the file to the new file
        try {
          await copyFile(pattern.from, pattern.to || outdir + toFileName(pattern.from))
        } catch (err) {
          if (isNotExpectedError(err)) console.error(`failed to copy file ${pattern.from} to ${pattern.to || outdir + toFileName(pattern.from)}`, err)
        }
      })
    }
  }
}
