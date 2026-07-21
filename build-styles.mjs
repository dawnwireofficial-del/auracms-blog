import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import fs from 'fs';
import path from 'path';

const css = fs.readFileSync('src/index.css', 'utf8');

const result = await postcss([tailwindcss()]).process(css, {
  from: 'src/index.css',
  to: 'dist/client/assets/styles.css',
});

const outDir = path.join('dist', 'client', 'assets');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'styles.css'), result.css);
console.log(`[styles] Generated ${result.css.length}B → dist/client/assets/styles.css`);
