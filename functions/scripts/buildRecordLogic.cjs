const path = require('node:path')
const { createRequire } = require('node:module')

const project = path.resolve(__dirname, '../..')
const requireFromProject = createRequire(path.join(project, 'package.json'))
const esbuild = requireFromProject('esbuild')
esbuild.buildSync({
  stdin: {
    contents: [
      "export { createRecordMemberResolver } from './src/apis/recordMembers.js'",
      "export { finalizeRound } from './src/apis/finalizeRound.js'",
      "export { formatDailyRecordStats } from './src/apis/formatDailyRecordStats.js'",
    ].join('\n'),
    resolveDir: project, sourcefile: 'recordLogic-entry.js',
  },
  outfile: path.resolve(__dirname, '../lib/recordLogic.cjs'),
  bundle: true, platform: 'node', target: 'node22', format: 'cjs',
})
