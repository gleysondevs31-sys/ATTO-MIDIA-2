const fs = require("fs");
let content = fs.readFileSync("src/components/ImageBankView.tsx", "utf-8");

const galleryBtn = `
          <div className="flex items-center gap-3">
            <a href="/gallery" target="_blank" className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
              Galeria Pública &rarr;
            </a>
            <label className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl cursor-pointer flex items-center gap-2 transition-colors">
              <UploadCloud className="w-5 h-5" /> Fazer Upload
`;

content = content.replace(
  '<label className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl cursor-pointer flex items-center gap-2 transition-colors">\n            <UploadCloud className="w-5 h-5" /> Fazer Upload',
  galleryBtn
);

content = content.replace(
  '</label>\n        </div>',
  '</label>\n          </div>\n        </div>'
);

fs.writeFileSync("src/components/ImageBankView.tsx", content);
console.log("Patched ImageBankView.tsx with link");
