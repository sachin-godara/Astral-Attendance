
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
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
    <div className="w-full select-none mx-auto overflow-hidden text-zinc-900 dark:text-zinc-100">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <button 
          onClick={handlePrevMonth} 
          className="p-1.5 sm:p-2 rounded-lg text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
          aria-label="Previous Month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h4 className="font-semibold text-xs sm:text-sm tracking-wide uppercase font-mono">
          {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
        </h4>
        <button 
          onClick={handleNextMonth} 
          className="p-1.5 sm:p-2 rounded-lg text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
          aria-label="Next Month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-mono font-medium py-0.5">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {days.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} />;
          
          const weekend = isWeekend(date);
          const dateStr = formatDate(date);
          const today = isToday(date);
          
          // A day is visually marked as OFF if it is a weekend not designated as extra working, or in holidays list
          const isOff = weekend ? !extraWorkingDays.includes(dateStr) : holidays.includes(dateStr);

          return (
            <motion.button
              key={dateStr}
              whileTap={{ scale: 0.94 }}
              onClick={() => onDateToggle(dateStr, weekend)}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative transition-colors touch-manipulation font-mono font-medium min-h-[32px] sm:min-h-[36px]
                ${isOff 
                  ? 'bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white shadow-sm' 
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-transparent'}
                ${today ? 'ring-2 ring-zinc-900 dark:ring-zinc-100 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950' : ''}
              `}
            >
              <span>{date.getDate()}</span>
              {today && !isOff && (
                <div className="absolute bottom-1 w-1 h-1 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
              )}
            </motion.button>
          );
        })}
      </div>
      
      <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-2 text-[11px] sm:text-xs text-zinc-500">
        <div className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="w-2.5 h-2.5 bg-black dark:bg-white rounded-sm shrink-0"></div>
          <span className="text-zinc-700 dark:text-zinc-300 truncate">Holiday / Off</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="w-2.5 h-2.5 bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm shrink-0"></div>
          <span className="text-zinc-700 dark:text-zinc-300 truncate">Working Class</span>
        </div>
      </div>
    </div>
  );
};