import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense, lazy } from 'react';
import { motion, useSpring } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  History,
  Check,
  X,
  Settings,
  Sliders,
  Download,
  Upload,
  Plus,
  Minus,
  Clock
} from 'lucide-react';
import { AttendanceState } from '../types';
import { calculateStats } from '../utils/calculations';
import { Modal } from './Modal';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';

const Calendar = lazy(() => import('./Calendar').then(m => ({ default: m.Calendar })));

interface SavedSession {
  state: AttendanceState;
  inputMode: 'absent' | 'present';
  timestamp: string;
}

interface ToastMessage {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const AnimatedCounter: React.FC<{ value: number; className?: string; toFixed?: number }> = ({ 
  value, 
  className, 
  toFixed = 0 
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const springValue = useSpring(value, { stiffness: 80, damping: 20 });

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Number(latest).toFixed(toFixed);
      }
    });
  }, [springValue, toFixed]);

  return <span ref={ref} className={className}>{value.toFixed(toFixed)}</span>;
};

interface DashboardProps {
  isDarkMode?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ isDarkMode = true }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simUnit, setSimUnit] = useState<'days' | 'classes'>('days');
  const [simBunkValue, setSimBunkValue] = useState(0);
  const [simAttendValue, setSimAttendValue] = useState(0);

  const [state, setState] = useState<AttendanceState>(() => {
    const saved = localStorage.getItem('attendanceState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.totalClasses === 'number') {
          return {
            totalClasses: parsed.totalClasses,
            absentClasses: parsed.absentClasses ?? 0,
            examDate: parsed.examDate ?? '',
            holidays: Array.isArray(parsed.holidays) ? parsed.holidays : [],
            extraWorkingDays: Array.isArray(parsed.extraWorkingDays) ? parsed.extraWorkingDays : [],
            targetPercentage: parsed.targetPercentage ?? 75,
            dailyClasses: parsed.dailyClasses ?? 6,
            includeToday: parsed.includeToday ?? true
          };
        }
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
    const backup = localStorage.getItem('lastAttendanceBackup') || localStorage.getItem('lastActiveSession');
    if (backup) {
      try {
        const parsedBackup = JSON.parse(backup);
        if (parsedBackup?.state?.totalClasses) {
          return {
            ...parsedBackup.state,
            targetPercentage: parsedBackup.state.targetPercentage ?? 75,
            dailyClasses: parsedBackup.state.dailyClasses ?? 6,
            includeToday: parsedBackup.state.includeToday ?? true
          };
        }
      } catch (e) {}
    }
    return {
      totalClasses: 84,
      absentClasses: 18,
      examDate: '',
      holidays: [],
      extraWorkingDays: [],
      targetPercentage: 75,
      dailyClasses: 6,
      includeToday: true
    };
  });

  const [inputMode, setInputMode] = useState<'absent' | 'present'>(() => {
    const saved = localStorage.getItem('attendanceInputMode');
    return saved === 'present' ? 'present' : 'absent';
  });

  const [lastBackup, setLastBackup] = useState<SavedSession | null>(() => {
    const backup = localStorage.getItem('lastAttendanceBackup') || localStorage.getItem('lastActiveSession');
    if (backup) {
      try {
        return JSON.parse(backup);
      } catch (e) {
        console.error('Failed to parse last backup', e);
      }
    }
    return null;
  });

  const [lastSavedTime, setLastSavedTime] = useState<string>(() => {
    return localStorage.getItem('attendanceLastSavedTime') || '';
  });

  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('attendanceState', JSON.stringify(state));
        localStorage.setItem('attendanceInputMode', inputMode);
        const now = new Date().toISOString();
        localStorage.setItem('attendanceLastSavedTime', now);
        setLastSavedTime(now);

        if (state.totalClasses > 0) {
          const activeSession: SavedSession = {
            state,
            inputMode,
            timestamp: now
          };
          localStorage.setItem('lastActiveSession', JSON.stringify(activeSession));
        }
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [state, inputMode]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const stats = useMemo(() => calculateStats(state), [state]);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);

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

  const handleRestore = (sessionToRestore?: SavedSession | null) => {
    const target = sessionToRestore || lastBackup;
    if (target && target.state) {
      setState(target.state);
      if (target.inputMode) {
        setInputMode(target.inputMode);
      }
      setToast({
        message: `Restored last data: ${target.state.totalClasses} classes (${target.state.absentClasses} absent)`
      });
    }
  };

  const handleReset = () => {
    if (state.totalClasses > 0) {
      const backup: SavedSession = {
        state: { ...state },
        inputMode,
        timestamp: new Date().toISOString()
      };
      try {
        localStorage.setItem('lastAttendanceBackup', JSON.stringify(backup));
        setLastBackup(backup);
      } catch (e) {}

      setToast({
        message: `Data cleared. Previous session saved.`,
        actionLabel: 'Restore Last Data',
        onAction: () => handleRestore(backup)
      });
    }

    setState(prev => ({
      totalClasses: 0,
      absentClasses: 0,
      examDate: '',
      holidays: [],
      extraWorkingDays: [],
      targetPercentage: prev.targetPercentage ?? 75,
      dailyClasses: prev.dailyClasses ?? 6
    }));
  };

  const handleExportJson = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `astral-attendance-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setToast({ message: "Backup downloaded as JSON." });
    } catch (e) {
      setToast({ message: "Failed to export backup." });
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed.totalClasses === 'number' && typeof parsed.absentClasses === 'number') {
          setState({
            totalClasses: Math.max(0, parsed.totalClasses),
            absentClasses: Math.max(0, parsed.absentClasses),
            examDate: parsed.examDate || '',
            holidays: Array.isArray(parsed.holidays) ? parsed.holidays : [],
            extraWorkingDays: Array.isArray(parsed.extraWorkingDays) ? parsed.extraWorkingDays : [],
            targetPercentage: parsed.targetPercentage ?? 75,
            dailyClasses: parsed.dailyClasses ?? 6
          });
          setToast({ message: "Attendance data successfully imported." });
        } else {
          setToast({ message: "Invalid backup file structure." });
        }
      } catch (err) {
        setToast({ message: "Failed to parse JSON file." });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadSample = () => {
    if (state.totalClasses > 0 && (state.totalClasses !== 96 || state.absentClasses !== 20)) {
      const backup: SavedSession = {
        state: { ...state },
        inputMode,
        timestamp: new Date().toISOString()
      };
      try {
        localStorage.setItem('lastAttendanceBackup', JSON.stringify(backup));
        setLastBackup(backup);
      } catch (e) {}

      setToast({
        message: 'Sample data loaded.',
        actionLabel: 'Restore Your Data',
        onAction: () => handleRestore(backup)
      });
    }

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 45);
    const dateStr = futureDate.toISOString().split('T')[0];

    setState(prev => ({
      totalClasses: 96,
      absentClasses: 20,
      examDate: dateStr,
      holidays: [],
      extraWorkingDays: [],
      targetPercentage: prev.targetPercentage ?? 75,
      dailyClasses: prev.dailyClasses ?? 6
    }));
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

  const attendedCount = Math.max(0, state.totalClasses - state.absentClasses);
  const attendanceInputValue = inputMode === 'absent' ? state.absentClasses : attendedCount;
  const holidaysCount = state.holidays.length + state.extraWorkingDays.length;

  // Calendar-Aware 7-Day Trajectory Forecast
  const projectionData = useMemo(() => {
    const data = [];
    const currentAttended = Math.max(0, state.totalClasses - state.absentClasses);
    const startPct = state.totalClasses === 0 ? 0 : (currentAttended / state.totalClasses) * 100;
    const effectiveDaily = state.dailyClasses ?? 6;
    const includeToday = Boolean(state.includeToday);

    data.push({
      name: includeToday ? 'Now' : 'Today',
      attendAll: parseFloat(startPct.toFixed(1)),
      bunkAll: parseFloat(startPct.toFixed(1)),
    });

    const holidaySet = new Set(state.holidays);
    const workingSet = new Set(state.extraWorkingDays);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    let cumulativeTotal = state.totalClasses;
    let cumulativeAttendedAll = currentAttended;
    let cumulativeAttendedBunk = currentAttended;

    const startOffset = includeToday ? 0 : 1;
    const endOffset = includeToday ? 6 : 7;

    for (let i = startOffset; i <= endOffset; i++) {
      const targetDate = new Date(todayDate);
      targetDate.setDate(todayDate.getDate() + i);

      const y = targetDate.getFullYear();
      const m = String(targetDate.getMonth() + 1).padStart(2, '0');
      const d = String(targetDate.getDate()).padStart(2, '0');
      const dStr = `${y}-${m}-${d}`;
      const dayOfWeek = targetDate.getDay();
      const isWknd = dayOfWeek === 0 || dayOfWeek === 6;
      const isClassDay = (!isWknd && !holidaySet.has(dStr)) || (isWknd && workingSet.has(dStr));

      const added = isClassDay ? effectiveDaily : 0;
      cumulativeTotal += added;
      cumulativeAttendedAll += added;

      const attendPct = cumulativeTotal === 0 ? 0 : (cumulativeAttendedAll / cumulativeTotal) * 100;
      const bunkPct = cumulativeTotal === 0 ? 0 : (cumulativeAttendedBunk / cumulativeTotal) * 100;

      let dayLabel = isClassDay ? dayNames[dayOfWeek] : `${dayNames[dayOfWeek]}*`;
      if (i === 0) {
        dayLabel = isClassDay ? 'Today' : 'Today*';
      }

      data.push({
        name: dayLabel,
        attendAll: parseFloat(attendPct.toFixed(1)),
        bunkAll: parseFloat(bunkPct.toFixed(1)),
      });
    }
    return data;
  }, [state.totalClasses, state.absentClasses, state.dailyClasses, state.holidays, state.extraWorkingDays, state.includeToday]);

  const percentage = stats?.currentPercentage || 0;
  const targetThreshold = stats?.targetPercentage || 75;
  const isSafe = stats?.isSafe || false;
  const marginFromThreshold = percentage - targetThreshold;

  // Simulator Calculations
  const effectiveDaily = state.dailyClasses ?? 6;
  const simBunkClasses = simUnit === 'days' ? simBunkValue * effectiveDaily : simBunkValue;
  const simAttendClasses = simUnit === 'days' ? simAttendValue * effectiveDaily : simAttendValue;
  const simTotal = state.totalClasses + simBunkClasses + simAttendClasses;
  const simAttended = attendedCount + simAttendClasses;
  const simPercentage = simTotal === 0 ? 0 : (simAttended / simTotal) * 100;
  const simDelta = simPercentage - percentage;
  const isSimulationActive = simBunkClasses > 0 || simAttendClasses > 0;

  const handleSimUnitChange = (newUnit: 'days' | 'classes') => {
    if (newUnit === simUnit) return;
    if (newUnit === 'classes') {
      setSimBunkValue(prev => prev * effectiveDaily);
      setSimAttendValue(prev => prev * effectiveDaily);
    } else {
      setSimBunkValue(prev => Math.round(prev / effectiveDaily));
      setSimAttendValue(prev => Math.round(prev / effectiveDaily));
    }
    setSimUnit(newUnit);
  };


  return (
    <div id="attendance-dashboard" className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-10">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 sm:pb-4 mb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 font-mono">
              Attendance
            </h1>
            <div 
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[11px] font-mono text-zinc-500 select-none"
              title={lastSavedTime ? `Remembered & saved (${new Date(lastSavedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : "Automatically saved"}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Saved</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scroll-container no-scrollbar">
          <input 
            ref={fileInputRef} 
            type="file" 
            accept=".json" 
            onChange={handleImportJson} 
            className="hidden" 
            aria-label="Import attendance JSON backup"
          />

          {/* Settings Trigger */}
          <button
            id="btn-settings-toggle"
            type="button"
            onClick={() => {
              setIsSettingsOpen(prev => !prev);
              if (isSimulatorOpen) setIsSimulatorOpen(false);
            }}
            title="Configure target percentage and classes per day"
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl border text-xs font-mono font-medium transition-all shrink-0 cursor-pointer min-h-[38px] ${
              isSettingsOpen 
                ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black shadow-xs' 
                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Target: {targetThreshold}%</span>
          </button>

          {/* Simulator Trigger */}
          <button
            id="btn-toggle-simulator"
            type="button"
            onClick={() => {
              setIsSimulatorOpen(prev => !prev);
              if (isSettingsOpen) setIsSettingsOpen(false);
            }}
            title="Open What-If Bunk & Attendance Sandbox"
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl border text-xs font-mono font-medium transition-all shrink-0 cursor-pointer min-h-[38px] ${
              isSimulatorOpen 
                ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black shadow-xs' 
                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Simulator</span>
          </button>

          {/* Export JSON */}
          <button
            id="btn-export-json"
            type="button"
            onClick={handleExportJson}
            title="Download JSON data backup"
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 sm:py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all shrink-0 cursor-pointer min-h-[38px]"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Import JSON */}
          <button
            id="btn-import-json"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Import attendance JSON backup"
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 sm:py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all shrink-0 cursor-pointer min-h-[38px]"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline">Import</span>
          </button>

          {lastBackup && (
            <button
              id="btn-restore-last-data"
              type="button"
              onClick={() => handleRestore(lastBackup)}
              title={`Restore data of last time (${lastBackup.state.totalClasses} total, ${lastBackup.state.absentClasses} absent)`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all shrink-0 cursor-pointer min-h-[38px]"
            >
              <History className="w-3.5 h-3.5 text-zinc-500" />
              <span>Restore</span>
            </button>
          )}

          <button
            id="btn-sample-data"
            onClick={handleLoadSample}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all shrink-0 cursor-pointer min-h-[38px]"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>Sample</span>
          </button>
          
          <button
            id="btn-reset-data"
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-950/20 active:scale-95 transition-all shrink-0 cursor-pointer min-h-[38px]"
            title="Reset all inputs to 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Settings Panel (Collapsible) */}
      {isSettingsOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mb-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-sm space-y-3 font-mono text-xs"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <span className="font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Academic Criteria Configuration
            </span>
            <button 
              type="button" 
              onClick={() => setIsSettingsOpen(false)}
              className="text-zinc-400 hover:text-black dark:hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Percentage Selector */}
            <div className="space-y-1.5">
              <label className="text-zinc-500 uppercase tracking-wider block text-[11px]">
                Target Attendance Threshold
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {[65, 70, 75, 80, 85].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleChange('targetPercentage', pct)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                      targetThreshold === pct
                        ? 'bg-black text-white dark:bg-white dark:text-black font-bold'
                        : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={state.targetPercentage || 75}
                  onChange={(e) => handleChange('targetPercentage', Math.min(100, Math.max(1, parseInt(e.target.value) || 75)))}
                  className="w-16 px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-center text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  title="Custom target percentage"
                />
              </div>
            </div>

            {/* Daily Classes Selector */}
            <div className="space-y-1.5">
              <label className="text-zinc-500 uppercase tracking-wider block text-[11px]">
                Standard Classes Per Day
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {[4, 5, 6, 7, 8].map(periods => (
                  <button
                    key={periods}
                    type="button"
                    onClick={() => handleChange('dailyClasses', periods)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                      effectiveDaily === periods
                        ? 'bg-black text-white dark:bg-white dark:text-black font-bold'
                        : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    {periods} periods
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={state.dailyClasses || 6}
                  onChange={(e) => handleChange('dailyClasses', Math.max(1, parseInt(e.target.value) || 6))}
                  className="w-16 px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-center text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  title="Custom classes per day"
                />
              </div>
            </div>

            {/* Today's Classes Inclusion */}
            <div className="space-y-2 sm:col-span-2 pt-2 border-t border-zinc-200/80 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <label className="text-zinc-500 uppercase tracking-wider block text-[11px] font-semibold">
                    Include Today's Classes?
                  </label>
                  <p className="text-[11px] text-zinc-500 font-sans">
                    {state.includeToday
                      ? "Morning check: Today's classes pending → counted towards exam allowance."
                      : "Evening check: Today's classes already counted in Total → future begins tomorrow."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-200/60 dark:bg-zinc-800 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleChange('includeToday', true)}
                    className={`w-full py-1.5 px-3 rounded-md text-xs transition-all cursor-pointer font-medium text-center ${
                      state.includeToday
                        ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 font-bold shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    Include (Morning)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('includeToday', false)}
                    className={`w-full py-1.5 px-3 rounded-md text-xs transition-all cursor-pointer font-medium text-center ${
                      !state.includeToday
                        ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 font-bold shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    Exclude (Evening)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* What-If Simulator Sandbox Card (Collapsible) */}
      {isSimulatorOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mb-4 p-4 sm:p-5 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/90 shadow-md space-y-4 font-mono text-xs"
        >
          {/* Header & Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                What-If Sandbox
              </span>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-2.5">
              {/* Unit Toggle: Days vs Classes */}
              <div className="inline-flex items-center p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => handleSimUnitChange('days')}
                  className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                    simUnit === 'days'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 font-bold shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  By Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSimUnitChange('classes')}
                  className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                    simUnit === 'classes'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 font-bold shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  By Classes
                </button>
              </div>

              {isSimulationActive && (
                <button
                  type="button"
                  onClick={() => {
                    setSimBunkValue(0);
                    setSimAttendValue(0);
                  }}
                  className="text-xs text-zinc-500 hover:text-black dark:hover:text-white underline cursor-pointer"
                >
                  Reset
                </button>
              )}

              <button 
                type="button" 
                onClick={() => setIsSimulatorOpen(false)}
                className="text-zinc-400 hover:text-black dark:hover:text-white p-1 cursor-pointer"
                title="Close Sandbox"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            {/* Slider 1: Skip days / classes */}
            <div className="space-y-2 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-zinc-500">Simulate Bunking</span>
                <div className="text-right">
                  <span className="font-bold text-red-500 block">
                    {simBunkValue} {simUnit === 'days' ? (simBunkValue === 1 ? 'day' : 'days') : (simBunkValue === 1 ? 'class' : 'classes')}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {simUnit === 'days' ? `(${simBunkClasses} cls)` : `(≈ ${(simBunkValue / effectiveDaily).toFixed(1)} days)`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSimBunkValue(prev => Math.max(0, prev - 1))}
                  disabled={simBunkValue === 0}
                  className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed font-bold touch-manipulation text-sm sm:text-xs select-none active:scale-95 shrink-0"
                  title="Decrease by 1"
                >
                  -
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max={simUnit === 'days' ? 14 : Math.max(50, 14 * effectiveDaily)}
                  value={simBunkValue} 
                  onChange={(e) => setSimBunkValue(parseInt(e.target.value) || 0)}
                  className="flex-1 accent-red-500 cursor-pointer touch-manipulation py-1"
                />
                <button
                  type="button"
                  onClick={() => setSimBunkValue(prev => Math.min(simUnit === 'days' ? 14 : Math.max(50, 14 * effectiveDaily), prev + 1))}
                  className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer font-bold touch-manipulation text-sm sm:text-xs select-none active:scale-95 shrink-0"
                  title="Increase by 1"
                >
                  +
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-zinc-400 shrink-0">Quick:</span>
                {simUnit === 'days' ? (
                  [1, 2, 3, 5].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSimBunkValue(prev => Math.min(14, prev + d))}
                      className="px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-[10px] sm:text-[11px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 cursor-pointer touch-manipulation active:scale-95 shrink-0"
                    >
                      +{d}d
                    </button>
                  ))
                ) : (
                  [1, 2, 3, effectiveDaily].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSimBunkValue(prev => Math.min(Math.max(50, 14 * effectiveDaily), prev + c))}
                      className="px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-[10px] sm:text-[11px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 cursor-pointer touch-manipulation active:scale-95 shrink-0"
                    >
                      +{c === effectiveDaily ? `${c} (1d)` : `${c}c`}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Slider 2: Attend days / classes */}
            <div className="space-y-2 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-zinc-500">Simulate Attending</span>
                <div className="text-right">
                  <span className="font-bold text-emerald-500 block">
                    {simAttendValue} {simUnit === 'days' ? (simAttendValue === 1 ? 'day' : 'days') : (simAttendValue === 1 ? 'class' : 'classes')}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {simUnit === 'days' ? `(${simAttendClasses} cls)` : `(≈ ${(simAttendValue / effectiveDaily).toFixed(1)} days)`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSimAttendValue(prev => Math.max(0, prev - 1))}
                  disabled={simAttendValue === 0}
                  className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed font-bold touch-manipulation text-sm sm:text-xs select-none active:scale-95 shrink-0"
                  title="Decrease by 1"
                >
                  -
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max={simUnit === 'days' ? 21 : Math.max(60, 21 * effectiveDaily)}
                  value={simAttendValue} 
                  onChange={(e) => setSimAttendValue(parseInt(e.target.value) || 0)}
                  className="flex-1 accent-emerald-500 cursor-pointer touch-manipulation py-1"
                />
                <button
                  type="button"
                  onClick={() => setSimAttendValue(prev => Math.min(simUnit === 'days' ? 21 : Math.max(60, 21 * effectiveDaily), prev + 1))}
                  className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer font-bold touch-manipulation text-sm sm:text-xs select-none active:scale-95 shrink-0"
                  title="Increase by 1"
                >
                  +
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-zinc-400 shrink-0">Quick:</span>
                {simUnit === 'days' ? (
                  [1, 2, 3, 5].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSimAttendValue(prev => Math.min(21, prev + d))}
                      className="px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-[10px] sm:text-[11px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 cursor-pointer touch-manipulation active:scale-95 shrink-0"
                    >
                      +{d}d
                    </button>
                  ))
                ) : (
                  [1, 2, 3, effectiveDaily].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSimAttendValue(prev => Math.min(Math.max(60, 21 * effectiveDaily), prev + c))}
                      className="px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-[10px] sm:text-[11px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 cursor-pointer touch-manipulation active:scale-95 shrink-0"
                    >
                      +{c === effectiveDaily ? `${c} (1d)` : `${c}c`}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Simulation Preview Result */}
            <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex flex-col justify-between h-full space-y-2">
              <div>
                <span className="text-[10px] uppercase text-zinc-500 tracking-wider font-semibold">Simulated Standing</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-zinc-950 dark:text-zinc-50">
                    {simPercentage.toFixed(1)}%
                  </span>
                  <span className={`text-xs font-bold ${
                    simDelta > 0 ? 'text-emerald-500' : simDelta < 0 ? 'text-red-500' : 'text-zinc-400'
                  }`}>
                    {simDelta > 0 ? `+${simDelta.toFixed(1)}%` : simDelta < 0 ? `${simDelta.toFixed(1)}%` : '0.0%'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700/60 space-y-1">
                <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                  Net: <span className="text-emerald-500 font-bold">+{simAttendClasses}</span> att, <span className="text-red-500 font-bold">-{simBunkClasses}</span> missed
                </div>
                <div className="text-[11px] font-medium">
                  {simPercentage >= targetThreshold 
                    ? <span className="text-emerald-600 dark:text-emerald-400">✓ Stays safe (≥{targetThreshold}%)</span> 
                    : <span className="text-amber-600 dark:text-amber-400">⚠ Falls below {targetThreshold}% target</span>}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Toast / Notification Banner */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="mb-4 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-mono"
        >
          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{toast.message}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {toast.onAction && (
              <button
                type="button"
                onClick={toast.onAction}
                className="px-2.5 py-0.5 rounded font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
              >
                {toast.actionLabel || 'Restore'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Quick Prompt if current state is 0 but previous data is available */}
      {state.totalClasses === 0 && lastBackup && !toast && (
        <div className="mb-4 p-3 sm:p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <History className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>Last time data: <strong>{lastBackup.state.totalClasses} classes ({lastBackup.state.totalClasses - lastBackup.state.absentClasses} attended, {lastBackup.state.absentClasses} absent)</strong></span>
          </div>
          <button
            type="button"
            onClick={() => handleRestore(lastBackup)}
            className="px-2.5 py-1 rounded-md bg-black text-white dark:bg-white dark:text-black font-semibold text-xs hover:opacity-90 transition-opacity shrink-0"
          >
            Restore
          </button>
        </div>
      )}

      {/* Main Grid: Inputs + Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mb-6">
        
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 p-4 sm:p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          
          {/* Total Classes Section with Clarified Quick Actions */}
          <div className="space-y-1.5" id="total-classes-section">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <label htmlFor="total-classes-input" className="text-xs font-mono font-medium uppercase tracking-wider text-zinc-500">
                Total Classes
              </label>
              
              {/* Quick Actions: Attended vs Missed */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  id="btn-log-day-attended"
                  onClick={() => {
                    const added = effectiveDaily;
                    handleChange('totalClasses', (Number(state.totalClasses) || 0) + added);
                    setToast({ message: `Logged +1 day (${added} classes) attended.` });
                  }}
                  className="px-2 py-1 min-h-[32px] sm:min-h-[30px] text-[11px] font-mono font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700 transition-all active:scale-95 cursor-pointer shadow-xs flex items-center gap-1 touch-manipulation"
                  title={`Log ${effectiveDaily} attended classes (+1 day)`}
                >
                  <Plus className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>1d Attended</span>
                </button>
                <button
                  type="button"
                  id="btn-log-day-missed"
                  onClick={() => {
                    const added = effectiveDaily;
                    setState(prev => {
                      const newTotal = (Number(prev.totalClasses) || 0) + added;
                      const newAbsent = (Number(prev.absentClasses) || 0) + added;
                      return { ...prev, totalClasses: newTotal, absentClasses: newAbsent };
                    });
                    setToast({ message: `Logged +1 day (${added} classes) missed/bunked.` });
                  }}
                  className="px-2 py-1 min-h-[32px] sm:min-h-[30px] text-[11px] font-mono font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700 transition-all active:scale-95 cursor-pointer shadow-xs flex items-center gap-1 touch-manipulation"
                  title={`Log ${effectiveDaily} missed classes (+1 day)`}
                >
                  <Minus className="w-3 h-3 text-red-500 shrink-0" />
                  <span>1d Missed</span>
                </button>
              </div>
            </div>

            <input
              id="total-classes-input"
              type="number"
              inputMode="numeric"
              min="0"
              value={state.totalClasses || ''}
              onChange={(e) => handleChange('totalClasses', parseInt(e.target.value) || 0)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-zinc-950 rounded-xl px-3.5 py-2.5 font-mono text-base text-zinc-900 dark:text-zinc-100 focus:outline-none transition-colors touch-manipulation"
              placeholder="0"
            />
          </div>

          {/* Absent / Present Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="attendance-value-input" className="text-xs font-mono font-medium uppercase tracking-wider text-zinc-500">
                {inputMode === 'absent' ? 'Absent' : 'Present'}
              </label>
              
              <div className="inline-flex rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono">
                <button
                  id="toggle-mode-absent"
                  type="button"
                  onClick={() => setInputMode('absent')}
                  className={`px-3 py-1 min-h-[30px] rounded-md font-medium transition-all touch-manipulation cursor-pointer ${
                    inputMode === 'absent'
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  Absent
                </button>
                <button
                  id="toggle-mode-present"
                  type="button"
                  onClick={() => setInputMode('present')}
                  className={`px-3 py-1 min-h-[30px] rounded-md font-medium transition-all touch-manipulation cursor-pointer ${
                    inputMode === 'present'
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  Present
                </button>
              </div>
            </div>

            <input
              id="attendance-value-input"
              type="number"
              inputMode="numeric"
              min="0"
              max={state.totalClasses}
              value={attendanceInputValue || ''}
              onChange={(e) => handleAttendanceChange(parseInt(e.target.value) || 0)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-zinc-950 rounded-xl px-3.5 py-2.5 font-mono text-base text-zinc-900 dark:text-zinc-100 focus:outline-none transition-colors touch-manipulation"
              placeholder="0"
            />

            <div className="flex justify-between text-[11px] font-mono text-zinc-400 px-1 pt-0.5">
              <span>Attended: {attendedCount}</span>
              <span>Missed: {state.absentClasses}</span>
            </div>
          </div>

          {/* Exam Date */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
            <div className="flex justify-between items-baseline">
              <label htmlFor="exam-date-input" className="text-xs font-mono font-medium uppercase tracking-wider text-zinc-500">
                Exam Date
              </label>
              {stats?.hasExamDate && (
                <span className="text-[11px] font-mono text-zinc-400">
                  {stats.classesUntilExam} classes remain {state.includeToday ? '(incl. today)' : '(from tomorrow)'}
                </span>
              )}
            </div>

            <input
              id="exam-date-input"
              type="date"
              value={state.examDate}
              onChange={(e) => handleChange('examDate', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-zinc-950 rounded-xl px-3.5 py-2.5 font-mono text-base sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none transition-colors dark:[color-scheme:dark] touch-manipulation"
            />

            {/* Today's Attendance Inclusion Switch */}
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 font-mono text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 text-[11px]">
                  <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                  Include Today's Classes?
                </span>
                <p className="text-[10px] text-zinc-400 font-sans">
                  {state.includeToday
                    ? "Morning check: Today's classes pending → counted in exam allowance"
                    : "Evening check: Today's classes already in Total → begins tomorrow"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-200/60 dark:bg-zinc-800 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleChange('includeToday', true)}
                  className={`w-full py-1.5 px-2.5 rounded-md text-[11px] transition-all cursor-pointer font-medium text-center flex items-center justify-center touch-manipulation ${
                    state.includeToday
                      ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 font-bold shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                  title="Today's classes haven't occurred yet (morning check)"
                >
                  Include (Morning)
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('includeToday', false)}
                  className={`w-full py-1.5 px-2.5 rounded-md text-[11px] transition-all cursor-pointer font-medium text-center flex items-center justify-center touch-manipulation ${
                    !state.includeToday
                      ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 font-bold shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                  title="Today's attendance already counted in Total Classes (evening check)"
                >
                  Exclude (Evening)
                </button>
              </div>
            </div>
          </div>

          {/* Holidays Button */}
          <div className="pt-1">
            <button
              id="btn-open-calendar-modal"
              type="button"
              onClick={() => setIsHolidayModalOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-900 active:scale-[0.99] transition-all text-xs font-mono min-h-[44px] touch-manipulation cursor-pointer"
            >
              <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" />
                Holidays & Schedule
              </span>
              <span className="text-zinc-400">
                {holidaysCount > 0 ? `${holidaysCount} set` : 'None set'} →
              </span>
            </button>
          </div>

        </div>

        {/* Right Gauge (5 cols) */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between items-center text-center">
          
          <div className="w-full flex items-center justify-between text-xs font-mono uppercase tracking-wider text-zinc-400">
            <span>Standing</span>
            <span>{targetThreshold}% Target</span>
          </div>

          {/* Circular Gauge */}
          <div className="relative my-3 sm:my-4 flex items-center justify-center">
            <svg 
              className="w-40 h-40 sm:w-48 sm:h-48 transform -rotate-90" 
              viewBox="0 0 240 240"
              role="progressbar"
              aria-valuenow={Math.round(percentage)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Attendance percentage"
            >
              <circle 
                cx="120" 
                cy="120" 
                r="100" 
                stroke="currentColor" 
                className="text-zinc-100 dark:text-zinc-900" 
                strokeWidth="14" 
                fill="transparent" 
              />
              {/* Secondary Ghost Circle for What-If Simulation */}
              {isSimulationActive && (
                <circle 
                  cx="120" 
                  cy="120" 
                  r="100" 
                  stroke="currentColor" 
                  className="text-cyan-500/40" 
                  strokeWidth="14" 
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 100}
                  strokeDashoffset={2 * Math.PI * 100 * (1 - Math.min(100, simPercentage) / 100)}
                  strokeLinecap="round"
                />
              )}
              {/* Main Progress Circle */}
              <motion.circle 
                cx="120" 
                cy="120" 
                r="100" 
                stroke="currentColor" 
                className={isSafe ? "text-black dark:text-white" : "text-zinc-500 dark:text-zinc-400"}
                strokeWidth="14" 
                fill="transparent"
                strokeDasharray={2 * Math.PI * 100}
                strokeLinecap="round"
                initial={{ strokeDashoffset: 2 * Math.PI * 100 }}
                animate={{ 
                  strokeDashoffset: 2 * Math.PI * 100 * (1 - Math.min(100, percentage) / 100) 
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              {/* Dynamic Target Tick Indicator */}
              <circle 
                cx="120" 
                cy="120" 
                r="100" 
                stroke="currentColor" 
                className="text-zinc-400 dark:text-zinc-600" 
                strokeWidth="16" 
                fill="transparent" 
                strokeDasharray="2 3000" 
                strokeDashoffset={2 * Math.PI * 100 * (1 - targetThreshold / 100)}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-black dark:text-white font-mono">
                <AnimatedCounter value={percentage} toFixed={1} />
                <span className="text-xl sm:text-2xl font-normal text-zinc-400">%</span>
              </div>
            </div>
          </div>

          {/* 3-Tier Status & Margin */}
          <div className="w-full space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              {percentage >= targetThreshold + 5 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-white" />
                  <span className="text-zinc-900 dark:text-zinc-100">Comfortable (≥{targetThreshold}%)</span>
                </>
              ) : percentage >= targetThreshold ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-white" />
                  <span className="text-zinc-900 dark:text-zinc-100">Borderline (≥{targetThreshold}%)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-zinc-700 dark:text-zinc-300">Deficit (&lt;{targetThreshold}%)</span>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900 w-full text-left font-mono">
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                <span className="text-[10px] uppercase text-zinc-400 block">Attended</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {attendedCount}/{state.totalClasses}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                <span className="text-[10px] uppercase text-zinc-400 block">Margin</span>
                <span className="text-sm font-bold inline-flex items-center gap-0.5 text-zinc-900 dark:text-zinc-100">
                  {marginFromThreshold >= 0 ? (
                    <>
                      <ArrowUpRight className="w-3 h-3 text-black dark:text-white" />
                      +{marginFromThreshold.toFixed(1)}%
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-3 h-3 text-zinc-500" />
                      {marginFromThreshold.toFixed(1)}%
                    </>
                  )}
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        
        {/* Card 1: Bunk Allowance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
              Bunk Allowance
            </span>
            {stats?.hasExamDate && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium shrink-0">
                {state.includeToday ? 'Until Exam (Incl. Today)' : 'Until Exam'}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5 mb-1 font-mono">
            <span className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50">
              <AnimatedCounter value={stats?.bunkableClasses || 0} />
            </span>
            <span className="text-xs text-zinc-400">
              {(stats?.bunkableClasses || 0) === 1 ? 'class' : 'classes'}
            </span>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {(() => {
              const bunkClasses = stats?.bunkableClasses || 0;
              const bunkDays = stats?.bunkableDays || 0;
              if (stats?.hasExamDate) {
                if (stats.classesUntilExam === 0) {
                  return isSafe 
                    ? `Target secured (${percentage.toFixed(1)}% ≥ ${targetThreshold}%) • 0 classes remain` 
                    : `No classes left to recover (${percentage.toFixed(1)}% < ${targetThreshold}%)`;
                }
                if (bunkClasses === 0) {
                  return isSafe 
                    ? 'Must attend all remaining classes to stay safe' 
                    : 'Zero buffer (attend all to recover)';
                }
                if (bunkDays >= 1) return `≈ ${bunkDays} ${bunkDays === 1 ? 'day' : 'days'} safe buffer before exam`;
                return `< 1 full day (${bunkClasses} ${bunkClasses === 1 ? 'period' : 'periods'} buffer before exam)`;
              }
              if (bunkClasses === 0) return isSafe ? 'Zero buffer (attend next)' : 'In deficit (attend to recover)';
              if (bunkDays >= 1) return `≈ ${bunkDays} ${bunkDays === 1 ? 'day' : 'days'} safe buffer`;
              return `< 1 full day (${bunkClasses} ${bunkClasses === 1 ? 'period' : 'periods'} buffer)`;
            })()}
          </span>
        </div>

        {/* Card 2: Needed to Recover / Reach Target */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
              Needed For {targetThreshold}%
            </span>
            {stats?.hasExamDate && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium shrink-0 ${
                stats?.isPossibleToReachTarget === false 
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}>
                {stats?.isPossibleToReachTarget === false ? 'Unreachable' : 'Until Exam'}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5 mb-1 font-mono">
            <span className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50">
              <AnimatedCounter value={stats?.requiredClasses || 0} />
            </span>
            <span className="text-xs text-zinc-400">
              {(stats?.requiredClasses || 0) === 1 ? 'class' : 'classes'}
            </span>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {(() => {
              const req = stats?.requiredClasses || 0;
              const reqDays = stats?.requiredDays || 0;
              if (stats?.hasExamDate) {
                if (stats?.isPossibleToReachTarget === false) {
                  return `Max achievable: ${(stats?.maxAchievablePercentage || 0).toFixed(1)}%`;
                }
                if (req === 0) {
                  return 'Target secured for exam';
                }
                if (isSafe) {
                  return 'Must attend before exam';
                }
                return `≈ ${reqDays} ${reqDays === 1 ? 'day' : 'days'} needed before exam`;
              }
              if (isSafe && req === 0) {
                return `Target secured (≥${targetThreshold}%)`;
              }
              return `≈ ${reqDays} ${reqDays === 1 ? 'consecutive day' : 'consecutive days'}`;
            })()}
          </span>
        </div>

        {/* Card 3: Smart Next Class / Tomorrow Risk */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
              {stats?.hasClassBeforeExam === false ? 'Exam Horizon' : `${stats?.nextClassDateLabel} Risk`}
            </span>
            {stats?.hasClassBeforeExam === false ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                Target Locked
              </span>
            ) : stats?.nextClassDateLabel === 'Today' ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium shrink-0">
                Today Pending
              </span>
            ) : stats?.isTomorrowOff ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium shrink-0">
                Tomorrow Off
              </span>
            ) : null}
          </div>
          <div className="flex items-baseline gap-1.5 mb-1 font-mono">
            <span className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50">
              <AnimatedCounter value={stats?.nextClassImpact || 0} toFixed={1} />
            </span>
            <span className="text-xs text-zinc-400">%</span>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {stats?.hasClassBeforeExam === false 
              ? `No more classes scheduled before exam (${state.examDate})`
              : `-${stats?.nextClassDrop.toFixed(1)}% if ${stats?.dailyClasses} skipped on ${stats?.nextClassDateLabel}`}
          </span>
        </div>

      </div>

      {/* 7-Day Trajectory Chart */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-4">
          <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
            7-Day Forecast
          </h2>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-mono text-zinc-500">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-black dark:bg-white"></span>
              <span>Attend</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 border-t border-dashed border-zinc-400"></span>
              <span>Bunk</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 border-t border-dotted border-zinc-300 dark:border-zinc-600"></span>
              <span>{targetThreshold}%</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-400">
              <span>* Off-day</span>
            </div>
          </div>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="monoAttend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDarkMode ? "#ffffff" : "#000000"} stopOpacity={0.08} />
                  <stop offset="95%" stopColor={isDarkMode ? "#ffffff" : "#000000"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="2 4" 
                stroke={isDarkMode ? "#27272a" : "#f4f4f5"} 
                vertical={false} 
              />
              <XAxis 
                dataKey="name" 
                stroke={isDarkMode ? "#71717a" : "#a1a1aa"} 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8} 
                fontFamily="JetBrains Mono, monospace"
              />
              <YAxis 
                stroke={isDarkMode ? "#71717a" : "#a1a1aa"} 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                domain={[0, 100]} 
                tickFormatter={(value) => `${value}%`} 
                fontFamily="JetBrains Mono, monospace"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#09090b' : '#ffffff', 
                  borderColor: isDarkMode ? '#27272a' : '#e4e4e7', 
                  borderRadius: '8px', 
                  color: isDarkMode ? '#fafafa' : '#09090b', 
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace'
                }} 
                cursor={{ stroke: isDarkMode ? '#3f3f46' : '#d4d4d8', strokeWidth: 1 }} 
              />
              <ReferenceLine 
                y={targetThreshold} 
                stroke={isDarkMode ? "#52525b" : "#a1a1aa"} 
                strokeDasharray="3 3" 
              />
              <Area 
                type="monotone" 
                dataKey="attendAll" 
                name="Attend" 
                stroke={isDarkMode ? "#ffffff" : "#000000"} 
                fillOpacity={1} 
                fill="url(#monoAttend)" 
                strokeWidth={2} 
              />
              <Area 
                type="monotone" 
                dataKey="bunkAll" 
                name="Bunk" 
                stroke={isDarkMode ? "#71717a" : "#a1a1aa"} 
                strokeDasharray="4 4"
                fill="transparent" 
                strokeWidth={1.5} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* Calendar Modal */}
      {isHolidayModalOpen && (
        <Modal 
          isOpen={isHolidayModalOpen} 
          onClose={() => setIsHolidayModalOpen(false)} 
          title="Calendar & Holidays"
        >
          <Suspense fallback={<div className="h-64 flex items-center justify-center font-mono text-xs text-zinc-400">Loading schedule...</div>}>
            <Calendar 
              holidays={state.holidays} 
              extraWorkingDays={state.extraWorkingDays} 
              onDateToggle={toggleHoliday} 
            />
          </Suspense>
        </Modal>
      )}
    </div>
  );
};
