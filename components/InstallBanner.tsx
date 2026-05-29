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
