import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Dashboard } from './components/Dashboard';
import { Background } from './components/Background';
import { Moon, Sun, Code2, GraduationCap } from 'lucide-react';

const SupportModal = lazy(() => import('./components/SupportModal').then(m => ({ default: m.SupportModal })));

const App: React.FC = () => {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('isDarkMode');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    try {
      localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
    } catch (e) {}
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-white dark:bg-[#09090b] text-zinc-950 dark:text-zinc-50 transition-colors duration-200 selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <Background isDarkMode={isDarkMode} />
      
      {/* Architectural Minimal Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-50">
              Astral
            </span>
          </div>
          
          {/* Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dark / Light Mode Toggle */}
            <button 
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
              aria-label={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Developer Support Trigger */}
            <button
              id="support-modal-btn"
              onClick={() => setIsSupportOpen(true)}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
              title="About developer"
              aria-label="About developer"
            >
              <Code2 className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Dashboard onOpenSupport={() => setIsSupportOpen(true)} isDarkMode={isDarkMode} />
      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-5 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs font-mono text-zinc-400">
          <p>© {new Date().getFullYear()} Astral</p>
          <button 
            onClick={() => setIsSupportOpen(true)}
            className="hover:text-black dark:hover:text-white transition-colors"
          >
            Developer
          </button>
        </div>
      </footer>

      {/* Developer Modal (Lazy loaded on demand) */}
      {isSupportOpen && (
        <Suspense fallback={null}>
          <SupportModal 
            isOpen={isSupportOpen} 
            onClose={() => setIsSupportOpen(false)} 
          />
        </Suspense>
      )}
    </div>
  );
};

export default App;
