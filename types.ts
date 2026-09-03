export interface AttendanceState {
  totalClasses: number;
  absentClasses: number;
  examDate: string; // YYYY-MM-DD
  holidays: string[]; // Array of YYYY-MM-DD
  extraWorkingDays: string[]; // Array of YYYY-MM-DD (Weekends marked as working)
  targetPercentage?: number; // e.g. 75, 80, 85 (defaults to 75)
  dailyClasses?: number; // e.g. 6 (defaults to 6)
}

export interface AttendanceStats {
  currentPercentage: number;
  isSafe: boolean; // >= targetPercentage
  targetPercentage: number; // Effective target percentage
  dailyClasses: number; // Effective daily periods
  classesUntilExam: number; // Total slots
  bunkableClasses: number; // How many can be skipped safely
  bunkableDays: number; // Number of full days that can be skipped
  requiredClasses: number; // How many consecutive must be attended if unsafe
  requiredDays: number; // Number of full days to attend to reach safety
  tomorrowImpact: number; // Percentage if absent tomorrow / next working day (backwards compatibility)
  nextClassImpact: number; // Percentage if absent on next working day
  nextClassDrop: number; // Percentage drop
  nextClassDateLabel: string; // "Tomorrow" or "Monday" etc.
  isTomorrowOff: boolean; // True if tomorrow is a weekend or holiday
  isPossibleToReachTarget: boolean; // Whether target is reachable before exam
  maxAchievablePercentage: number; // Max % if attending every class from now on
  hasExamDate: boolean; // Whether a valid future exam date is provided
}