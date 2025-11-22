import {
  calculateCourseCredits,
  MAX_COURSE_CREDITS,
  MIN_COURSE_CREDITS,
  MAX_SCORE_THRESHOLD,
  MIN_SCORE_THRESHOLD,
} from "../src/lib/ranks";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

console.log("Running course credits calculation tests...");

// Test Case 1: Minimum score
const minScoreCredits = calculateCourseCredits(0, 0, MAX_SCORE_THRESHOLD);
assert(
  minScoreCredits === MIN_COURSE_CREDITS,
  `Expected minimum credits to be ${MIN_COURSE_CREDITS}, got ${minScoreCredits}`
);

// Test Case 2: Maximum score (approximate)
// Score = 0.75 * earned + 0.25 * spent
// To get max score (680), we can have earned=680, spent=680 -> 0.75*680 + 0.25*680 = 680
const maxScoreCredits = calculateCourseCredits(
  MAX_SCORE_THRESHOLD,
  MAX_SCORE_THRESHOLD,
  MAX_SCORE_THRESHOLD
);
assert(
  maxScoreCredits === MAX_COURSE_CREDITS,
  `Expected maximum credits to be ${MAX_COURSE_CREDITS}, got ${maxScoreCredits}`
);

// Test Case 3: Mid-range score
// Let's pick a score exactly in the middle: (680 + 15) / 2 = 347.5
// 347.5 = 0.75 * E + 0.25 * S. Let's say S = E. E = 347.5
const midCredits = calculateCourseCredits(347.5, 347.5, MAX_SCORE_THRESHOLD);
// Expected: 3.5 + (347.5 - 15) / (680 - 15) * (5.0 - 3.5)
// 3.5 + 332.5 / 665 * 1.5 = 3.5 + 0.5 * 1.5 = 3.5 + 0.75 = 4.25
assert(
  midCredits === 4.25,
  `Expected mid-range credits to be 4.25, got ${midCredits}`
);

// Test Case 4: Just below max
// Use a value that won't round up to 5.00
const nearMaxCredits = calculateCourseCredits(
  MAX_SCORE_THRESHOLD - 10,
  MAX_SCORE_THRESHOLD - 10,
  MAX_SCORE_THRESHOLD
);
assert(
  nearMaxCredits < MAX_COURSE_CREDITS,
  `Expected credits (${nearMaxCredits}) to be less than max`
);
assert(nearMaxCredits > 4.9, "Expected credits to be close to max");

// Test Case 5: Just above min
const nearMinCredits = calculateCourseCredits(20, 0, MAX_SCORE_THRESHOLD); // Score = 15
// 0.75 * 20 + 0 = 15. This is exactly min threshold.
assert(
  calculateCourseCredits(20, 0, MAX_SCORE_THRESHOLD) === MIN_COURSE_CREDITS,
  "Score 15 should be min credits"
);

const slightlyAboveMin = calculateCourseCredits(21, 0, MAX_SCORE_THRESHOLD); // Score = 15.75
// 3.5 + (15.75 - 15) / 665 * 1.5
// 3.5 + 0.75 / 665 * 1.5 ~= 3.501... -> 3.50
// Wait, toFixed(2) might round.
// 0.75 / 665 * 1.5 = 0.00169...
// 3.5 + 0.00169 = 3.50169 -> 3.50
assert(slightlyAboveMin >= 3.5, "Should be at least 3.5");

// Test Case 6: Dynamic Max Score
const dynamicMax = 1000;
const dynamicMaxCredits = calculateCourseCredits(1000, 1000, dynamicMax);
assert(
  dynamicMaxCredits === MAX_COURSE_CREDITS,
  `Expected dynamic max credits to be ${MAX_COURSE_CREDITS}, got ${dynamicMaxCredits}`
);

const dynamicMidCredits = calculateCourseCredits(507.5, 507.5, dynamicMax);
// Midpoint between 15 and 1000 is (1000+15)/2 = 507.5
assert(
  dynamicMidCredits === 4.25,
  `Expected dynamic mid credits to be 4.25, got ${dynamicMidCredits}`
);

console.log("All tests passed!");
