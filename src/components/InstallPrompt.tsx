import { useState, useEffect, useCallback } from 'react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const SESSION_KEY = 'stivulator-install-dismissed';

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream;
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    // Already installed = don't show
    if (isStandalone()) return;

    // Already dismissed this session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // iOS Safari doesn't support beforeinstallprompt, show manual instructions
    if (isIOS()) {
      const timer = setTimeout(() => setShowIOS(true), 2500);
      return () => clearTimeout(timer);
    }

    // Chrome/Edge/Android: listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as InstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      setDeferredPrompt(null);
    } else {
      // User dismissed the browser prompt, keep ours open
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setShowIOS(false);
    sessionStorage.setItem(SESSION_KEY, 'true');
  }, []);

  const handleShowAgain = useCallback(() => {
    setVisible(true);
    setShowIOS(false);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  if (isStandalone()) return null;

  // iOS manual install instructions
  if (showIOS) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center pb-4 px-4 pointer-events-none" style={{ animation: 'fade-in-up 0.4s ease-out' }}>
        <div className="bg-white rounded-2xl border-[3px] border-yellow-400 shadow-2xl p-4 max-w-sm w-full pointer-events-auto">
          <div className="flex items-start gap-3">
            <img src="/assets/icon-face.png" alt="Stivulator" className="w-14 h-14 rounded-xl object-cover border-2 border-gray-200 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-800" style={{ fontFamily: '"Comic Sans MS", cursive' }}>
                {'Install Stivulator!'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {'Add to your home screen for instant tickling!'}
              </p>
              <div className="mt-2 bg-yellow-50 rounded-lg p-2 text-xs text-gray-600 space-y-1">
                <p><span className="text-yellow-600 font-bold">1.</span> {'Tap the Share button '}<span className="text-lg">{'⎋'}</span></p>
                <p><span className="text-yellow-600 font-bold">2.</span> {'Scroll and tap "Add to Home Screen"'}</p>
                <p><span className="text-yellow-600 font-bold">3.</span> {'Tap "Add" and done!'}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleDismiss}
              className="flex-1 py-1.5 rounded-xl text-xs font-bold text-gray-400 hover:bg-gray-50 transition-colors"
            >
              {'Maybe Later'}
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-yellow-400 text-yellow-900 hover:bg-yellow-500 transition-colors shadow-sm"
            >
              {'Got It!'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Android/Chrome install prompt
  if (!visible) {
    // Show a small floating install button after user dismisses, so they can re-open
    if (sessionStorage.getItem(SESSION_KEY)) {
      return (
        <button
          onClick={handleShowAgain}
          className="fixed bottom-32 right-3 z-40 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
          title="Install Stivulator"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      );
    }
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center pb-4 px-4 pointer-events-none" style={{ animation: 'fade-in-up 0.4s ease-out' }}>
      <div className="bg-white rounded-2xl border-[3px] border-yellow-400 shadow-2xl p-4 max-w-sm w-full pointer-events-auto">
        <div className="flex items-start gap-3">
          <img src="/assets/icon-512.png" alt="Stivulator" className="w-14 h-14 rounded-xl object-cover border-2 border-gray-200 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-800" style={{ fontFamily: '"Comic Sans MS", cursive' }}>
              {'Install Stivulator!'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {'Add to your home screen for instant tickling action!'}
            </p>
            <ul className="mt-1.5 space-y-0.5 text-[11px] text-gray-400">
              <li className="flex items-center gap-1"><span className="text-green-400">{'✓'}</span> {'Works offline'}</li>
              <li className="flex items-center gap-1"><span className="text-green-400">{'✓'}</span> {'Full screen experience'}</li>
              <li className="flex items-center gap-1"><span className="text-green-400">{'✓'}</span> {'No address bar'}</li>
            </ul>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-400 hover:bg-gray-50 transition-colors"
          >
            {'Not Now'}
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 py-2 rounded-xl text-xs font-bold bg-green-400 text-green-900 hover:bg-green-500 transition-colors shadow-sm flex items-center justify-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {'Install'}
          </button>
        </div>
      </div>
    </div>
  );
}
