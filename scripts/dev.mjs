// Dev server: esbuild watch + serve. http://localhost:5180 (serves game/, bundles src/main.js in memory)
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 5180);

if (!fs.existsSync(path.join(root, 'game', 'data', 'grammar.json'))) {
  console.log('game/data missing: run `npm run data` first');
  process.exit(1);
}

const ctx = await esbuild.context({
  entryPoints: [path.join(root, 'game', 'src', 'main.js')],
  bundle: true,
  format: 'iife',
  target: ['chrome87', 'safari15'],
  sourcemap: 'inline',
  define: { __DEV__: 'true', __VERSION__: '"dev"' },
  outfile: path.join(root, 'game', 'game.js'),
  write: false,
  logLevel: 'info',
});
await ctx.watch();
await ctx.serve({ servedir: path.join(root, 'game'), port, host: '0.0.0.0' });
console.log(`dev server: http://localhost:${port}/`);
