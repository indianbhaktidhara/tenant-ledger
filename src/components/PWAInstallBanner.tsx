import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, Share, PlusSquare, X, Info } from 'lucide-react';

interface Props {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onInstall: () => Promise<boolean | void>;
}

export const PWAInstallBanner: React.FC<Props> = ({
  isInstallable,
  isInstalled,
  isIOS,
  onInstall
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // If already running in standalone app mode, show a discreet status badge
  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--teal-bg)] border border-[var(--teal)] text-[10px] font-semibold text-[var(--teal-dark)]">
        <CheckCircle size={11} className="text-[var(--teal)]" />
        <span>Installed App Mode (Offline Ready)</span>
      </div>
    );
  }

  return (
    <>
      {/* Top Header Quick Install Trigger Button */}
      <button
        onClick={() => {
          if (isInstallable) {
            onInstall();
          } else {
            setShowModal(true);
          }
        }}
        className="px-2.5 py-1.5 rounded-md border border-[var(--teal)] bg-[var(--teal-bg)] text-xs font-semibold text-[var(--teal-dark)] hover:bg-white transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer animate-pulse-subtle"
        title="Install Tenant Ledger on your mobile phone"
      >
        <Smartphone size={13} className="text-[var(--teal)]" />
        <span>Install App</span>
      </button>

      {/* Prominent Dismissible Mobile Card Banner if not dismissed */}
      {!isBannerDismissed && (
        <div className="my-2 p-3 bg-gradient-to-r from-[var(--brass-bg)] to-amber-50 border border-[var(--brass)] rounded-lg shadow-2xs flex items-center justify-between gap-2.5">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[var(--ink)] text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
              <Smartphone size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-serif-slab font-bold text-xs sm:text-sm text-[var(--ink)]">
                  Install on Mobile Phone
                </span>
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-bold bg-[var(--brass)] text-white">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-[var(--ink-soft)] line-clamp-1 sm:line-clamp-none">
                Add to your home screen for full-screen offline access, fast loading, and instant statements.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isInstallable ? (
              <button
                onClick={() => onInstall()}
                className="px-3 py-1.5 rounded-md bg-[var(--ink)] text-white text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Download size={13} />
                <span>Install</span>
              </button>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="px-2.5 py-1.5 rounded-md bg-[var(--ink)] text-white text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Info size={13} />
                <span>How to Install</span>
              </button>
            )}

            <button
              onClick={() => setIsBannerDismissed(true)}
              className="p-1 text-[var(--ink-soft)] hover:text-[var(--ink)] rounded"
              title="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Guide Modal for iOS & Desktop / Browsers */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[var(--rule)] shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[var(--ink)] text-white flex items-center justify-center shadow-xs">
                  <Smartphone size={22} className="text-[var(--brass)]" />
                </div>
                <div>
                  <h3 className="font-serif-slab text-lg font-bold text-[var(--ink)]">
                    Install Tenant Ledger
                  </h3>
                  <p className="text-xs text-[var(--ink-soft)]">
                    Use as a native app on your phone with zero app store hassle
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded text-[var(--ink-soft)] hover:text-[var(--ink)]"
              >
                <X size={18} />
              </button>
            </div>

            {isIOS ? (
              /* iOS Safari Instructions */
              <div className="space-y-3 bg-[var(--paper)] p-3.5 rounded-lg border border-[var(--rule)] text-xs text-[var(--ink)]">
                <p className="font-semibold text-sm text-[var(--ink)]">
                  Apple iPhone / iPad (Safari) Instructions:
                </p>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold">
                    1
                  </div>
                  <p className="pt-0.5">
                    Tap the <strong>Share</strong> icon{' '}
                    <Share size={13} className="inline text-blue-600 mx-0.5" /> at the bottom
                    of Safari toolbar.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold">
                    2
                  </div>
                  <p className="pt-0.5">
                    Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>{' '}
                    <PlusSquare size={13} className="inline text-zinc-700 mx-0.5" />.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold">
                    3
                  </div>
                  <p className="pt-0.5">
                    Tap <strong>Add</strong> at top right. The app will appear on your home screen
                    with its icon and work offline!
                  </p>
                </div>
              </div>
            ) : (
              /* Android Chrome & Generic instructions */
              <div className="space-y-3 bg-[var(--paper)] p-3.5 rounded-lg border border-[var(--rule)] text-xs text-[var(--ink)]">
                <p className="font-semibold text-sm text-[var(--ink)]">
                  Android & Chrome Instructions:
                </p>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                    1
                  </div>
                  <p className="pt-0.5">
                    Tap the <strong>browser menu</strong> (three dots <strong>⋮</strong> at the top right of Chrome or Edge).
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                    2
                  </div>
                  <p className="pt-0.5">
                    Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                    3
                  </div>
                  <p className="pt-0.5">
                    Confirm prompt. The app will install directly to your app launcher and home screen.
                  </p>
                </div>
              </div>
            )}

            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <CheckCircle size={12} className="text-emerald-600" />
                Offline Capability Included
              </p>
              <p>
                Once installed, the app works even when your phone has no internet connection or is in flight mode. All calculations and receipts are saved locally.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md bg-[var(--ink)] text-white text-xs font-semibold hover:bg-black"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
