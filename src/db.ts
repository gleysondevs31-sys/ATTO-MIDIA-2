import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:ltNfCPskyOCFYCLZJDLEhJDygdRqpdhs@switchyard.proxy.rlwy.net:18922/railway";

// Create connection pool
export const pool = new pg.Pool({
  connectionString,
  ssl: connectionString.includes("railway") || connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL pool client:", err.message);
});

// Auto-bootstrap schemas on startup
export async function bootstrapDatabase() {
  console.log("[DB] Starting database auto-bootstrap...");
  const client = await pool.connect();
  try {
    // 1. Create Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(255) DEFAULT 'https://api.dicebear.com/7.x/bottts/svg?seed=zerotwo',
        bio TEXT DEFAULT 'Adoro ouvir música e baixar mídias!',
        role VARCHAR(20) DEFAULT 'user',
        theme VARCHAR(20) DEFAULT 'dark',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("[DB] 'users' table verified/created.");

    // 2. Create Favorites Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        media_id VARCHAR(100) NOT NULL,
        platform VARCHAR(20) NOT NULL,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        thumbnail TEXT NOT NULL,
        duration VARCHAR(20),
        description TEXT,
        original_url TEXT NOT NULL,
        playable_audio_url TEXT,
        playable_video_url TEXT,
        type VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_favorite UNIQUE (user_id, original_url)
      );
    `);
    console.log("[DB] 'favorites' table verified/created.");

    // 3. Create Search History Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS search_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        query TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("[DB] 'search_history' table verified/created.");

    // 4. Create Platforms Config Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS platforms_config (
        id SERIAL PRIMARY KEY,
        platform_key VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        icon_name VARCHAR(50) DEFAULT 'Music',
        primary_api_url TEXT NOT NULL,
        fallback_api_url TEXT,
        api_key_override VARCHAR(255),
        is_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("[DB] 'platforms_config' table verified/created.");

    // Seed default platforms if empty
    const platformsCount = await client.query("SELECT COUNT(*) FROM platforms_config");
    if (parseInt(platformsCount.rows[0].count) === 0) {
      console.log("[DB] Seeding default platforms into 'platforms_config'...");
      await client.query(`
        INSERT INTO platforms_config (platform_key, name, icon_name, primary_api_url, fallback_api_url) VALUES
        ('youtube', 'YouTube', 'Youtube', '/api/media/yt-download', 'https://zero-two-apis.com.br/api/dl/multidl'),
        ('soundcloud', 'Soundcloud', 'Music', 'https://zero-two-apis.com.br/api/soundcloud/search', 'https://fallback-apis.com/api/soundcloud/search'),
        ('spotify', 'Spotify', 'Music', 'https://zero-two-apis.com.br/api/spotify/search', 'https://fallback-apis.com/api/spotify/search'),
        ('tiktok', 'TikTok', 'Play', 'https://zero-two-apis.com.br/api/download/tiktok/v4', 'https://zero-two-apis.com.br/api/dl/multidl')
      `);
      console.log("[DB] Seeding completed!");
    }

    console.log("[DB] Database auto-bootstrap completed successfully!");
  } catch (error: any) {
    console.error("[DB] Database auto-bootstrap failed:", error.message);
  } finally {
    client.release();
  }
}
