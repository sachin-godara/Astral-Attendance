import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { AttendanceState, AttendanceStats } from '../types';
import { calculateStats } from '../utils/calculations';
import { Modal } from './Modal';
import { Calendar } from './Calendar';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const AnimatedCounter: React.FC<{ value: number; className?: string; toFixed?: number; isPerformanceMode?: boolean }> = ({ value, className, toFixed = 0, isPerformanceMode = false }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const springValue = useSpring(value, { stiffness: 60, damping: 20 });

  useEffect(() => {
    if (isPerformanceMode) {
        springValue.jump(value);
    } else {
        springValue.set(value);
    }
  }, [value, springValue, isPerformanceMode]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Number(latest).toFixed(toFixed);
      }
    });
  }, [springValue, toFixed]);

  return <span ref={ref} className={className}>{value.toFixed(toFixed)}</span>;
};

export const Dashboard: React.FC<{ isPerformanceMode?: boolean; isDarkMode?: boolean }> = ({ isPerformanceMode = false, isDarkMode = true }) => {
  const [state, setState] = useState<AttendanceState>(() => {
    const saved = localStorage.getItem('attendanceState');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
    return {
      totalClasses: 0,
      absentClasses: 0,
      examDate: '',
      holidays: [],
      extraWorkingDays: []
    };
  });

  useEffect(() => {
    localStorage.setItem('attendanceState', JSON.stringify(state));
  }, [state]);

  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [inputMode, setInputMode] = useState<'absent' | 'present'>('absent');

  useEffect(() => {
    setStats(calculateStats(state));
  }, [state]);

  const handleChange = useCallback((field: keyof AttendanceState, value: any) => {
    setState(prev => {
        const newState = { ...prev, [field]: value };
        
        if (field === 'totalClasses') {
            const newTotal = Math.max(0, Number(value));
            newState.totalClasses = newTotal;
            if (newState.absentClasses > newTotal) {
                newState.absentClasses = newTotal;
            }
        } else if (field === 'absentClasses') {
            const newAbsent = Math.max(0, Number(value));
            if (newAbsent > newState.totalClasses) {
                newState.absentClasses = newState.totalClasses;
            } else {
                newState.absentClasses = newAbsent;
            }
        }
        
        return newState;
    });
  }, []);

  const handleAttendanceChange = (val: number) => {
    if (inputMode === 'absent') {
      handleChange('absentClasses', val);
    } else {
      const currentTotal = state.totalClasses;
      const validPresent = Math.min(Math.max(0, val), currentTotal);
      const newAbsent = currentTotal - validPresent;
      handleChange('absentClasses', newAbsent);
    }
  };

  const toggleHoliday = useCallback((date: string, isWeekend: boolean) => {
    setState(prev => {
        if (isWeekend) {
            const isWorking = prev.extraWorkingDays.includes(date);
            if (isWorking) {
                return { ...prev, extraWorkingDays: prev.extraWorkingDays.filter(d => d !== date) };
            } else {
                return { ...prev, extraWorkingDays: [...prev.extraWorkingDays, date] };
            }
        } else {
            const isHoliday = prev.holidays.includes(date);
            if (isHoliday) {
                return { ...prev, holidays: prev.holidays.filter(d => d !== date) };
            } else {
                return { ...prev, holidays: [...prev.holidays, date] };
            }
        }
    });
  }, []);

  const projectionData = useMemo(() => {
    const data = [];
    const currentAttended = Math.max(0, state.totalClasses - state.absentClasses);
    const startPct = state.totalClasses === 0 ? 0 : (currentAttended / state.totalClasses) * 100;

    data.push({
      name: 'Now',
      attendAll: parseFloat(startPct.toFixed(1)),
      bunkAll: parseFloat(startPct.toFixed(1)),
    });

    for (let i = 1; i <= 7; i++) {
        const added = i * 6;
        const newTotal = state.totalClasses + added;
        const attendedIfAll = currentAttended + added;
        const attendedIfNone = currentAttended;

        data.push({
            name: `+${i}d`,
            attendAll: parseFloat(((attendedIfAll / newTotal) * 100).toFixed(1)),
            bunkAll: parseFloat(((attendedIfNone / newTotal) * 100).toFixed(1)),
        });
    }
    return data;
  }, [state.totalClasses, state.absentClasses]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const attendedCount = Math.max(0, state.totalClasses - state.absentClasses);
  const attendanceInputValue = inputMode === 'absent' ? state.absentClasses : attendedCount;
  const customHolidaysCount = state.holidays.length;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 md:py-16 md:px-12 max-w-7xl mx-auto overflow-x-hidden">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 lg:gap-12"
      >
        {/* Controls Section */}
        <motion.div variants={itemVariants} className="space-y-6 md:space-y-8">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl neon-glow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl transform translate-x-16 -translate-y-16"></div>
            
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-slate-900 dark:text-white">Input Data</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-slate-500 dark:text-slate-400 text-xs md:text-sm uppercase tracking-widest font-bold">Total Classes Held</label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  enterKeyHint="next"
                  min="0"
                  value={state.totalClasses || ''}
                  onChange={(e) => handleChange('totalClasses', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-100 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-700/50 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all text-lg appearance-none"
                  placeholder="e.g. 120"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <label className="text-slate-500 dark:text-slate-400 text-xs md:text-sm uppercase tracking-widest font-bold">
                        {inputMode === 'absent' ? 'Classes Absent' : 'Classes Attended'}
                    </label>
                    
                    <div className="bg-slate-200 dark:bg-slate-950/80 p-1 rounded-xl flex text-xs sm:text-sm font-bold border border-slate-300 dark:border-slate-800 w-full sm:w-auto">
                        <button
                            onClick={() => setInputMode('absent')}
                            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg transition-all ${inputMode === 'absent' ? 'bg-red-500/20 text-red-600 dark:text-red-300 shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
                        >
                            Absent
                        </button>
                        <button
                            onClick={() => setInputMode('present')}
                            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg transition-all ${inputMode === 'present' ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
                        >
                            Present
                        </button>
                    </div>
                </div>
                
                <style>{`
                  /* Hide number spinners */
                  input[type=number]::-webkit-inner-spin-button, 
                  input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                  }
                  input[type=number] {
                    -moz-appearance: textfield;
                  }
                `}</style>
                
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  enterKeyHint="next"
                  min="0"
                  max={state.totalClasses}
                  value={attendanceInputValue || ''}
                  onChange={(e) => handleAttendanceChange(parseInt(e.target.value) || 0)}
                  className={`w-full bg-slate-100 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-700/50 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none transition-all text-lg appearance-none ${inputMode === 'absent' ? 'focus:border-red-500/50' : 'focus:border-cyan-500/50'}`}
                  placeholder={inputMode === 'absent' ? "e.g. 15" : "e.g. 105"}
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-500 dark:text-slate-400 text-xs md:text-sm uppercase tracking-widest font-bold">Exam Start Date</label>
                <input
                  type="date"
                  value={state.examDate}
                  onChange={(e) => handleChange('examDate', e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-700/50 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all text-lg dark:[color-scheme:dark]"
                />
                {stats?.hasExamDate && (
                    <div className="flex justify-between items-center px-1">
                        <span className="text-xs text-slate-500 font-medium">
                            {stats.classesUntilExam} classes remaining
                        </span>
                        <span className="text-xs text-slate-600">
                            (Includes {state.extraWorkingDays.length} extra days)
                        </span>
                    </div>
                )}
              </div>

               <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-slate-400 text-xs md:text-sm uppercase tracking-widest font-bold">Calendar</label>
                  </div>
                  
                  <button 
                    onClick={() => setIsHolidayModalOpen(true)}
                    className="w-full bg-slate-100 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-200 dark:hover:bg-slate-800/40 rounded-2xl px-5 py-4 text-left flex justify-between items-center group transition-all"
                  >
                     <span className="text-slate-700 dark:text-slate-300 text-base truncate mr-2">
                        {customHolidaysCount === 0 && state.extraWorkingDays.length === 0 
                            ? "Configure Holidays" 
                            : `${customHolidaysCount} Holidays, ${state.extraWorkingDays.length} Working Weekends`}
                     </span>
                     <span className="text-cyan-500 bg-cyan-500/10 p-2 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                     </span>
                  </button>
               </div>
            </div>
          </div>
        </motion.div>

        {/* Analytics Section */}
        <motion.div variants={itemVariants} className="space-y-6 md:space-y-8">
          <div className="glass-panel p-6 sm:p-10 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center text-center h-full min-h-[400px]">
            <motion.div 
              className={`absolute -inset-20 rounded-full opacity-30 transition-colors duration-1000 ${stats?.isSafe ? 'bg-cyan-500' : 'bg-red-500'}`}
              style={{
                background: isPerformanceMode 
                    ? `radial-gradient(circle, ${stats?.isSafe ? 'rgba(6,182,212,0.2)' : 'rgba(239,68,68,0.2)'} 0%, rgba(0,0,0,0) 70%)`
                    : `radial-gradient(circle, ${stats?.isSafe ? 'rgba(6,182,212,0.4)' : 'rgba(239,68,68,0.4)'} 0%, rgba(0,0,0,0) 70%)`,
                filter: isPerformanceMode ? 'none' : 'blur(100px)'
              }}
              variants={{
                performance: { scale: 1, rotate: 0 },
                astral: { scale: [1, 1.15, 1], rotate: [0, 180, 0] }
              }}
              animate={isPerformanceMode ? "performance" : "astral"}
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            />

            <h3 className="text-slate-500 dark:text-slate-400 font-bold mb-6 uppercase tracking-[0.2em] text-xs md:text-sm z-10 opacity-70">Current Status</h3>
            <div className="relative z-10 mb-6">
                <svg className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 transform -rotate-90" viewBox="0 0 256 256">
                    <defs>
                      <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#22d3ee" />
                      </filter>
                      <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#f87171" />
                      </filter>
                    </defs>
                    <circle cx="128" cy="128" r="115" stroke="currentColor" className="text-slate-200 dark:text-slate-900" strokeWidth="18" fill="transparent" />
                    <motion.circle 
                        cx="128" cy="128" r="115" 
                        stroke={stats?.isSafe ? "#22d3ee" : "#f87171"} 
                        strokeWidth="18" 
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 115}
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: 2 * Math.PI * 115 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 115 * (1 - (stats?.currentPercentage || 0) / 100) }}
                        transition={{ duration: 2, type: "spring", stiffness: 40, damping: 15 }}
                        style={{ filter: `url(#glow-${stats?.isSafe ? 'cyan' : 'red'})` }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl sm:text-7xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums drop-shadow-2xl">
                        <AnimatedCounter value={stats?.currentPercentage || 0} toFixed={1} isPerformanceMode={isPerformanceMode} />%
                    </span>

                    <AnimatePresence mode="wait">
                      <motion.span
                        key={stats?.isSafe ? 'safe' : 'danger'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`mt-4 px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${stats?.isSafe ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'} border`}
                      >
                          {stats?.isSafe ? 'Safe' : 'Danger'}
                      </motion.span>
                    </AnimatePresence>
                </div>
            </div>

            <div className="relative z-10 flex gap-8 text-sm font-bold">
                <div className="flex flex-col items-center">
                    <span className="text-cyan-600 dark:text-cyan-400 text-lg tabular-nums font-black"><AnimatedCounter value={attendedCount} isPerformanceMode={isPerformanceMode} /></span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Attended</span>
                </div>
                <div className="w-px h-10 bg-slate-200 dark:bg-slate-800" />
                <div className="flex flex-col items-center">
                    <span className="text-red-600 dark:text-red-400 text-lg tabular-nums font-black"><AnimatedCounter value={state.absentClasses} isPerformanceMode={isPerformanceMode} /></span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Missed</span>
                </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-12 h-12 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.95a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM16.122 17.536L16.121 17.535l-.001-.001a1 1 0 111.414-1.414l.001.001.001.001a1 1 0 11-1.414 1.414zM4.929 16.364l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 011.414-1.414z" /></svg>
                </div>
                <h4 className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-4">Bunk Potential</h4>
                {stats?.hasExamDate ? (
                  <>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-slate-900 dark:text-white tabular-nums"><AnimatedCounter value={stats?.bunkableClasses || 0} isPerformanceMode={isPerformanceMode} /></span>
                        <span className="text-sm text-slate-500 font-bold">classes</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 leading-relaxed font-medium">
                        You can skip <span className="text-cyan-600 dark:text-cyan-400 font-black"><AnimatedCounter value={stats?.bunkableDays || 0} isPerformanceMode={isPerformanceMode} /> full days</span> safely.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-600 italic font-medium">Enter exam date to calculate bunkability.</p>
                )}
            </div>

            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group">
                <h4 className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-4">
                  {stats?.hasExamDate ? (stats?.isPossibleToReachTarget ? 'Requirement' : 'Terminal Alert') : 'Immediate Requirement'}
                </h4>
                {(!stats?.hasExamDate || stats?.isPossibleToReachTarget) ? (
                  <>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-slate-900 dark:text-white tabular-nums"><AnimatedCounter value={stats?.requiredClasses || 0} isPerformanceMode={isPerformanceMode} /></span>
                        <span className="text-sm text-slate-500 font-bold">classes</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 leading-relaxed font-medium">
                        Must attend <span className="text-purple-600 dark:text-purple-400 font-black"><AnimatedCounter value={stats?.requiredDays || 0} isPerformanceMode={isPerformanceMode} /> full days</span> to hit 75%.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-red-500 tabular-nums"><AnimatedCounter value={stats?.maxAchievablePercentage || 0} toFixed={1} isPerformanceMode={isPerformanceMode} />%</span>
                    </div>
                    <p className="text-sm text-red-500/70 dark:text-red-400/70 mt-4 leading-relaxed font-bold uppercase tracking-tighter">
                        75% is unreachable before the exam period.
                    </p>
                  </>
                )}
            </div>

            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group sm:col-span-2 lg:col-span-1">
                <h4 className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-4">Tomorrow Risk</h4>
                <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-black tabular-nums ${(stats?.tomorrowImpact || 0) < 75 ? 'text-red-600 dark:text-red-500' : 'text-orange-600 dark:text-orange-400'}`}>
                        <AnimatedCounter value={stats?.tomorrowImpact || 0} toFixed={1} isPerformanceMode={isPerformanceMode} />%
                    </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 leading-relaxed font-medium">
                    Projected drop if you miss all classes tomorrow.
                </p>
            </div>
        </motion.div>

        {/* Projection Chart Section */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-2">
            <div className="glass-panel p-6 sm:p-10 rounded-3xl relative overflow-hidden">
                <h3 className="text-slate-500 dark:text-slate-400 font-bold mb-10 uppercase tracking-[0.2em] text-xs md:text-sm text-center">7-Day Trajectory Forecast</h3>
                <div className="h-[250px] sm:h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCyan" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="1 5" stroke={isDarkMode ? "#1e293b" : "#e2e8f0"} vertical={false} />
                            <XAxis dataKey="name" stroke={isDarkMode ? "#475569" : "#94a3b8"} fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                            <YAxis stroke={isDarkMode ? "#475569" : "#94a3b8"} fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: isDarkMode ? '#020617' : '#ffffff', 
                                    borderColor: isDarkMode ? '#1e293b' : '#e2e8f0', 
                                    borderRadius: '16px', 
                                    color: isDarkMode ? '#f8fafc' : '#0f172a', 
                                    fontSize: '12px' 
                                }} 
                                cursor={{ stroke: isDarkMode ? '#334155' : '#cbd5e1' }} 
                            />
                            <ReferenceLine y={75} stroke={isDarkMode ? "#334155" : "#cbd5e1"} strokeDasharray="3 3" />
                            <Area type="monotone" dataKey="attendAll" name="Perfect Attendance" stroke="#22d3ee" fillOpacity={1} fill="url(#colorCyan)" strokeWidth={3} isAnimationActive={!isPerformanceMode} />
                            <Area type="monotone" dataKey="bunkAll" name="Full Bunk" stroke="#f87171" fillOpacity={1} fill="url(#colorRed)" strokeWidth={3} isAnimationActive={!isPerformanceMode} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </motion.div>
      </motion.div>

      <Modal isOpen={isHolidayModalOpen} onClose={() => setIsHolidayModalOpen(false)} title="Attendance Calendar">
        <Calendar holidays={state.holidays} extraWorkingDays={state.extraWorkingDays} onDateToggle={toggleHoliday} />
      </Modal>
    </div>
  );
};