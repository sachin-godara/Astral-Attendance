import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code2, X } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPerformanceMode?: boolean;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
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
            className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            key="modal-content"
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-10 w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 text-center shadow-2xl"
          >
            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto mb-5 text-black dark:text-white">
              <Code2 className="w-6 h-6" />
            </div>

            <span className="text-[11px] font-mono tracking-widest uppercase text-zinc-500 block mb-1">
              Developer
            </span>
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-6">
              Sachin Godara
            </h3>

            <button 
              onClick={onClose}
              className="w-full py-2 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors font-mono"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
