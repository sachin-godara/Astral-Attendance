
import { getWorkingDaysBetween } from './utils/calculations';

const today = new Date('2026-02-27T12:00:00'); // Friday
const exam = new Date('2026-03-10T12:00:00'); // Tuesday next next week
// Days:
// Feb 27 (Fri) - Today. Counted? Loop starts at today.
// Feb 28 (Sat) - Weekend
// Mar 1 (Sun) - Weekend
// Mar 2 (Mon) - Weekday
// ...
// Mar 9 (Mon) - Weekday
// Mar 10 (Tue) - Exam. Loop ends before this?

// Test 1: No holidays, no extra days
const count1 = getWorkingDaysBetween(today, exam, [], []);
console.log('Test 1 (Normal):', count1);

// Test 2: Add Feb 28 (Sat) as extra working day
const count2 = getWorkingDaysBetween(today, exam, [], ['2026-02-28']);
console.log('Test 2 (Extra Sat):', count2);

// Test 3: Add Mar 2 (Mon) as holiday
const count3 = getWorkingDaysBetween(today, exam, ['2026-03-02'], []);
console.log('Test 3 (Holiday Mon):', count3);
