
export interface AttendanceState {
  totalClasses: number;
  absentClasses: number;
  examDate: string; // YYYY-MM-DD
  holidays: string[]; // Array of YYYY-MM-DD
  extraWorkingDays: string[]; // Array of YYYY-MM-DD (Weekends marked as working)
}

export interface AttendanceStats {
  currentPercentage: number;
  isSafe: boolean; // > 75%
  classesUntilExam: number; // Total slots
  bunkableClasses: number; // How many can be skipped safely
  bunkableDays: number; // Number of full days that can be skipped
  requiredClasses: number; // How many consecutive must be attended if unsafe
  requiredDays: number; // Number of full days to attend to reach safety
  tomorrowImpact: number; // Percentage if absent tomorrow
  isPossibleToReachTarget: boolean; // Whether 75% is reachable before exam
  maxAchievablePercentage: number; // Max % if attending every class from now on
  hasExamDate: boolean; // Whether a valid future exam date is provided
}