import fs from 'node:fs';
import path from 'node:path';

const workDir = 'g:\\Anish Project\\apoorvpatelphotography\\Work';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push({
        path: fullPath,
        relPath: path.relative(workDir, fullPath),
        size: fs.statSync(fullPath).size,
        ext: path.extname(item.name).toLowerCase(),
        name: item.name
      });
    }
  }
  return results;
}

const files = walk(workDir);
console.log(`Total files: ${files.length}`);

const extCounts = {};
for (const f of files) {
  extCounts[f.ext] = (extCounts[f.ext] || 0) + 1;
}
console.log('Extension counts:', JSON.stringify(extCounts, null, 2));

// Group by top-level and subfolder
const folderStats = {};
for (const f of files) {
  const dir = path.dirname(f.relPath);
  if (!folderStats[dir]) {
    folderStats[dir] = { count: 0, size: 0, exts: new Set(), files: [] };
  }
  folderStats[dir].count++;
  folderStats[dir].size += f.size;
  folderStats[dir].exts.add(f.ext);
  folderStats[dir].files.push(f);
}

const summary = Object.keys(folderStats).map(dir => ({
  folder: dir,
  count: folderStats[dir].count,
  sizeMB: (folderStats[dir].size / (1024 * 1024)).toFixed(2),
  exts: Array.from(folderStats[dir].exts)
}));

console.log('Folder summary:', JSON.stringify(summary, null, 2));
