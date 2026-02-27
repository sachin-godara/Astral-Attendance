import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPerformanceMode?: boolean;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, isPerformanceMode = false }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`absolute inset-0 bg-black/60 dark:bg-black/90 ${isPerformanceMode ? '' : 'backdrop-blur-xl'}`}
          />
          
          <motion.div
            key="modal-content"
            initial={{ scale: 0.9, opacity: 0, rotateX: 20 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.9, opacity: 0, rotateX: 20 }}
            transition={{ type: "spring", duration: 0.8, bounce: 0.3 }}
            className="relative z-10 w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Animated Grid Background */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            
            {/* Ambient Glow */}
            <motion.div 
                animate={{ 
                    background: [
                        "radial-gradient(circle at 0% 0%, rgba(34, 211, 238, 0.1) 0%, rgba(34, 211, 238, 0) 50%)",
                        "radial-gradient(circle at 100% 100%, rgba(34, 211, 238, 0.1) 0%, rgba(34, 211, 238, 0) 50%)",
                        "radial-gradient(circle at 0% 0%, rgba(34, 211, 238, 0.1) 0%, rgba(34, 211, 238, 0) 50%)"
                    ]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 pointer-events-none"
            />

            <div className="relative p-8 md:p-12 flex flex-col items-center text-center">
                
                {/* Icon Placeholder with Glitch Effect */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                    className="w-20 h-20 rounded-full bg-slate-900 border border-cyan-500/30 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(34,211,238,0.15)] relative group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-cyan-400/10 rounded-full animate-pulse"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2 mb-8"
                >
                    <div className="overflow-hidden h-5 mb-1">
                        <motion.h3 
                            initial={{ y: 20 }}
                            animate={{ y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="text-xs font-mono text-cyan-500 tracking-[0.3em] uppercase"
                        >
                            Lead Developer
                        </motion.h3>
                    </div>
                    
                    <motion.h2 
                        className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tighter"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                    >
                        Sachin Godara
                    </motion.h2>
                    
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-slate-500 dark:text-slate-400 text-sm font-light"
                    >
                        Engineering digital excellence.
                    </motion.p>
                </motion.div>

                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "60%" }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent w-full mb-8"
                />

                <motion.button 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    onClick={onClose}
                    className="group relative px-8 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black text-sm font-bold tracking-wide overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <span className="relative z-10 group-hover:text-white transition-colors duration-300">Close</span>
                    <div className="absolute inset-0 bg-cyan-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ease-out" />
                </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};