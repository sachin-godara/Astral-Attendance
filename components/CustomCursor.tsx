import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

interface CustomCursorProps {
  isPerformanceMode?: boolean;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ isPerformanceMode = false }) => {
  // If in performance mode, we don't render the custom cursor at all
  if (isPerformanceMode) return null;

  // Use MotionValues to track mouse position directly without triggering React re-renders
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth out the mouse movement with a spring physics
  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  const [isHovering, setIsHovering] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      // Update motion values directly - no React commit phase needed
      mouseX.set(e.clientX - 16);
      mouseY.set(e.clientY - 16);
    };
    
    // Add global hover listeners for interaction states
    const handleMouseOver = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        
        // Ensure target handles match (Element type)
        if (!target || !target.matches) return;

        const isInteractive = 
            target.matches('button, a, input, select, textarea, [role="button"]') || 
            target.closest('button, a, input, select, textarea, [role="button"]');

        if (isInteractive) {
            // Add delay before activating hover state to prevent flickering
            if (!hoverTimeoutRef.current) {
                hoverTimeoutRef.current = window.setTimeout(() => {
                    setIsHovering(true);
                    hoverTimeoutRef.current = null;
                }, 50); 
            }
        } else {
            // Cancel pending hover activation if moving away quickly
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
            }
            setIsHovering(false);
        }
    }

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full border border-cyan-400 pointer-events-none z-[9999] mix-blend-difference hidden md:block will-change-transform"
      style={{
        x: cursorX,
        y: cursorY,
      }}
      animate={{
        scale: isHovering ? 1.5 : 1,
        backgroundColor: isHovering ? "rgba(34, 211, 238, 0.05)" : "transparent",
        borderColor: isHovering ? "rgba(34, 211, 238, 0.4)" : "rgba(34, 211, 238, 0.8)",
        borderWidth: isHovering ? "1px" : "1.5px"
      }}
      transition={{
        // Only controlling the scale/color animation via React state
        type: "spring",
        stiffness: 150,
        damping: 15,
        mass: 0.1
      }}
    />
  );
};