
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
  const { totalClasses, absentClasses, examDate, holidays, extraWorkingDays = [] } = state;
  
  // Derive attended classes
  const attendedClasses = Math.max(0, totalClasses - absentClasses);

  // 1. Current Percentage
  const currentPercentage = totalClasses === 0 ? 0 : (attendedClasses / totalClasses) * 100;

  // 2. Classes until exam
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let exam = new Date(examDate);
  // Fix: Parse examDate as local time to avoid timezone shifts
  if (examDate) {
    const [y, m, d] = examDate.split('-').map(Number);
    exam = new Date(y, m - 1, d);
  }
  
  // If exam date is invalid or in past, assume 0 future days
  const validExamDate = examDate !== '' && !isNaN(exam.getTime()) && exam > today;
  
  const workingDaysLeft = validExamDate ? getWorkingDaysBetween(tomorrow, exam, holidays, extraWorkingDays) : 0;
  const classesUntilExam = workingDaysLeft * DAILY_CLASSES;
  
  // 3. Max Achievable logic
  const maxPossibleAttended = attendedClasses + classesUntilExam;
  const maxPossibleTotal = totalClasses + classesUntilExam;
  const maxAchievablePercentage = maxPossibleTotal === 0 ? 0 : (maxPossibleAttended / maxPossibleTotal) * 100;
  const isPossibleToReachTarget = maxAchievablePercentage >= TARGET_PERCENTAGE;

  // 4. Bunkable & Required Logic
  let bunkableClasses = 0;
  let requiredClasses = 0;

  if (validExamDate) {
    // Scenario A: Exam Date Set -> Calculate based on Total Period until Exam
    const totalClassesAtEnd = totalClasses + classesUntilExam;
    const minAttendedForTarget = Math.ceil((TARGET_PERCENTAGE / 100) * totalClassesAtEnd);
    
    // Required to attend in future to hit target by exam
    const futureRequired = Math.max(0, minAttendedForTarget - attendedClasses);
    requiredClasses = futureRequired;
    
    // Bunkable: Any future class we don't NEED to attend
    // If futureRequired > classesUntilExam, it's impossible (handled by isPossibleToReachTarget), 
    // but bunkable is 0.
    bunkableClasses = Math.max(0, classesUntilExam - futureRequired);

  } else {
    // Scenario B: No Exam Date -> Calculate Immediate "Safe Buffer" or "Recovery Need"
    
    if (currentPercentage >= TARGET_PERCENTAGE) {
        // Safe: How many can I miss consecutively NOW?
        // (A) / (C + k) >= 0.75  =>  A >= 0.75C + 0.75k  =>  0.75k <= A - 0.75C
        // k <= (A - 0.75C) / 0.75  =>  k <= (A/0.75) - C
        const maxSafeTotal = Math.floor(attendedClasses / (TARGET_PERCENTAGE / 100));
        bunkableClasses = Math.max(0, maxSafeTotal - totalClasses);
    } else {
        // Unsafe: How many must I attend consecutively NOW to recover?
        // (A + k) / (C + k) >= 0.75
        // A + k >= 0.75C + 0.75k
        // 0.25k >= 0.75C - A
        // k >= (0.75C - A) / 0.25
        if (totalClasses > 0) {
            const needed = (0.75 * totalClasses - attendedClasses) / 0.25;
            requiredClasses = Math.ceil(needed);
        }
    }
  }

  const bunkableDays = Math.floor(bunkableClasses / DAILY_CLASSES);
  const requiredDays = Math.ceil(requiredClasses / DAILY_CLASSES);

  // 6. Tomorrow Impact
  const tomorrowTotal = totalClasses + DAILY_CLASSES;
  const tomorrowPercentage = (attendedClasses / tomorrowTotal) * 100;

  return {
    currentPercentage,
    isSafe: currentPercentage >= TARGET_PERCENTAGE,
    classesUntilExam,
    bunkableClasses,
    bunkableDays,
    requiredClasses,
    requiredDays,
    tomorrowImpact: tomorrowPercentage,
    isPossibleToReachTarget,
    maxAchievablePercentage,
    hasExamDate: validExamDate
  };
};