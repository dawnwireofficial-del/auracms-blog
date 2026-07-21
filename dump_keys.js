const d = require('./data/db.json').posts; 
const keys = new Set(); 
d.forEach(p => Object.keys(p).forEach(k => keys.add(k))); 
console.log(Array.from(keys).map(k => '"' + k + '" TEXT').join(', '));
