#!/usr/bin/env bash
# Etapa 5 - PWA: manifest, service worker, banner instalacion, branding TSF
# Uso: bash scripts/etapa5.sh && git add -A && git commit -m 'feat(etapa5): PWA manifest + SW + install banner'
set -euo pipefail

mkdir -p public components

# --- manifest.json ---
cat > public/manifest.json <<'EOF'
{
  "name": "TSF Control Center",
  "short_name": "TSF Control",
  "description": "Inteligencia Operativa Empresarial - Analisis de reportes con IA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#1e40af",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "categories": ["business", "productivity"]
}
EOF

# --- Service Worker (basic cache-first) ---
cat > public/sw.js <<'EOF'
const CACHE_NAME = 'tsf-control-v1';
const PRECACHE = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((resp) => {
      const clone = resp.clone();
      caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
      return resp;
    }))
  );
});
EOF

# --- SW Registration (add to index.html or main entry) ---
cat > public/register-sw.js <<'EOF'
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
EOF

# --- Install Banner Component ---
cat > components/InstallBanner.tsx <<'EOF'
import React, { useEffect, useState } from 'react';

let deferredPrompt: any = null;

export default function InstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); deferredPrompt = e; setShow(true); };
    window.addEventListener('beforeinstallprompt', handler as any);
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    setShow(false);
  }

  if (!show) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-blue-700 text-white p-4 rounded-lg shadow-lg flex items-center justify-between z-50">
      <div>
        <p className="font-semibold">Instalar TSF Control Center</p>
        <p className="text-xs opacity-80">Acceso rapido desde tu dispositivo</p>
      </div>
      <button onClick={handleInstall} className="bg-white text-blue-700 px-3 py-1 rounded font-semibold text-sm">Instalar</button>
    </div>
  );
}
EOF

# --- Placeholder icons directory ---
mkdir -p public/icons
echo 'Placeholder: reemplazar con iconos reales de TSF (192x192 y 512x512 PNG)' > public/icons/README.md

echo ''
echo '[etapa5] PWA creada:'
echo '  - public/manifest.json (TSF Control Center branding)'
echo '  - public/sw.js (cache-first service worker)'
echo '  - public/register-sw.js (registro SW)'
echo '  - components/InstallBanner.tsx (banner A2HS)'
echo '  - public/icons/README.md (placeholder para iconos)'
echo ''
echo 'PENDIENTE:'
echo '  1. Agregar <link rel="manifest" href="/manifest.json"> en index.html'
echo '  2. Agregar <script src="/register-sw.js"></script> en index.html'
echo '  3. Colocar iconos reales en public/icons/'
echo '  4. Incluir <InstallBanner /> en el layout principal'
echo ''
echo 'Commit: git add -A && git commit -m "feat(etapa5): PWA manifest + SW + install banner" && git push'
