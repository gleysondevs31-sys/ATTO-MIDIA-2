const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf-8");

if (!content.includes("import imageApi")) {
    content = 'import imageApi from "./src/image-api.js";\n' + content;
    
    // Find where to inject the app.use
    content = content.replace(
        'app.use(express.json());',
        'app.use(express.json());\napp.use("/api/image", imageApi);'
    );
    
    fs.writeFileSync("server.ts", content);
    console.log("Successfully injected imageApi");
} else {
    console.log("imageApi already injected");
}
