import fs from 'fs';
import path from 'path';

const serverFile = './server.ts';
let content = fs.readFileSync(serverFile, 'utf-8');

const apiBlock = `
  // --- Dynamic Scrapers API ---
  app.get("/api/scrapers", async (req, res) => {
    try {
      const files = fs.readdirSync(path.join(process.cwd(), "src/scrapers"));
      const scrapersList = files
        .filter(f => f.endsWith(".ts") && f !== "index.ts")
        .map(f => f.replace(".ts", ""));
        
      const scrapersData = [];
      
      for (const name of scrapersList) {
        const scraperPath = path.join(process.cwd(), "src/scrapers", name + ".ts");
        let methods = [];
        let type = "unknown";
        
        try {
          const moduleUrl = "file://" + scraperPath;
          const imported = await import(moduleUrl);
          const ScraperExport = imported.default || imported;
          
          if (typeof ScraperExport === 'function') {
            try {
              // Check if class
              if (ScraperExport.toString().startsWith('class')) {
                type = "class";
                const props = Object.getOwnPropertyNames(ScraperExport.prototype);
                methods = props.filter(p => p !== 'constructor');
              } else {
                type = "function";
                methods = [ScraperExport.name || 'default'];
              }
            } catch(e) {}
          } else if (typeof ScraperExport === 'object') {
            type = "object";
            methods = Object.keys(ScraperExport).filter(k => typeof ScraperExport[k] === 'function');
          }
        } catch(e) {
           methods = ["error_loading"];
        }
        
        scrapersData.push({
          name,
          type,
          methods
        });
      }
        
      res.json({ success: true, count: scrapersData.length, scrapers: scrapersData });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Failed to list scrapers" });
    }
  });

  app.all("/api/scrapers/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const scraperPath = path.join(process.cwd(), "src/scrapers", name + ".ts");
      if (!fs.existsSync(scraperPath)) {
        return res.status(404).json({ success: false, error: "Scraper not found" });
      }
      
      const moduleUrl = "file://" + scraperPath;
      const imported = await import(moduleUrl);
      const ScraperExport = imported.default || imported;
      
      let result;
      const args = req.method === 'GET' ? req.query : req.body;
      
      if (typeof ScraperExport === 'function') {
        if (ScraperExport.toString().startsWith('class')) {
           const instance = new ScraperExport();
           if (args.method && typeof instance[args.method] === 'function') {
              const methodArgs = args.args ? (Array.isArray(args.args) ? args.args : [args.args]) : [];
              result = await instance[args.method](...methodArgs);
           } else {
              result = instance;
           }
        } else {
           const methodArgs = args.args ? (Array.isArray(args.args) ? args.args : [args.args]) : [];
           result = await ScraperExport(...methodArgs);
        }
      } else if (typeof ScraperExport === 'object') {
         if (args.method && typeof ScraperExport[args.method] === 'function') {
            const methodArgs = args.args ? (Array.isArray(args.args) ? args.args : [args.args]) : [];
            result = await ScraperExport[args.method](...methodArgs);
         } else {
            result = ScraperExport;
         }
      }
      
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Scraper Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to execute scraper" });
    }
  });
  // -----------------------------
`;

content = content.replace(/\/\/ --- Dynamic Scrapers API ---[\s\S]*?\/\/ -----------------------------/, apiBlock.trim());
fs.writeFileSync(serverFile, content);
console.log("Updated server.ts with rich scrapers API");
