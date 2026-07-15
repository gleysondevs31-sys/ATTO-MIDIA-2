const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf-8");

const rankingEndpoint = `
// Community Ranking
app.get("/api/community/ranking", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, avatar, bio, coins, is_verified FROM users ORDER BY coins DESC LIMIT 50"
    );
    res.json({ success: true, users: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erro ao buscar ranking" });
  }
});
`;

if (!content.includes("/api/community/ranking")) {
    content = content.replace(
        'app.get("/api/platforms"',
        rankingEndpoint + '\napp.get("/api/platforms"'
    );
    fs.writeFileSync("server.ts", content);
    console.log("Patched server.ts with community API");
}
