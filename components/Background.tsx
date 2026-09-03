import React from 'react';

interface BackgroundProps {
  isDarkMode?: boolean;
}

export const Background: React.FC<BackgroundProps> = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none transition-colors duration-300">
      {/* Subtle architectural grid pattern */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]"
      />
    </div>
  );
};
