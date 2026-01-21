/**
 * Financial correctness tests for calculator module
 * Ensures accurate calculations for user trust
 */

import {
    calculateMonthlyPayment,
    calculateMonthlyInterest,
    generateAmortizationSchedule,
    calculateLoanStatistics,
    calculateTilgungChangeSavings
} from '../js/calculator.js';

// Simple assertion function
function assert(condition, message) {
    if (!condition) {
        console.error('❌ Test failed:', message);
        return false;
    }
    console.log('✅ Test passed:', message);
    return true;
}

// Helper to compare floats with tolerance
function assertClose(actual, expected, tolerance = 0.01, message) {
    const diff = Math.abs(actual - expected);
    if (diff > tolerance) {
        console.error(`❌ Test failed: ${message}`);
        console.error(`   Expected: ${expected}, Got: ${actual}, Diff: ${diff}`);
        return false;
    }
    console.log(`✅ Test passed: ${message}`);
    return true;
}

// Test Suite
console.log('\n=== Running Financial Correctness Tests ===\n');

let passedTests = 0;
let totalTests = 0;

// Test 1: Monthly payment calculation
totalTests++;
const payment1 = calculateMonthlyPayment(100000, 3.5, 120);
if (assertClose(payment1, 997.27, 1, 'Monthly payment for 100k EUR at 3.5% over 10 years')) {
    passedTests++;
}

// Test 2: Monthly interest calculation
totalTests++;
const interest1 = calculateMonthlyInterest(100000, 3.5);
if (assertClose(interest1, 291.67, 1, 'Monthly interest on 100k EUR at 3.5%')) {
    passedTests++;
}

// Test 3: Zero interest loan
totalTests++;
const payment2 = calculateMonthlyPayment(120000, 0, 120);
if (assertClose(payment2, 1000, 0.01, 'Zero interest loan payment')) {
    passedTests++;
}

// Test 4: Amortization schedule length
totalTests++;
const schedule1 = generateAmortizationSchedule(100000, 3.5, 2, 10, []);
if (assert(schedule1.length <= 120, 'Schedule length within maximum duration')) {
    passedTests++;
}

// Test 5: Final balance is zero
totalTests++;
const lastRecord = schedule1[schedule1.length - 1];
if (assertClose(lastRecord.remainingBalance, 0, 0.01, 'Final balance is zero')) {
    passedTests++;
}

// Test 6: Total payments equal principal + interest
totalTests++;
const stats1 = calculateLoanStatistics(schedule1, 100000);
const totalPayments = schedule1.reduce((sum, r) => sum + r.payment + r.specialPayment, 0);
if (assertClose(totalPayments, stats1.totalPaid, 1, 'Total payments match principal + interest')) {
    passedTests++;
}

// Test 7: Each payment = interest + principal
totalTests++;
let paymentStructureValid = true;
for (let i = 0; i < Math.min(10, schedule1.length); i++) {
    const record = schedule1[i];
    const sum = record.interest + record.principal;
    if (Math.abs(sum - record.payment) > 0.01) {
        paymentStructureValid = false;
        break;
    }
}
if (assert(paymentStructureValid, 'Each payment equals interest + principal')) {
    passedTests++;
}

// Test 8: Balance decreases monotonically
totalTests++;
let balanceDecreases = true;
for (let i = 1; i < schedule1.length; i++) {
    if (schedule1[i].remainingBalance > schedule1[i-1].remainingBalance) {
        balanceDecreases = false;
        break;
    }
}
if (assert(balanceDecreases, 'Balance decreases monotonically')) {
    passedTests++;
}

// Test 9: Special payment reduces balance
totalTests++;
const specialPaymentDate = new Date();
specialPaymentDate.setMonth(specialPaymentDate.getMonth() + 12);
const schedule2 = generateAmortizationSchedule(100000, 3.5, 2, 10, [
    { date: specialPaymentDate, amount: 5000 }
]);
const stats2 = calculateLoanStatistics(schedule2, 100000);
if (assert(stats2.totalInterest < stats1.totalInterest, 'Special payment reduces total interest')) {
    passedTests++;
}

// Test 10: Special payment reduces duration
totalTests++;
if (assert(schedule2.length < schedule1.length, 'Special payment reduces loan duration')) {
    passedTests++;
}

// Test 11: Reference scenario - 300k EUR loan
totalTests++;
const schedule3 = generateAmortizationSchedule(300000, 3.5, 2, 10, []);
const stats3 = calculateLoanStatistics(schedule3, 300000);
// Expected: ~1,375 EUR/month, ~55,000 EUR total interest
if (assertClose(stats3.averageMonthlyPayment, 1375, 50, '300k loan monthly payment ~1,375 EUR')) {
    passedTests++;
}

totalTests++;
if (assertClose(stats3.totalInterest, 55000, 5000, '300k loan total interest ~55,000 EUR')) {
    passedTests++;
}

// Test 12: High interest rate stress test
totalTests++;
const schedule4 = generateAmortizationSchedule(100000, 15, 2, 10, []);
const stats4 = calculateLoanStatistics(schedule4, 100000);
if (assert(stats4.totalInterest > stats1.totalInterest, 'Higher interest rate increases total interest')) {
    passedTests++;
}

// Test 13: Short duration loan
totalTests++;
const schedule5 = generateAmortizationSchedule(50000, 3.5, 5, 1, []);
if (assert(schedule5.length <= 12, 'One-year loan completes in 12 months or less')) {
    passedTests++;
}

// Test 14: Cumulative interest increases monotonically
totalTests++;
let cumulativeIncreases = true;
for (let i = 1; i < schedule1.length; i++) {
    if (schedule1[i].cumulativeInterest < schedule1[i-1].cumulativeInterest) {
        cumulativeIncreases = false;
        break;
    }
}
if (assert(cumulativeIncreases, 'Cumulative interest increases monotonically')) {
    passedTests++;
}

// Test 15: Cumulative principal increases monotonically
totalTests++;
let cumulativePrincipalIncreases = true;
for (let i = 1; i < schedule1.length; i++) {
    if (schedule1[i].cumulativePrincipal < schedule1[i-1].cumulativePrincipal) {
        cumulativePrincipalIncreases = false;
        break;
    }
}
if (assert(cumulativePrincipalIncreases, 'Cumulative principal increases monotonically')) {
    passedTests++;
}

// Test 16: Large special payment doesn't create negative balance
totalTests++;
const largePaymentDate = new Date();
largePaymentDate.setMonth(largePaymentDate.getMonth() + 6);
const schedule6 = generateAmortizationSchedule(100000, 3.5, 2, 10, [
    { date: largePaymentDate, amount: 150000 } // Exceeds balance
]);
let noNegativeBalance = true;
for (const record of schedule6) {
    if (record.remainingBalance < -0.01) {
        noNegativeBalance = false;
        break;
    }
}
if (assert(noNegativeBalance, 'Large special payment doesn\'t create negative balance')) {
    passedTests++;
}

// Test 17: Multiple special payments in same month
totalTests++;
const multiPaymentDate = new Date();
multiPaymentDate.setMonth(multiPaymentDate.getMonth() + 12);
const schedule7 = generateAmortizationSchedule(100000, 3.5, 2, 10, [
    { date: multiPaymentDate, amount: 2000 },
    { date: multiPaymentDate, amount: 3000 }
]);
const month12 = schedule7.find(r => r.month === 12);
if (assert(month12 && month12.specialPayment >= 5000, 'Multiple special payments in same month are combined')) {
    passedTests++;
}

// Test 18: Interest portion decreases over time
totalTests++;
const firstInterest = schedule1[0].interest;
const lastInterest = schedule1[schedule1.length - 1].interest;
if (assert(lastInterest < firstInterest, 'Interest portion decreases over time')) {
    passedTests++;
}

// Test 19: Principal portion increases over time
totalTests++;
const firstPrincipal = schedule1[0].principal;
const midPrincipal = schedule1[Math.floor(schedule1.length / 2)].principal;
if (assert(midPrincipal > firstPrincipal, 'Principal portion increases over time')) {
    passedTests++;
}

// Test 20: Rounding errors don't accumulate
totalTests++;
const finalCumulative = lastRecord.cumulativeInterest + lastRecord.cumulativePrincipal;
if (assertClose(finalCumulative, 100000 + stats1.totalInterest, 1, 'No significant rounding error accumulation')) {
    passedTests++;
}

// Test 21: Tilgung rate increase saves interest
totalTests++;
const startDate = new Date('2024-01-01');
const changeDate = new Date('2026-01-01');
const baselineSchedule = generateAmortizationSchedule(355000, 4.13, 2.0, 40, [], startDate, []);
const baselineStats = calculateLoanStatistics(baselineSchedule, 355000);
const withChangeSchedule = generateAmortizationSchedule(355000, 4.13, 2.0, 40, [], startDate, [
    { id: 'test-1', date: changeDate, rate: 2.1 }
]);
const withChangeStats = calculateLoanStatistics(withChangeSchedule, 355000);
if (assert(withChangeStats.totalInterest < baselineStats.totalInterest, 'Increasing tilgung rate saves interest')) {
    passedTests++;
}

// Test 22: Tilgung rate increase shortens loan duration
totalTests++;
if (assert(withChangeSchedule.length < baselineSchedule.length, 'Increasing tilgung rate shortens loan duration')) {
    passedTests++;
}

// Test 23: Tilgung rate increase raises monthly payment
totalTests++;
const monthBeforeChange = withChangeSchedule[23]; // Month 24 (0-indexed as 23)
const monthAfterChange = withChangeSchedule[24];  // Month 25 (0-indexed as 24, where change occurs)
if (assert(monthAfterChange.payment > monthBeforeChange.payment, 'Increasing tilgung rate raises monthly payment')) {
    passedTests++;
}

// Test 24: calculateTilgungChangeSavings returns positive for rate increase
totalTests++;
const savings = calculateTilgungChangeSavings(355000, 4.13, 2.0, 40, [], startDate, [
    { id: 'test-1', date: changeDate, rate: 2.1 }
]);
if (assert(savings.length === 1 && savings[0].interestSaved > 0, 'Tilgung rate increase shows positive savings')) {
    passedTests++;
}

// Test 25: Tilgung rate decrease costs more interest
totalTests++;
const withDecreaseSchedule = generateAmortizationSchedule(355000, 4.13, 2.0, 40, [], startDate, [
    { id: 'test-2', date: changeDate, rate: 1.9 }
]);
const withDecreaseStats = calculateLoanStatistics(withDecreaseSchedule, 355000);
if (assert(withDecreaseStats.totalInterest > baselineStats.totalInterest, 'Decreasing tilgung rate costs more interest')) {
    passedTests++;
}

// Test 26: calculateTilgungChangeSavings returns negative for rate decrease
totalTests++;
const decreaseSavings = calculateTilgungChangeSavings(355000, 4.13, 2.0, 40, [], startDate, [
    { id: 'test-2', date: changeDate, rate: 1.9 }
]);
if (assert(decreaseSavings.length === 1 && decreaseSavings[0].interestSaved < 0, 'Tilgung rate decrease shows negative savings')) {
    passedTests++;
}

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passedTests}/${totalTests}`);
console.log(`Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Financial calculations are accurate.');
} else {
    console.log(`\n⚠️  ${totalTests - passedTests} test(s) failed. Review calculations.`);
}

export { passedTests, totalTests };
