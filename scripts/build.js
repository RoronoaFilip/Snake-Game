// Copies /src into /dist (the folder that gets deployed to GitHub Pages).
import { cpSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('../src', import.meta.url));
const dist = fileURLToPath(new URL('../dist', import.meta.url));

rmSync(dist, { recursive: true, force: true });
cpSync(src, dist, { recursive: true });
// Tell GitHub Pages not to run Jekyll on the output
writeFileSync(`${dist}/.nojekyll`, '');

console.log('Build complete -> dist/');
