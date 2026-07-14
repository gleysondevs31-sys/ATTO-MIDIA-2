import fs from 'fs';
const file = './src/components/Sidebar.tsx';
let content = fs.readFileSync(file, 'utf-8');

content = content.replace(
  'id="btn-nav-api-docs"\n              onClick={() => handleSelectNav("scrapers")}',
  'id="btn-nav-api-docs"\n              onClick={() => handleSelectNav("api-docs")}'
);

fs.writeFileSync(file, content);
console.log("Fixed sidebar");
