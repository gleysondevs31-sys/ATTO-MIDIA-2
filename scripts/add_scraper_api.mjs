import fs from 'fs';
import path from 'path';

const serverFile = './server.ts';
let content = fs.readFileSync(serverFile, 'utf-8');

const apiBlock = `
  // --- Dynamic Scrapers API ---
  app.get("/api/scrapers", (req, res) => {
    try {
      const files = fs.readdirSync(path.join(process.cwd(), "src/scrapers"));
      const scrapers = files
        .filter(f => f.endsWith(".ts") && f !== "index.ts")
        .map(f => f.replace(".ts", ""));
      res.json({ success: true, count: scrapers.length, scrapers });
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
      
      // Attempt to instantiate if it's a class, or call if it's a function
      let result;
      const args = req.method === 'GET' ? req.query : req.body;
      
      if (typeof ScraperExport === 'function') {
        try {
           const instance = new ScraperExport();
           result = instance;
        } catch (e) {
           result = await ScraperExport(args);
        }
      } else if (typeof ScraperExport === 'object') {
         result = ScraperExport;
      }
      
      // If we just got an instance/object, and they passed a 'method' parameter, try to call it
      if (result && typeof result === 'object' && args.method && typeof result[args.method] === 'function') {
         const methodArgs = args.args ? (Array.isArray(args.args) ? args.args : [args.args]) : [];
         result = await result[args.method](...methodArgs);
      }
      
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Scraper Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to execute scraper" });
    }
  });
  // -----------------------------
`;

// Insert right before Vite middleware or app.listen
const listenMatch = /if \(process\.env\.NODE_ENV !== "production"\) {/g;
const index = content.search(listenMatch);

if (index !== -1) {
  content = content.slice(0, index) + apiBlock + content.slice(index);
  fs.writeFileSync(serverFile, content);
  console.log("Injected scraper APIs into server.ts");
} else {
  console.log("Could not find insertion point.");
}
