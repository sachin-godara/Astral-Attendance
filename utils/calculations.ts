
import { AttendanceState, AttendanceStats } from '../types';

const DAILY_CLASSES = 6;
const TARGET_PERCENTAGE = 75;

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

export const getWorkingDaysBetween = (start: Date, end: Date, holidays: string[], extraWorkingDays: string[] = []): number => {
  // Optimization: Use Sets for O(1) lookup complexity
  const holidaySet = new Set(holidays);
  const workingSet = new Set(extraWorkingDays);

  let count = 0;
  const current = new Date(start);
  
  // Normalize to start of day
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  // Avoid infinite loops if dates are wrong
  if (current >= endDate) return 0;

  // Optimization: Safety break to prevent browser freeze on bad input (limit to ~5 years)
  const maxDays = 365 * 5; 
  let daysProcessed = 0;

  while (current < endDate && daysProcessed < maxDays) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const dayOfWeek = current.getDay();
    const isWknd = dayOfWeek === 0 || dayOfWeek === 6;
    
    // A day is working if:
    // 1. It is a weekday AND NOT in holidays
    // 2. OR It is a weekend AND IS in extraWorkingDays
    const isWorkingDay = (!isWknd && !holidaySet.has(dateString)) || (isWknd && workingSet.has(dateString));

    if (isWorkingDay) {
      count++;
    }
    current.setDate(current.getDate() + 1);
    daysProcessed++;
  }
  return count;
};

export const calculateStats = (state: AttendanceState): AttendanceStats => {
  const { 
    totalClasses, 
    absentClasses, 
    examDate, 
    holidays, 
    extraWorkingDays = [],
    targetPercentage: rawTarget = 75,
    dailyClasses: rawDaily = 6
  } = state;
  
  const targetPercentage = Math.min(100, Math.max(1, Number(rawTarget) || 75));
  const dailyClasses = Math.max(1, Number(rawDaily) || 6);
  const targetRatio = targetPercentage / 100;
  const includeToday = Boolean(state.includeToday);

  // Derive attended classes
  const attendedClasses = Math.max(0, totalClasses - absentClasses);

  // 1. Current Percentage
  const currentPercentage = totalClasses === 0 ? 0 : (attendedClasses / totalClasses) * 100;

  // 2. Classes until exam
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let exam = new Date(examDate);
  if (examDate) {
    const [y, m, d] = examDate.split('-').map(Number);
    exam = new Date(y, m - 1, d);
    exam.setHours(0, 0, 0, 0);
  }
  
  // If exam date is invalid or in past, assume 0 future days
  const validExamDate = examDate !== '' && !isNaN(exam.getTime()) && exam > today;
  
  // If includeToday is true, start counting working days from today (e.g. morning check); otherwise from tomorrow
  const startDate = includeToday ? today : tomorrow;
  const workingDaysLeft = validExamDate ? getWorkingDaysBetween(startDate, exam, holidays, extraWorkingDays) : 0;
  const classesUntilExam = workingDaysLeft * dailyClasses;
  
  // 3. Max Achievable logic
  const maxPossibleAttended = attendedClasses + classesUntilExam;
  const maxPossibleTotal = totalClasses + classesUntilExam;
  const maxAchievablePercentage = maxPossibleTotal === 0 ? 0 : (maxPossibleAttended / maxPossibleTotal) * 100;
  const isPossibleToReachTarget = maxAchievablePercentage >= targetPercentage;

  // 4. Bunkable & Required Logic
  let bunkableClasses = 0;
  let requiredClasses = 0;

  if (validExamDate) {
    // Scenario A: Exam Date Set -> Calculate based on Total Period until Exam
    const totalClassesAtEnd = totalClasses + classesUntilExam;
    const minAttendedForTarget = Math.ceil(targetRatio * totalClassesAtEnd);
    
    // Required to attend in future to hit target by exam
    const futureRequired = Math.max(0, minAttendedForTarget - attendedClasses);
    requiredClasses = futureRequired;
    
    // Bunkable: Any future class we don't NEED to attend
    bunkableClasses = Math.max(0, classesUntilExam - futureRequired);

  } else {
    // Scenario B: No Exam Date -> Calculate Immediate "Safe Buffer" or "Recovery Need"
    if (currentPercentage >= targetPercentage) {
      // Safe: How many can I miss consecutively NOW?
      const maxSafeTotal = Math.floor(attendedClasses / targetRatio);
      bunkableClasses = Math.max(0, maxSafeTotal - totalClasses);
    } else {
      // Unsafe: How many must I attend consecutively NOW to recover?
      if (totalClasses > 0 && targetRatio < 1) {
        const needed = (targetRatio * totalClasses - attendedClasses) / (1 - targetRatio);
        requiredClasses = Math.ceil(Math.max(0, needed));
      }
    }
  }

  const bunkableDays = Math.floor(bunkableClasses / dailyClasses);
  const requiredDays = Math.ceil(requiredClasses / dailyClasses);

  // 5. Smart Next Working Day Risk Calculation
  const holidaySet = new Set(holidays);
  const workingSet = new Set(extraWorkingDays);

  const checkDate = new Date(includeToday ? today : tomorrow);
  let nextWorkingDate: Date | null = null;
  let isNextDayOff = false;

  // Check up to 30 days ahead to find the next instructional day
  for (let step = 0; step < 30; step++) {
    const y = checkDate.getFullYear();
    const m = String(checkDate.getMonth() + 1).padStart(2, '0');
    const d = String(checkDate.getDate()).padStart(2, '0');
    const dStr = `${y}-${m}-${d}`;
    const dayOfWeek = checkDate.getDay();
    const isWknd = dayOfWeek === 0 || dayOfWeek === 6;
    const isClassDay = (!isWknd && !holidaySet.has(dStr)) || (isWknd && workingSet.has(dStr));

    if (step === 0 && !isClassDay) {
      isNextDayOff = true;
    }

    if (isClassDay) {
      nextWorkingDate = new Date(checkDate);
      break;
    }
    checkDate.setDate(checkDate.getDate() + 1);
  }

  let nextClassDateLabel = includeToday ? 'Today' : 'Tomorrow';
  const isSameDayAsToday = nextWorkingDate && nextWorkingDate.getTime() === today.getTime();
  const isSameDayAsTomorrow = nextWorkingDate && nextWorkingDate.getTime() === tomorrow.getTime();

  if (isSameDayAsToday) {
    nextClassDateLabel = 'Today';
  } else if (isSameDayAsTomorrow) {
    nextClassDateLabel = 'Tomorrow';
  } else if (nextWorkingDate) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    nextClassDateLabel = dayNames[nextWorkingDate.getDay()];
  }

  const nextClassTotal = totalClasses + dailyClasses;
  const nextClassImpact = nextClassTotal === 0 ? 0 : (attendedClasses / nextClassTotal) * 100;
  const nextClassDrop = Math.max(0, currentPercentage - nextClassImpact);

  return {
    currentPercentage,
    isSafe: currentPercentage >= targetPercentage,
    targetPercentage,
    dailyClasses,
    classesUntilExam,
    workingDaysLeft,
    isTodayIncluded: includeToday,
    bunkableClasses,
    bunkableDays,
    requiredClasses,
    requiredDays,
    tomorrowImpact: nextClassImpact,
    nextClassImpact,
    nextClassDrop,
    nextClassDateLabel,
    isTomorrowOff: isNextDayOff,
    isPossibleToReachTarget,
    maxAchievablePercentage,
    hasExamDate: validExamDate
  };
};