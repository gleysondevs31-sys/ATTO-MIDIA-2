const fs = require("fs");
let content = fs.readFileSync("src/components/ImageBankView.tsx", "utf-8");

const oldCode = `                const data = await res.json();
                if (data.success) {
                  setImages(prev => [data.url, ...prev]);
                }`;

const newCode = `                const data = await res.json();
                if (data.success) {
                  setImages(prev => [data.url, ...prev]);
                  const fullUrl = window.location.origin + data.url;
                  navigator.clipboard.writeText(fullUrl).catch(() => {});
                  alert("Upload concluído! Link público copiado: " + fullUrl);
                }`;

content = content.replace(oldCode, newCode);
fs.writeFileSync("src/components/ImageBankView.tsx", content);
console.log("Patched ImageBankView.tsx upload logic");
