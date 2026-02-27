import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BackgroundProps {
  isPerformanceMode?: boolean;
}

export const Background: React.FC<BackgroundProps> = ({ isPerformanceMode = false }) => {
  // Memoize particles to prevent regeneration on re-renders
  const particles = useMemo(() => isPerformanceMode ? [] : Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 10,
  })), [isPerformanceMode]);

  return (
    <div className={`fixed inset-0 z-[-1] overflow-hidden transition-colors duration-700 ${isPerformanceMode ? 'bg-slate-50 dark:bg-slate-950' : 'bg-slate-50 dark:bg-slate-950'}`}>
        {/* Performance Mode Gradient */}
        {isPerformanceMode && (
           <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-black opacity-50" />
        )}

        {/* Grid Overlay */}
        <div className={`absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] ${isPerformanceMode ? 'opacity-5' : 'opacity-20'} brightness-150 contrast-150 mix-blend-overlay`}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:opacity-100 opacity-50"></div>

        {/* Astral Mode Elements */}
        <AnimatePresence>
          {!isPerformanceMode && (
            <motion.div
              key="astral-bg-elements"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              <div 
                  className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full animate-pulse will-change-transform"
                  style={{
                      background: 'radial-gradient(circle, rgba(88, 28, 135, 0.15) 0%, rgba(88, 28, 135, 0) 70%)'
                  }}
              />
              <div 
                  className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full animate-pulse will-change-transform" 
                  style={{ 
                      animationDelay: '2s',
                      background: 'radial-gradient(circle, rgba(22, 78, 99, 0.15) 0%, rgba(22, 78, 99, 0) 70%)'
                  }} 
              />
              
              {/* Floating Particles */}
              {particles.map((p) => (
                  <motion.div
                      key={p.id}
                      className="absolute rounded-full bg-slate-400/20 dark:bg-white/10 will-change-transform"
                      style={{
                          left: `${p.x}%`,
                          top: `${p.y}%`,
                          width: p.size,
                          height: p.size,
                      }}
                      animate={{
                          y: [0, -100, 0],
                          opacity: [0, 0.5, 0],
                      }}
                      transition={{
                          duration: p.duration,
                          repeat: Infinity,
                          ease: "linear",
                      }}
                  />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
};