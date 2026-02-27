import React, { useRef, useState, useEffect } from 'react';
import { Hero } from './components/Hero';
import { Dashboard } from './components/Dashboard';
import { CustomCursor } from './components/CustomCursor';
import { Background } from './components/Background';
import { SupportModal } from './components/SupportModal';
import { motion, useScroll, useTransform } from 'framer-motion';

const App: React.FC = () => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isPerformanceMode, setIsPerformanceMode] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    if (isPerformanceMode) {
      document.body.classList.add('perf-mode');
    } else {
      document.body.classList.remove('perf-mode');
    }
  }, [isPerformanceMode]);

  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const scrollToDashboard = () => {
    dashboardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  return (
    <div className={`min-h-screen relative selection:bg-cyan-500/30 selection:text-cyan-100 ${isPerformanceMode ? 'perf-mode' : ''} transition-colors duration-500`}>
      <CustomCursor isPerformanceMode={isPerformanceMode} />
      <Background isPerformanceMode={isPerformanceMode} />
      
      {/* Navigation / Header */}
      <nav className="fixed top-0 left-0 right-0 z-40 p-4 md:p-6 flex justify-between items-center mix-blend-difference text-white">
        <span className="font-bold text-lg md:text-xl tracking-tighter">AST.ATTD</span>
        
        <div className="flex items-center gap-3 md:gap-6">
            <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border transition-all duration-300 ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-yellow-400' : 'bg-white border-slate-200 text-slate-600 shadow-lg'}`}
                title={isDarkMode ? "Switch to Solar Mode" : "Switch to Nebula Mode"}
            >
                {isDarkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                )}
            </button>

            <button 
                onClick={() => setIsPerformanceMode(!isPerformanceMode)}
                className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border transition-all duration-300 text-[10px] md:text-xs font-bold uppercase tracking-widest ${isPerformanceMode ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'bg-white/5 border-white/20 text-white/60 hover:text-white hover:border-white/40'}`}
                title={isPerformanceMode ? "Switch to Astral Quality" : "Switch to Performance Mode"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 md:h-4 md:w-4 ${isPerformanceMode ? 'animate-bounce' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="hidden sm:inline">{isPerformanceMode ? 'Warp Mode' : 'Astral Mode'}</span>
            </button>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-xs font-mono opacity-60 hover:opacity-100 transition-opacity hidden sm:block">v1.1.0</a>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10">
        <Hero onStart={scrollToDashboard} />
        
        <div ref={dashboardRef} className="relative z-20 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-sm border-t border-black/5 dark:border-white/5">
             <Dashboard isPerformanceMode={isPerformanceMode} isDarkMode={isDarkMode} />
             
             {/* Footer */}
             <footer className="py-8 md:py-12 border-t border-white/5 bg-black/40 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center text-slate-500 text-xs md:text-sm">
                    <p>
                        © {new Date().getFullYear()} <span className="hover:text-cyan-400 transition-colors">Astral Attendance</span>. All rights reserved.
                    </p>
                    <div className="flex gap-4 md:gap-6 mt-4 md:mt-0 items-center">
                        <span className="hover:text-cyan-400 cursor-pointer transition-colors">Privacy</span>
                        <span className="hover:text-cyan-400 cursor-pointer transition-colors">Terms</span>
                        <button 
                          onClick={() => setIsSupportOpen(true)}
                          className="hover:text-cyan-400 cursor-pointer transition-colors focus:outline-none"
                        >
                          Support
                        </button>
                    </div>
                </div>
             </footer>
        </div>
      </main>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} isPerformanceMode={isPerformanceMode} />
    </div>
  );
};

export default App;