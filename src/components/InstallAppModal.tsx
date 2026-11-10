import React, { useState } from 'react';
import {
  Download,
  X,
  Smartphone,
  Monitor,
  CheckCircle2,
  Share,
  PlusSquare,
  Sparkles,
  WifiOff,
  Zap,
  ShieldCheck,
  Printer,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { usePwaInstall } from '../hooks/usePwaInstall.ts';
import logoImg from '../assets/images/b2b_supply_tracker_logo_1787039083352.jpg';

export const InstallAppModal: React.FC = () => {
  const { isInstallAppModalOpen, setIsInstallAppModalOpen, showToast } = useApp();
  const { isInstallable, isInstalled, isIos, isAndroid, isDesktop, installApp } = usePwaInstall();
  const [installing, setInstalling] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'ios' | 'android' | 'desktop'>(
    isIos ? 'ios' : isAndroid ? 'android' : 'prompt'
  );

  if (!isInstallAppModalOpen) return null;

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const success = await installApp();
      if (success) {
        showToast('App installation initiated! Check your home screen or desktop.', 'success');
        setIsInstallAppModalOpen(false);
      } else {
        if (isIos) {
          setActiveTab('ios');
        } else if (isAndroid) {
          setActiveTab('android');
        } else {
          setActiveTab('desktop');
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header Banner */}
        <div className="relative px-6 py-6 bg-linear-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white overflow-hidden">
          {/* Subtle geometric background shapes */}
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-20 -bottom-10 w-32 h-32 bg-cyan-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-lg border border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                <img src={logoImg} alt="B2B Supply Tracker" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Install B2B Supply Tracker & ERP
                  </h3>
                  {isInstalled && (
                    <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-100 border border-emerald-400/30 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-300" /> Installed
                    </span>
                  )}
                </div>
                <p className="text-xs text-blue-100/90 mt-0.5">
                  Progressive Web App (PWA) • Works Offline • Instant Launch • 0 MB App Store Download
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsInstallAppModalOpen(false)}
              className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Status / Quick Action Box */}
          {isInstalled ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start space-x-3.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  App is already installed on this device
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  You are enjoying full standalone performance, thermal printer direct access, offline database sync, and high-speed hardware acceleration.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" /> 1-Click Direct Device Installation
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                  Adds an icon directly to your home screen or dock. No app store account or download size required.
                </p>
              </div>

              <button
                type="button"
                onClick={handleInstallClick}
                disabled={installing}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{installing ? 'Installing...' : 'Install App Now'}</span>
              </button>
            </div>
          )}

          {/* Platform Tab Switcher */}
          <div>
            <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('prompt')}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'prompt'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> PWA Benefits
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'ios'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-500" /> iPhone & iPad (iOS)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'android'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" /> Android
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('desktop')}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'desktop'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-purple-500" /> PC / Mac
              </button>
            </div>

            {/* Tab 1: PWA Benefits & Hardware Integration */}
            {activeTab === 'prompt' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <WifiOff className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200">100% Offline Capability</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Service Worker caches all assets and syncs bills automatically when connectivity returns.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Direct Thermal Printing</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Web-Bluetooth and Web-USB support for 58mm/80mm receipt printers without browser headers.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Lightning Fast Launch</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Zero startup delay with local SQLite/IndexedDB caching and instant navigation.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Secure Sandboxed Storage</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Encrypted local storage with automatic cloud database backup synchronization.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: iOS Instructions */}
            {activeTab === 'ios' && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Smartphone className="w-4 h-4 text-blue-500" />
                  <span>How to install on Apple iOS (iPhone & iPad):</span>
                </div>
                <ol className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Open this page in <strong>Safari</strong> on your iPhone or iPad.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      Tap the <strong>Share</strong> button <Share className="w-4 h-4 text-blue-600 inline" /> in Safari's toolbar (bottom or top).
                    </span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="w-4 h-4 text-indigo-600 inline" />.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <span>
                      Tap <strong>Add</strong> in the top-right corner. The app will appear on your Home Screen!
                    </span>
                  </li>
                </ol>
              </div>
            )}

            {/* Tab 3: Android Instructions */}
            {activeTab === 'android' && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>How to install on Android (Chrome, Edge, Samsung Browser):</span>
                </div>
                <ol className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Tap the <strong>"Install App Now"</strong> button above, or open the browser menu (3 dots <strong className="font-mono">⋮</strong>).
                    </span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Confirm installation. The app will launch in full-screen standalone mode with offline billing!
                    </span>
                  </li>
                </ol>
              </div>
            )}

            {/* Tab 4: Desktop Instructions */}
            {activeTab === 'desktop' && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Monitor className="w-4 h-4 text-purple-500" />
                  <span>How to install on Windows, Mac, or Linux Desktop:</span>
                </div>
                <ol className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      In <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>, look for the <strong>Install icon <Download className="w-3.5 h-3.5 inline mx-0.5 text-purple-600" /></strong> on the right side of the address bar.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Click <strong>Install</strong>. It creates a desktop shortcut and native application window with window frame controls.
                    </span>
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>PWA v1.0 • Offline Ready</span>
          </div>
          <button
            type="button"
            onClick={() => setIsInstallAppModalOpen(false)}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
