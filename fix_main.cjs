const fs = require("fs");
let content = fs.readFileSync("src/main.tsx", "utf-8");

content = content.replace(
  "import App from './App.tsx';",
  "import App from './App.tsx';\nimport { PublicGalleryView } from './components/PublicGalleryView.tsx';"
);

content = content.replace(
  `createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);`,
  `const root = createRoot(document.getElementById('root')!);

if (window.location.pathname === '/gallery') {
  root.render(<PublicGalleryView theme="dark" />);
} else {
  root.render(
    <StrictMode>
      <ToastProvider>
        <App />
      </ToastProvider>
    </StrictMode>
  );
}`
);

fs.writeFileSync("src/main.tsx", content);
console.log("Patched main.tsx to handle /gallery properly");
