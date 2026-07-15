const fs = require("fs");
let content = fs.readFileSync("src/components/ProfileView.tsx", "utf-8");

// Add properties to user type
content = content.replace(
    'user: {',
    'user: {\n    id?: number;\n    username: string;\n    email: string;\n    avatar: string;\n    bio?: string;\n    role: string;\n    theme?: string;\n    plan: string;\n    coins: number;\n    plan_expires_at?: string;\n    is_verified?: boolean;\n    avatar_frame?: string;\n    badges?: string;\n    created_at?: string;\n  };'
);
content = content.replace(
    'username: string;',
    ''
);
content = content.replace(
    'email: string;',
    ''
);
content = content.replace(
    'avatar: string;',
    ''
);
content = content.replace(
    'bio?: string;',
    ''
);
content = content.replace(
    'role: string;',
    ''
);
content = content.replace(
    'theme?: string;',
    ''
);
content = content.replace(
    'plan: string;',
    ''
);
content = content.replace(
    'coins: number;',
    ''
);
content = content.replace(
    'plan_expires_at?: string;',
    ''
);
content = content.replace(
    'created_at?: string;',
    ''
);

content = content.replace(
    'onUpdateProfile: (updatedData: { username?: string; avatar?: string; bio?: string; theme?: string }) => Promise<boolean>;',
    'onUpdateProfile: (updatedData: { username?: string; avatar?: string; bio?: string; theme?: string; avatar_frame?: string }) => Promise<boolean>;'
);

fs.writeFileSync("src/components/ProfileView.tsx", content);
console.log("Patched ProfileView types");
