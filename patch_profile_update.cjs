const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf-8");

content = content.replace(
    'const { username, avatar, bio, theme } = req.body;',
    'const { username, avatar, bio, theme, avatar_frame } = req.body;'
);

content = content.replace(
    'theme = COALESCE($4, theme)\n        WHERE id = $5',
    'theme = COALESCE($4, theme),\n            avatar_frame = COALESCE($5, avatar_frame)\n        WHERE id = $6'
);

content = content.replace(
    'RETURNING id, username, email, avatar, bio, role, theme, plan, coins, plan_expires_at, created_at',
    'RETURNING id, username, email, avatar, bio, role, theme, plan, coins, plan_expires_at, created_at, avatar_frame, badges'
);

content = content.replace(
    'avatar ? avatar.trim() : null,\n        bio ? bio.trim() : null,\n        theme ? theme.trim() : null,\n        authReq.user.id\n      ]',
    'avatar ? avatar.trim() : null,\n        bio ? bio.trim() : null,\n        theme ? theme.trim() : null,\n        avatar_frame ? avatar_frame.trim() : null,\n        authReq.user.id\n      ]'
);

// We also need to fix the GET /api/auth/profile and /api/auth/login to return avatar_frame and badges
content = content.replace(
    /RETURNING id, username, email, avatar, bio, role, theme, plan, coins, plan_expires_at, is_verified/g,
    'RETURNING id, username, email, avatar, bio, role, theme, plan, coins, plan_expires_at, is_verified, avatar_frame, badges'
);

content = content.replace(
    /SELECT id, username, email, avatar, bio, role, theme, plan, coins, plan_expires_at, is_verified/g,
    'SELECT id, username, email, avatar, bio, role, theme, plan, coins, plan_expires_at, is_verified, avatar_frame, badges'
);

// In /api/auth/profile GET
content = content.replace(
    'SELECT id, username, email, avatar, bio, role, theme, plan, coins, plan_expires_at, created_at\n      FROM users',
    'SELECT id, username, email, avatar, bio, role, theme, plan, coins, plan_expires_at, created_at, avatar_frame, badges\n      FROM users'
);

fs.writeFileSync("server.ts", content);
console.log("Successfully patched server.ts profile endpoints");
