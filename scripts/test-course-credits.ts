import {
  calculateCourseCredits,
  calculateRawScore,
  MAX_COURSE_CREDITS,
  MIN_COURSE_CREDITS,
} from "../src/lib/ranks";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

console.log("Running course credits calculation tests (Relative Grading)...");

// Setup standard distribution
const MEAN = 100;
const STD_DEV = 20;

// Test Case 1: Mean score should be 4.25
// Raw Score = 100 (e.g., earned=100, spent=100 -> 0.75*100 + 0.25*100 = 100)
const meanCredits = calculateCourseCredits(100, 100, MEAN, STD_DEV);
assert(
  meanCredits === 4.25,
  `Expected mean credits to be 4.25, got ${meanCredits}`
);

// Test Case 2: +2 StdDev (Score = 140) should be 5.00
// Z = (140 - 100) / 20 = 2
// Grade = 4.25 + 2 * 0.375 = 4.25 + 0.75 = 5.00
const plus2SDCredits = calculateCourseCredits(140, 140, MEAN, STD_DEV);
assert(
  plus2SDCredits === 5.0,
  `Expected +2SD credits to be 5.00, got ${plus2SDCredits}`
);

// Test Case 3: -2 StdDev (Score = 60) should be 3.50
// Z = (60 - 100) / 20 = -2
// Grade = 4.25 - 2 * 0.375 = 4.25 - 0.75 = 3.50
const minus2SDCredits = calculateCourseCredits(60, 60, MEAN, STD_DEV);
assert(
  minus2SDCredits === 3.5,
  `Expected -2SD credits to be 3.50, got ${minus2SDCredits}`
);

// Test Case 4: Extreme High (Score = 200) should be clamped to 5.00
const highCredits = calculateCourseCredits(200, 200, MEAN, STD_DEV);
assert(
  highCredits === 5.0,
  `Expected high credits to be clamped to 5.00, got ${highCredits}`
);

// Test Case 5: Extreme Low (Score = 0) should be clamped to 3.50
const lowCredits = calculateCourseCredits(0, 0, MEAN, STD_DEV);
assert(
  lowCredits === 3.5,
  `Expected low credits to be clamped to 3.50, got ${lowCredits}`
);

// Test Case 6: Zero StdDev (No variation)
// Everyone should get 4.25
const noVarCredits = calculateCourseCredits(100, 100, 100, 0);
assert(
  noVarCredits === 4.25,
  `Expected no variation credits to be 4.25, got ${noVarCredits}`
);

console.log("All tests passed!");
