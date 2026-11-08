// Build the shared app with webpack 5 and fail on errors (and, with
// --no-warnings, on warnings). webpack reports an unresolvable import() inside
// try as a warning: that is how an optional peer that is not installed shows up.
import webpack from 'webpack'
import { resolve } from 'node:path'

const allowWarnings = !process.argv.includes('--no-warnings')
const compiler = webpack({
  mode: 'production',
  entry: resolve('src/main.tsx'),
  output: { path: resolve('out') },
  performance: { hints: false },
  resolve: { extensions: ['.tsx', '.ts', '.js'] },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'esbuild-loader', options: { jsx: 'automatic', target: 'es2022' } },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  }
})
compiler.run((error, stats) => {
  if (error) { console.error(error); process.exit(1) }
  const { errors = [], warnings = [] } = stats.toJson({ all: false, errors: true, warnings: true })
  for (const e of errors) console.error('ERROR', e.moduleName ?? '', e.message.split('\n')[0])
  for (const w of warnings) console.warn('WARNING', w.moduleName ?? '', w.message.split('\n')[0])
  console.log(`webpack: ${errors.length} errors, ${warnings.length} warnings`)
  compiler.close(() => process.exit(errors.length > 0 || (!allowWarnings && warnings.length > 0) ? 1 : 0))
})
