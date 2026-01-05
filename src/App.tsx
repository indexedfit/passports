import { Suspense, lazy, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchInput } from './components/SearchInput';
import { SynergyPanel } from './components/SynergyPanel';
import { ShareCard } from './components/ShareCard';
import { useAppStore } from './stores/appStore';

// Lazy load the heavy Globe component (1.8MB chunk)
const Globe = lazy(() => import('./components/Globe').then(m => ({ default: m.Globe })));

function GlobePlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative">
        {/* Animated globe placeholder */}
        <div className="w-64 h-64 rounded-full bg-gradient-to-br from-blue-100 to-sky-200 opacity-50 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-blue-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}

function App() {
  const { selectedPassports } = useAppStore();
  const hasSelection = selectedPassports.length > 0;
  const [globeReady, setGlobeReady] = useState(false);

  // Delay globe loading to let UI render first
  useEffect(() => {
    // Use requestIdleCallback for smarter timing, fallback to setTimeout
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => setGlobeReady(true), { timeout: 1500 });
      return () => cancelIdleCallback(id);
    } else {
      const timer = setTimeout(() => setGlobeReady(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-sky-50 to-blue-100">
      {/* Globe - lazy loaded after UI is interactive */}
      <div className="absolute inset-0">
        {globeReady ? (
          <Suspense fallback={<GlobePlaceholder />}>
            <Globe />
          </Suspense>
        ) : (
          <GlobePlaceholder />
        )}
      </div>

      {/* Light overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-white/40 pointer-events-none" />

      {/* Landing Hero - shown before selection */}
      <AnimatePresence>
        {!hasSelection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
          >
            <div className="text-center max-w-2xl px-6 pointer-events-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-4 tracking-tight">
                  Passport Synergy
                </h1>
                <p className="text-xl text-slate-600 mb-2">
                  Find the perfect citizenship to complement yours
                </p>
                <p className="text-sm text-slate-500 mb-8">
                  Discover which passports pair best based on dual citizenship laws,
                  visa-free access, and geographic reach
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <SearchInput />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap justify-center gap-6 text-sm text-slate-500"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span>197 countries analyzed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                  </div>
                  <span>Visa-free access data</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span>Synergy scoring</span>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-xs text-slate-400 mt-8"
              >
                Click any country on the globe or search above to begin
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact header when selection is made */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 p-4 z-10"
          >
            <div className="max-w-md mx-auto">
              <SearchInput />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info panel - right side */}
      <SynergyPanel />

      {/* Share card button + modal */}
      <ShareCard />

      {/* Legend - bottom left */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="hidden md:block absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200"
          >
            <div className="text-sm font-medium text-slate-700 mb-3">Synergy Score</div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-slate-600">High compatibility (70+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-xs text-slate-600">Medium (40-69)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <span className="text-xs text-slate-600">Low or incompatible</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* How it works - bottom center on landing */}
      <AnimatePresence>
        {!hasSelection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 1 }}
            className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          >
            <div className="flex items-center gap-8 text-slate-500 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white shadow flex items-center justify-center text-xs font-bold text-slate-600">1</span>
                <span>Select your passport</span>
              </div>
              <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white shadow flex items-center justify-center text-xs font-bold text-slate-600">2</span>
                <span>See synergy scores</span>
              </div>
              <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white shadow flex items-center justify-center text-xs font-bold text-slate-600">3</span>
                <span>Find your best match</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
