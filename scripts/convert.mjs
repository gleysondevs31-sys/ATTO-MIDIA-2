import fs from 'fs';
import path from 'path';

const dir = './funcionais';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ok.js'));

if (!fs.existsSync('./src/scrapers')) {
  fs.mkdirSync('./src/scrapers', { recursive: true });
}

let exportsList = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf-8');
  // Simple heuristic: replace `module.exports = ` with `export default `
  // or `export { ` for object exports.
  
  let converted = content.replace(/module\.exports\s*=\s*/g, 'export default ');
  
  // Also some use `require`. Since we want TS/ESM, `require` inside functions usually works in Vite/tsx but might be problematic in strict ESM without createRequire.
  // We'll prepend createRequire if 'require' is used
  if (converted.includes('require(')) {
    converted = `import { createRequire } from 'module';\nconst require = createRequire(import.meta.url);\n` + converted;
  }
  
  const tsName = file.replace('.ok.js', '.ts');
  fs.writeFileSync(path.join('./src/scrapers', tsName), converted);
  
  const exportName = tsName.replace('.ts', '').replace(/[^a-zA-Z0-9]/g, '_');
  exportsList.push(`export { default as ${exportName} } from './${tsName}';`);
}

fs.writeFileSync('./src/scrapers/index.ts', exportsList.join('\n'));
console.log(`Converted ${files.length} scrapers to TypeScript!`);
