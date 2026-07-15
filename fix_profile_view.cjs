const fs = require("fs");
let content = fs.readFileSync("src/components/ProfileView.tsx", "utf-8");

content = content.replace(
    /user: \{\s*id\?: number;[\s\S]*?badges\?: string;\s*\};\s*id: number;\s*username: string;\s*email: string;\s*avatar: string;\s*bio: string;\s*role: string;\s*theme: string;\s*created_at\?: string;\s*plan\?: string;\s*coins\?: number;\s*\};/m,
    `user: {
    id?: number;
    username: string;
    email: string;
    avatar: string;
    bio: string;
    role: string;
    theme: string;
    created_at?: string;
    plan?: string;
    coins?: number;
    is_verified?: boolean;
    avatar_frame?: string;
    badges?: string;
  };`
);

fs.writeFileSync("src/components/ProfileView.tsx", content);
console.log("Fixed ProfileView.tsx interface");
