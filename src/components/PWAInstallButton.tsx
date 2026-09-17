import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'nav' | 'card' }> = ({ variant = 'nav' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (variant === 'card') {
    return (
      <>
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Install CICADA POS App</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Install as a standalone native-feeling PWA on your home screen for quick offline access.
              </p>
            </div>
          </div>

          {isInstallable ? (
            <button
              onClick={install}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Install App
            </button>
          ) : isIOS ? (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-600/30 bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold shadow-sm transition whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              iOS Instructions
            </button>
          ) : (
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 rounded-md">
              PWA Ready
            </span>
          )}
        </div>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Install on iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300 list-decimal list-inside">
                <li>Tap the <strong>Share</strong> button at the bottom of Safari.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top-right corner.</li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 py-2.5 text-xs font-bold transition hover:opacity-90"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Nav variant (compact button)
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold shadow-xs transition"
        title="Install CICADA to your device"
      >
        <Download className="w-3.5 h-3.5" />
        Install App
      </button>
    );
  }

  return null;
};
