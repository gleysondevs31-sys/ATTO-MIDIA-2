const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf-8");

const partnersApi = `
// --- Partners API ---
app.get("/api/partners", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM partners ORDER BY created_at DESC');
    res.json({ success: true, partners: result.rows });
  } catch (error) {
    console.error("[Partners API] Error fetching partners:", error);
    res.status(500).json({ success: false, message: "Erro ao buscar parceiros." });
  }
});

app.post("/api/partners", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, role, description, link_url, icon_url } = req.body;
    const result = await pool.query(
      'INSERT INTO partners (name, role, description, link_url, icon_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, role, description, link_url, icon_url]
    );
    res.json({ success: true, partner: result.rows[0] });
  } catch (error) {
    console.error("[Partners API] Error adding partner:", error);
    res.status(500).json({ success: false, message: "Erro ao adicionar parceiro." });
  }
});

app.delete("/api/partners/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM partners WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("[Partners API] Error deleting partner:", error);
    res.status(500).json({ success: false, message: "Erro ao remover parceiro." });
  }
});

`;

content = content.replace('async function startServer() {', partnersApi + 'async function startServer() {');

fs.writeFileSync("server.ts", content);
console.log("Patched server.ts with Partners API");
