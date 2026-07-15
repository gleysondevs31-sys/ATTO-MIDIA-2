const fs = require("fs");
let content = fs.readFileSync("src/components/Sidebar.tsx", "utf-8");
content = content.replace(
    'import { Compass, Film, Heart, Settings, Shield, Info, ExternalLink, HelpCircle, LayoutGrid, Youtube, Music, Play, History, Trash2, X, Instagram, Sparkles, Code2 } from "lucide-react";',
    'import { Compass, Film, Heart, Settings, Shield, Info, ExternalLink, HelpCircle, LayoutGrid, Youtube, Music, Play, History, Trash2, X, Instagram, Sparkles, Code2, Users, Handshake, Image as ImageIcon } from "lucide-react";'
);
fs.writeFileSync("src/components/Sidebar.tsx", content);
