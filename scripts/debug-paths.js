import { readdirSync, existsSync } from 'fs';
import { resolve } from 'path';

console.log('cwd:', process.cwd());
console.log('dirname:', import.meta.dirname);
console.log('home:', process.env.HOME);

// Check various locations
const dirs = ['/', '/home', '/home/user', process.cwd(), import.meta.dirname, resolve(import.meta.dirname, '..')];
for (const d of dirs) {
  try {
    const files = readdirSync(d).filter(f => f.endsWith('.html') || f === 'scripts');
    if (files.length > 0) console.log(`${d}:`, files);
  } catch(e) {
    console.log(`${d}: ERROR -`, e.message);
  }
}
