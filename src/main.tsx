import React, { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PublicGalleryView } from './components/PublicGalleryView.tsx';
import './index.css';
import { ToastProvider } from './components/Toast.tsx';

function AppRouter() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Check if it's the gallery public route, making it robust against trailing slashes or subpaths if needed
  const isGalleryRoute = currentPath === '/gallery' || currentPath.startsWith('/gallery/');

  if (isGalleryRoute) {
    return <PublicGalleryView theme="dark" />;
  }

  // Default to main App
  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
);
