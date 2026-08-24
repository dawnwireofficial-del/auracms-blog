// Fixes mysql-adapter.ts: removes the premature class-closing brace so all
// methods live inside the class. The class-closing brace is a line that is
// exactly "}" (column 0). Keep only the LAST one; drop earlier ones.
const fs = require('fs');
const p = 'server/db/mysql-adapter.ts';
const lines = fs.readFileSync(p, 'utf8').split('\n');

// Find all lines that are exactly "}"
const closes = [];
lines.forEach((l, i) => { if (l.trim() === '}' && !l.startsWith(' ')) closes.push(i); });
console.log('column-0 closing braces at lines:', closes.map(i => i + 1).join(', '));

if (closes.length <= 1) {
  console.log('No premature close found — file may already be OK');
  process.exit(0);
}

// Drop every column-0 "}" except the last one
const keep = new Set(closes.slice(-1));
const fixed = lines.filter((l, i) => !(closes.includes(i) && !keep.has(i)));

fs.writeFileSync(p, fixed.join('\n'));
console.log('Removed', closes.length - 1, 'premature closing brace(s). New line count:', fixed.length);
