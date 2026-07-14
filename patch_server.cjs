const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf-8");

if (!content.includes("import imageApi from")) {
    content = content.replace(
        'import authRoutes from "./src/auth-routes.js";',
        'import authRoutes from "./src/auth-routes.js";\nimport imageApi from "./src/image-api.js";'
    );
    
    content = content.replace(
        'app.use("/api/auth", authRoutes);',
        'app.use("/api/auth", authRoutes);\n  app.use("/api/image", imageApi);'
    );
    fs.writeFileSync("server.ts", content);
    console.log("Patched server.ts with imageApi");
} else {
    console.log("imageApi already in server.ts");
}
