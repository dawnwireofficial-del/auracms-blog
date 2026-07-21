import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const envFile = fs.readFileSync('.env', 'utf-8');
const lines = envFile.split('\n').filter(l => l.trim() && !l.startsWith('#'));

for (const line of lines) {
  const match = line.match(/^([^=]+)="?(.*?)"?$/);
  if (match) {
    const name = match[1];
    const value = match[2];
    console.log(`Pushing ${name}...`);
    
    // Write value to temp file to avoid quoting issues in command line
    fs.writeFileSync('temp_val.txt', value);
    
    for (const env of ['production']) {
      try {
        execSync(`npx vercel env rm ${name} ${env} --yes`, { stdio: 'ignore' });
      } catch (e) {
        // Ignore if it doesn't exist
      }
      try {
        execSync(`npx vercel env add ${name} ${env} < temp_val.txt`, { stdio: 'inherit' });
      } catch (e) {
        console.error(`Failed to add ${name} to ${env}`);
      }
    }
  }
}
fs.unlinkSync('temp_val.txt');
console.log('Done!');
