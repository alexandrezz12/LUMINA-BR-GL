import fs from 'fs';
import path from 'path';

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('font-serif')) {
        content = content.replace(/font-serif /g, '');
        content = content.replace(/ font-serif/g, '');
        content = content.replace(/font-serif/g, '');
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}
walk('./src');
