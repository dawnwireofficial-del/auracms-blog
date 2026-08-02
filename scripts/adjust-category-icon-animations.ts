import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const dir = join(process.cwd(), 'public', 'icons', 'categories');

const EASE = `calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"`;

for (const file of readdirSync(dir).filter((f) => f.endsWith('.svg'))) {
  const path = join(dir, file);
  let svg = readFileSync(path, 'utf8');

  // 1. Wrap the icon in a breathing group with a gentle scale animation.
  svg = svg.replace(
    /(<image [^>]*x="46" y="46" width="420" height="420" preserveAspectRatio="xMidYMid meet"\/>)/,
    `    <g class="icon-breathe">\n      $1\n      <animateTransform attributeName="transform" type="scale" values="1;1.018;1" dur="6.8s" begin="-0.9s" repeatCount="indefinite" ${EASE}/>\n    </g>`,
  );

  // 2. Smooth the float with ease-in-out spline easing (slightly slower, more natural).
  svg = svg.replace(
    /<animateTransform attributeName="transform" type="translate" values="0 0;0 -8;0 0" dur="3.6s" begin="([^"]*)" repeatCount="indefinite"\/>/,
    `<animateTransform attributeName="transform" type="translate" values="0 0;0 -9;0 0" dur="4.8s" begin="$1" repeatCount="indefinite" ${EASE}/>`,
  );

  // 3. Ease the micro-particle motion (cy/cx and opacity) with spline easing.
  svg = svg.replace(
    /<animate attributeName="(cy|cx|opacity)" values="([^"]+)" dur="([^"]+)"( begin="([^"]*)")? repeatCount="indefinite"\/>/g,
    (m, attr, vals, dur, _b, begin) => {
      const beginAttr = begin ? ` begin="${begin}"` : '';
      return `<animate attributeName="${attr}" values="${vals}" dur="${dur}"${beginAttr} repeatCount="indefinite" ${EASE}/>`;
    },
  );

  // 4. Register the breathe group for centered scaling.
  svg = svg.replace(
    '.orbit-layer { transform-box: fill-box; transform-origin: center; }',
    '.orbit-layer { transform-box: fill-box; transform-origin: center; }\n    .icon-breathe { transform-box: fill-box; transform-origin: center; }',
  );

  writeFileSync(path, svg, 'utf8');
  console.log(`patched ${file}`);
}
