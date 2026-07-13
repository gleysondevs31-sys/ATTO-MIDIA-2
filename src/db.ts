import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:ltNfCPskyOCFYCLZJDLEhJDygdRqpdhs@switchyard.proxy.rlwy.net:18922/railway";

const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1") || connectionString.includes("::1");

// Create connection pool
export const pool = new pg.Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
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
  let client;
  try {
    client = await pool.connect();
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
        plan VARCHAR(20) DEFAULT 'free',
        coins INTEGER DEFAULT 0,
        plan_expires_at TIMESTAMP,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        reset_token VARCHAR(255),
        reset_token_expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key VARCHAR(255) UNIQUE;
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

    // 5. Create Gift Cards Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gift_cards (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        type VARCHAR(20) NOT NULL, -- 'coins', 'pro', 'ultra', 'premium'
        value INTEGER, -- amount of coins or duration in days
        max_uses INTEGER DEFAULT 1,
        uses INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("[DB] 'gift_cards' table verified/created.");

    // 6. Create Gift Card Redemptions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gift_card_redemptions (
        id SERIAL PRIMARY KEY,
        gift_card_id INTEGER NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_redemption UNIQUE (gift_card_id, user_id)
      );
    `);
    console.log("[DB] 'gift_card_redemptions' table verified/created.");

    // 7. Create Banners Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        link_url TEXT,
        type VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'success', 'error', 'promo'
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("[DB] 'banners' table verified/created.");

    // Seed default platforms if empty
    const platformsCount = await client.query("SELECT COUNT(*) FROM platforms_config");
    if (parseInt(platformsCount.rows[0].count) === 0) {
      console.log("[DB] Seeding default platforms into 'platforms_config'...");
      await client.query(`
        INSERT INTO platforms_config (platform_key, name, icon_name, primary_api_url, fallback_api_url) VALUES
        ('youtube', 'YouTube', 'Youtube', '/api/media/yt-download', 'https://yt-api.zero-two-apis.store/api/dl/multidl'),
        ('soundcloud', 'Soundcloud', 'Music', 'https://zero-two-apis.store/api/soundcloud/search', 'https://fallback-apis.com/api/soundcloud/search'),
        ('spotify', 'Spotify', 'Music', 'https://zero-two-apis.store/api/spotify/search', 'https://fallback-apis.com/api/spotify/search'),
        ('tiktok', 'TikTok', 'Play', 'https://zero-two-apis.store/api/download/tiktok/v4', 'https://zero-two-apis.store/api/dl/multidl')
      `);
      console.log("[DB] Seeding completed!");
    } else {
      // Ensure existing deployments get updated to the new fast/robust YouTube API fallback URL
      await client.query(`
        UPDATE platforms_config 
        SET fallback_api_url = 'https://yt-api.zero-two-apis.store/api/dl/multidl' 
        WHERE platform_key = 'youtube' AND fallback_api_url = 'https://zero-two-apis.com.br/api/dl/multidl'
      `);
      await client.query(`
        UPDATE platforms_config
        SET primary_api_url = REPLACE(primary_api_url, '.com.br', '.store'),
            fallback_api_url = REPLACE(fallback_api_url, '.com.br', '.store')
      `);
      await client.query(`
        UPDATE platforms_config
        SET is_enabled = FALSE
        WHERE platform_key IN ('soundcloud', 'spotify')
      `);
      console.log("[DB] Existing YouTube config checked and updated. Soundcloud and Spotify disabled.");
    }

    console.log("[DB] Database auto-bootstrap completed successfully!");
  } catch (error: any) {
    console.error("[DB] Database auto-bootstrap failed:", error.message);
  } finally {
    if (client) {
      client.release();
    }
  }
}
