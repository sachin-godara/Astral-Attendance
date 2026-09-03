import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Background } from './components/Background';
import { Moon, Sun, GraduationCap } from 'lucide-react';

const GithubIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg 
    viewBox="0 0 24 24" 
    width="16" 
    height="16" 
    stroke="currentColor" 
    strokeWidth="2" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    aria-hidden="true"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const App: React.FC = () => {
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
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-50">
                Astral
              </span>
              <span className="text-[11px] font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider hidden sm:inline">
                Attendance
              </span>
            </div>
          </div>
          
          {/* Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Dark / Light Mode Toggle */}
            <button 
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
              aria-label={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Source Repository Link */}
            <a
              id="github-repo-btn"
              href="https://github.com/sachin-godara/Astral-Attendance"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
              title="View on GitHub"
              aria-label="View on GitHub"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Dashboard isDarkMode={isDarkMode} />
      </main>

      {/* Minimalist Professional Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs font-mono text-zinc-400">
          <p>© {new Date().getFullYear()} Astral Attendance • 100% Client-Side & Private</p>
          <div className="flex items-center gap-4 text-zinc-500">
            <a 
              href="https://github.com/sachin-godara/Astral-Attendance" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-black dark:hover:text-white transition-colors"
            >
              GitHub
            </a>
            <span>•</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

