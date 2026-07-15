const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf-8");

if (!content.includes("import uploadApi")) {
    content = 'import uploadApi from "./src/upload-api.js";\n' + content;
    
    // Find where to inject the app.use
    content = content.replace(
        'app.use("/api/image", imageApi);',
        'app.use("/api/image", imageApi);\n  app.use("/api/upload", uploadApi);\n  app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));'
    );
    
    fs.writeFileSync("server.ts", content);
    console.log("Successfully injected uploadApi");
} else {
    console.log("uploadApi already injected");
}
