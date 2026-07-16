const fs = require("fs");
let content = fs.readFileSync("src/components/PartnersView.tsx", "utf-8");

content = content.replace(
  '  const fetchPartners = () => {',
  '  const fetchPartners = () => {\n    fetch("/api/partners")\n      .then(async r => {\n        if (!r.ok) return { success: false };\n        try { return await r.json(); } catch(e) { return { success: false }; }\n      })\n      .then(d => {\n        if (d && d.success) setDbPartners(d.partners || []);\n      })\n      .catch(console.error);\n    return;'
);

content = content.replace(
  '.then(r => r.json())',
  ''
);

content = content.replace(
  '.then(d => {',
  ''
);

content = content.replace(
  'if (d.success) setDbPartners(d.partners);',
  ''
);

content = content.replace(
  '});',
  ''
);

fs.writeFileSync("src/components/PartnersView.tsx", content);
