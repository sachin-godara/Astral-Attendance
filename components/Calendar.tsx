
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CalendarProps {
  holidays: string[];
  extraWorkingDays: string[];
  onDateToggle: (date: string, isWeekend: boolean) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ holidays, extraWorkingDays, onDateToggle }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const days = [];
  // Empty slots for prev month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="w-full select-none mx-auto overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <button 
            onClick={handlePrevMonth} 
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors active:scale-95 border border-transparent hover:border-slate-700"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
        </button>
        <h3 className="text-slate-900 dark:text-white font-bold text-lg font-mono tracking-wider">
            {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button 
            onClick={handleNextMonth} 
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors active:scale-95 border border-transparent hover:border-slate-700"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-xs text-slate-500 uppercase font-bold py-1">
                {day}
            </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => {
            if (!date) return <div key={`empty-${index}`} />;
            
            const weekend = isWeekend(date);
            const dateStr = formatDate(date);
            const today = isToday(date);
            
            // A day is visually "selected" (Cyan/Holiday) if it is a day OFF.
            const isOff = weekend ? !extraWorkingDays.includes(dateStr) : holidays.includes(dateStr);

            return (
                <motion.button
                    key={dateStr}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onDateToggle(dateStr, weekend)}
                    className={`
                        aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative transition-all duration-200 touch-manipulation font-medium
                        ${isOff ? 'bg-cyan-600/90 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)] border border-cyan-400/50' : 
                          'bg-slate-200 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'}
                        ${today ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''}
                    `}
                >
                    <span className="relative z-10">{date.getDate()}</span>
                    {today && !isOff && (
                         <div className="absolute bottom-1.5 w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_5px_cyan]" />
                    )}
                </motion.button>
            );
        })}
      </div>
      
      <div className="mt-6 flex flex-col sm:flex-row gap-3 text-xs text-slate-500 justify-center">
        <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800/50 px-3 py-2 rounded-lg justify-center border border-slate-300 dark:border-slate-700/50">
            <div className="w-3 h-3 bg-cyan-600/90 rounded shadow-[0_0_5px_rgba(8,145,178,0.5)] flex-shrink-0"></div>
            <span className="text-slate-700 dark:text-slate-400">Holiday / Off Day</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800/50 px-3 py-2 rounded-lg justify-center border border-slate-300 dark:border-slate-700/50">
            <div className="w-3 h-3 bg-slate-300 dark:bg-slate-800/40 border border-slate-400 dark:border-slate-600 rounded flex-shrink-0"></div>
            <span className="text-slate-700 dark:text-slate-400">Working Class Day</span>
        </div>
      </div>
    </div>
  );
};