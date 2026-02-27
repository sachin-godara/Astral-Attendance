import React from 'react';
import { motion } from 'framer-motion';

interface HeroProps {
  onStart: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStart }) => {
  return (
    <section className="min-h-[100dvh] flex flex-col items-center justify-center relative px-6 py-20 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-center z-10 w-full max-w-5xl"
      >
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-6 inline-block px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs md:text-sm font-medium tracking-widest uppercase"
        >
            Next Gen Tracker
        </motion.div>
        
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-100 dark:to-slate-500 drop-shadow-[0_10px_10px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] leading-[1.1]">
          Astral<br className="sm:hidden" /> Attendance
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed px-2 font-light">
          Master your academic schedule with precision analytics. 
          Calculate bunkability, forecast risks, and stay ahead of the curve.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="group relative px-8 py-4 md:px-10 md:py-5 bg-slate-900 dark:bg-white text-white dark:text-black font-extrabold text-base md:text-lg rounded-full overflow-hidden shadow-2xl shadow-cyan-500/20"
        >
          <span className="relative z-10 group-hover:text-white transition-colors duration-300">Launch Dashboard</span>
          <div className="absolute inset-0 bg-cyan-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ease-out" />
        </motion.button>
      </motion.div>

      {/* Scroll indicator - hidden on very small heights */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden sm:block"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="w-6 h-10 border-2 border-slate-700 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-cyan-500 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
};