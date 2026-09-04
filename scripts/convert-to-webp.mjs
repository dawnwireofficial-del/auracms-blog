import sharp from 'sharp';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';

const SOURCE_DIR = './public/images/brand-kit';
const QUALITY = 85;
const EFFORT = 6;

async function convertDirectory(dir) {
  if (!existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    return;
  }

  const files = readdirSync(dir);
  let converted = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = join(dir, file);
    const stats = statSync(filePath);

    if (stats.isDirectory()) {
      await convertDirectory(filePath);
      continue;
    }

    if (extname(file).toLowerCase() !== '.png') continue;

    const webpPath = filePath.replace('.png', '.webp');

    // Check if webp already exists and is newer
    if (existsSync(webpPath)) {
      const webpStats = statSync(webpPath);
      if (webpStats.mtime >= stats.mtime) {
        skipped++;
        continue;
      }
    }

    try {
      await sharp(filePath)
        .webp({ quality: QUALITY, effort: EFFORT })
        .toFile(webpPath);
      console.log(`✓ ${filePath} -> ${webpPath}`);
      converted++;
    } catch (err) {
      console.error(`✗ Failed to convert ${filePath}:`, err.message);
    }
  }

  console.log(`Directory ${dir}: ${converted} converted, ${skipped} skipped`);
}

async function main() {
  console.log('Starting WebP conversion...');
  await convertDirectory(SOURCE_DIR);
  console.log('WebP conversion complete!');
}

main().catch(console.error);