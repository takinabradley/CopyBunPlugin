# CopyBunPlugin
Plugin to copy files from a source path to an out path using the Bun bundler


## Installation
```
bun install @takinabradley/copybunplugin
```


## Usage

In a build file, import the CopyBunPlugin factory, and add it to the plugin list when you run `Bun.build`:
```js
// build.js in root of project
import CopyBunPlugin from '@takinabradley/copybunplugin'

Bun.build({
  entrypoints: ['src/index.js'],
  outdir: './out',
  plugins: [CopyBunPlugin({
    patterns: [
      {
        // directories must end with '/'
        // directories can only have directory path for 'to'
        // directories are copied non-recursively
        from: 'path/to/source/dir/',
        to: 'path/to/out/dir/'
      },
      {
        // files must not end with '/'
        // files can only have a file path for 'to'
        from: 'path/to/source/file',
        to: 'path/to/out/file'
      },

      // 'to' can be ommited for files and directories.
      {
        // files are copied out outdir using their original file name
        from: 'path/to/source/file.tsx' // copied to ./out/file.tsx
      },
      {
        // directory files are copied to the root of `outdir` non-recursively
        from: 'path/to/source/dir/'
      }
    ]
  })]
})
```

This project was created using `bun init` in bun v1.0.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
