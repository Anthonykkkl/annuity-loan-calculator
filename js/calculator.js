/**
 * Core calculation engine for annuity loan calculations
 * Pure functions following financial mathematics principles
 * All calculations use cents internally for precision
 */

import { eurosToCents, centsToEuros, roundToDecimals } from './utils.js';

/**
 * Calculates the monthly payment for an annuity loan
 * Formula: PMT = P * (r * (1+r)^n) / ((1+r)^n - 1)
 * 
 * @param {number} principal - Initial loan amount in EUR
 * @param {number} annualRate - Annual interest rate as percentage (e.g., 3.5 for 3.5%)
 * @param {number} months - Total number of months
 * @returns {number} Monthly payment amount in EUR
 */
export function calculateMonthlyPayment(principal, annualRate, months) {
    const monthlyRate = annualRate / 12 / 100;
    
    if (monthlyRate === 0) {
        // No interest case - simple division
        return principal / months;
    }
    
    const factor = Math.pow(1 + monthlyRate, months);
    const payment = principal * (monthlyRate * factor) / (factor - 1);
    
    return roundToDecimals(payment, 2);
}

/**
 * Calculates monthly interest on remaining balance
 * 
 * @param {number} remainingBalance - Current loan balance in EUR
 * @param {number} annualRate - Annual interest rate as percentage
 * @returns {number} Monthly interest amount in EUR
 */
export function calculateMonthlyInterest(remainingBalance, annualRate) {
    const monthlyRate = annualRate / 12 / 100;
    return roundToDecimals(remainingBalance * monthlyRate, 2);
}

/**
 * Calculates the initial monthly payment based on repayment rate
 * 
 * @param {number} principal - Initial loan amount in EUR
 * @param {number} annualRate - Annual interest rate as percentage
 * @param {number} tilgungRate - Annual repayment rate as percentage
 * @returns {number} Monthly payment amount in EUR
 */
export function calculateMonthlyPaymentFromTilgung(principal, annualRate, tilgungRate) {
    const annualPayment = principal * (annualRate + tilgungRate) / 100;
    return roundToDecimals(annualPayment / 12, 2);
}

/**
 * Payment record structure
 * @typedef {Object} PaymentRecord
 * @property {number} month - Payment month number (1-indexed)
 * @property {Date} date - Payment date
 * @property {number} payment - Regular payment amount in EUR
 * @property {number} interest - Interest portion in EUR
 * @property {number} principal - Principal portion in EUR
 * @property {number} specialPayment - Special payment amount in EUR (0 if none)
 * @property {number} remainingBalance - Remaining balance after payment in EUR
 * @property {number} cumulativeInterest - Total interest paid so far in EUR
 * @property {number} cumulativePrincipal - Total principal paid so far in EUR
 */

/**
 * Generates a complete amortization schedule for a loan
 * 
 * @param {number} principal - Initial loan amount in EUR
 * @param {number} annualRate - Annual interest rate as percentage
 * @param {number} tilgungRate - Annual repayment rate as percentage
 * @param {number} maxYears - Maximum loan duration in years
 * @param {Array<{date: Date, amount: number}>} specialPayments - Array of special payments
 * @param {Date} startDate - Loan start date
 * @param {Array<{id: string, date: Date, rate: number}>} tilgungChanges - Array of repayment rate changes
 * @returns {Array<PaymentRecord>} Monthly payment schedule
 */
export function generateAmortizationSchedule(principal, annualRate, tilgungRate, maxYears, specialPayments = [], startDate = null, tilgungChanges = []) {
    const schedule = [];
    const loanStartDate = startDate ? new Date(startDate) : new Date();
    
    // Store original principal for repayment rate calculations
    const originalPrincipal = principal;
    
    // Calculate initial monthly payment based on repayment rate
    let currentTilgungRate = tilgungRate;
    let monthlyPayment = calculateMonthlyPaymentFromTilgung(originalPrincipal, annualRate, currentTilgungRate);
    
    let remainingBalance = principal;
    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;
    let month = 0;
    const maxMonths = maxYears * 12;
    
    // Sort special payments by date
    const sortedSpecialPayments = [...specialPayments].sort((a, b) => a.date - b.date);
    let specialPaymentIndex = 0;
    
    // Sort repayment changes by date
    const sortedTilgungChanges = [...tilgungChanges].sort((a, b) => a.date - b.date);
    let tilgungChangeIndex = 0;
    
    if (sortedSpecialPayments.length > 0) {
        console.log('💰 Processing special payments:', sortedSpecialPayments.map(sp => ({
            date: sp.date.toISOString().split('T')[0],
            amount: sp.amount
        })));
        console.log('📅 Loan start date:', loanStartDate.toISOString().split('T')[0]);
    }
    
    if (sortedTilgungChanges.length > 0) {
        console.log('📈 Processing repayment changes:', sortedTilgungChanges.map(tc => ({
            date: tc.date.toISOString().split('T')[0],
            rate: tc.rate
        })));
    }
    
    // SAFETY: Absolute maximum iterations to prevent infinite loops
    const ABSOLUTE_MAX_ITERATIONS = maxMonths + 100;
    let iterations = 0;
    
    while (remainingBalance > 0.01 && month < maxMonths && iterations < ABSOLUTE_MAX_ITERATIONS) {
        iterations++;
        month++;
        const paymentDate = new Date(loanStartDate);
        paymentDate.setMonth(paymentDate.getMonth() + month);
        
        // Check for repayment rate changes this month
        while (tilgungChangeIndex < sortedTilgungChanges.length) {
            const tc = sortedTilgungChanges[tilgungChangeIndex];
            const tcDate = new Date(tc.date);
            const monthsDiff = (tcDate.getFullYear() - loanStartDate.getFullYear()) * 12 + 
                              (tcDate.getMonth() - loanStartDate.getMonth());
            const tcMonth = monthsDiff + 1;
            
            if (tcMonth === month) {
                currentTilgungRate = tc.rate;
                // CRITICAL FIX: Use ORIGINAL principal, not remaining balance
                // Repayment rate is always a percentage of the original loan amount
                monthlyPayment = calculateMonthlyPaymentFromTilgung(originalPrincipal, annualRate, currentTilgungRate);
                console.log(`📈 Repayment rate changed: Month ${month}, New rate ${tc.rate}%, New payment ${monthlyPayment}`);
                tilgungChangeIndex++;
            } else if (tcMonth > month) {
                break; // Future change, stop checking
            } else {
                // Past change that we missed, skip it
                console.warn(`⚠️ Skipping past repayment change: Month ${tcMonth} (current: ${month})`);
                tilgungChangeIndex++;
            }
        }
        
        // Calculate interest for this month
        const interestPayment = calculateMonthlyInterest(remainingBalance, annualRate);
        
        // Calculate principal payment (can't exceed remaining balance)
        let principalPayment = Math.min(monthlyPayment - interestPayment, remainingBalance);
        
        // CRITICAL FIX: If payment doesn't cover interest, we have a problem
        // This means the loan will never be paid off with current parameters
        if (principalPayment <= 0) {
            console.warn('⚠️ Monthly payment does not cover interest! Loan cannot be paid off.');
            console.warn(`Month ${month}: Payment=${monthlyPayment}, Interest=${interestPayment}`);
            // Force at least some principal payment to avoid infinite loop
            principalPayment = Math.min(remainingBalance, 1); // Pay at least 1 EUR principal
        }
        
        // Check for special payments this month
        let specialPayment = 0;
        while (specialPaymentIndex < sortedSpecialPayments.length) {
            const sp = sortedSpecialPayments[specialPaymentIndex];
            
            // Calculate which month this special payment falls in
            const spDate = new Date(sp.date);
            const monthsDiff = (spDate.getFullYear() - loanStartDate.getFullYear()) * 12 + 
                              (spDate.getMonth() - loanStartDate.getMonth());
            const spMonth = monthsDiff + 1; // +1 because we start counting from month 1
            
            if (spMonth === month) {
                specialPayment += sp.amount;
                console.log(`✅ Special payment applied: Month ${month}, Amount ${sp.amount}, Date ${spDate.toISOString().split('T')[0]}`);
                specialPaymentIndex++;
            } else if (spMonth > month) {
                break; // Future payment, stop checking
            } else {
                // Past payment that we missed, skip it
                console.warn(`⚠️ Skipping past special payment: Month ${spMonth} (current: ${month})`);
                specialPaymentIndex++;
            }
        }
        
        // Apply special payment (can't exceed remaining balance after regular payment)
        const balanceAfterRegular = remainingBalance - principalPayment;
        const originalSpecialPayment = specialPayment;
        specialPayment = Math.min(specialPayment, balanceAfterRegular);
        
        if (originalSpecialPayment > 0 && specialPayment !== originalSpecialPayment) {
            console.warn(`⚠️ Special payment capped: ${originalSpecialPayment} → ${specialPayment} (balance: ${balanceAfterRegular})`);
        }
        
        // Update remaining balance
        remainingBalance = remainingBalance - principalPayment - specialPayment;
        
        // Update cumulative totals
        cumulativeInterest += interestPayment;
        cumulativePrincipal += principalPayment + specialPayment;
        
        // Add to schedule
        schedule.push({
            month,
            date: paymentDate,
            payment: roundToDecimals(monthlyPayment, 2),
            interest: roundToDecimals(interestPayment, 2),
            principal: roundToDecimals(principalPayment, 2),
            specialPayment: roundToDecimals(specialPayment, 2),
            remainingBalance: roundToDecimals(Math.max(0, remainingBalance), 2),
            cumulativeInterest: roundToDecimals(cumulativeInterest, 2),
            cumulativePrincipal: roundToDecimals(cumulativePrincipal, 2)
        });
        
        // Break if loan is paid off
        if (remainingBalance <= 0.01) {
            break;
        }
    }
    
    // SAFETY CHECK: Warn if we hit the iteration limit
    if (iterations >= ABSOLUTE_MAX_ITERATIONS) {
        console.error('❌ SAFETY: Hit maximum iteration limit! Possible infinite loop prevented.');
        console.error(`Parameters: principal=${principal}, rate=${annualRate}, tilgung=${tilgungRate}, years=${maxYears}`);
    }
    
    return schedule;
}

/**
 * Calculates loan statistics from amortization schedule
 * 
 * @param {Array<PaymentRecord>} schedule - Amortization schedule
 * @param {number} principal - Initial loan amount
 * @returns {Object} Loan statistics
 */
export function calculateLoanStatistics(schedule, principal) {
    if (!schedule || schedule.length === 0) {
        return null;
    }
    
    const lastPayment = schedule[schedule.length - 1];
    const totalInterest = lastPayment.cumulativeInterest;
    const totalPaid = principal + totalInterest;
    const actualMonths = schedule.length;
    const actualYears = actualMonths / 12;
    
    // Calculate average monthly payment (excluding special payments)
    const totalRegularPayments = schedule.reduce((sum, record) => sum + record.payment, 0);
    const averageMonthlyPayment = totalRegularPayments / schedule.length;
    
    // Calculate total special payments
    const totalSpecialPayments = schedule.reduce((sum, record) => sum + record.specialPayment, 0);
    
    return {
        totalInterest: roundToDecimals(totalInterest, 2),
        totalPaid: roundToDecimals(totalPaid, 2),
        totalSpecialPayments: roundToDecimals(totalSpecialPayments, 2),
        actualMonths,
        actualYears: roundToDecimals(actualYears, 2),
        payoffDate: lastPayment.date,
        averageMonthlyPayment: roundToDecimals(averageMonthlyPayment, 2),
        interestPercentage: roundToDecimals((totalInterest / principal) * 100, 2)
    };
}

/**
 * Calculates time and money saved compared to baseline scenario
 * 
 * @param {Object} baselineStats - Statistics from baseline scenario
 * @param {Object} optimizedStats - Statistics from optimized scenario
 * @returns {Object} Savings information
 */
export function calculateSavings(baselineStats, optimizedStats) {
    if (!baselineStats || !optimizedStats) {
        return null;
    }
    
    const interestSaved = baselineStats.totalInterest - optimizedStats.totalInterest;
    const monthsSaved = baselineStats.actualMonths - optimizedStats.actualMonths;
    const yearsSaved = monthsSaved / 12;
    
    return {
        interestSaved: roundToDecimals(interestSaved, 2),
        monthsSaved,
        yearsSaved: roundToDecimals(yearsSaved, 2),
        percentageSaved: roundToDecimals((interestSaved / baselineStats.totalInterest) * 100, 2)
    };
}

/**
 * Calculates interest saved by each individual special payment
 * Compares scenario with all special payments vs. scenario without each specific payment
 * 
 * @param {number} principal - Initial loan amount in EUR
 * @param {number} annualRate - Annual interest rate as percentage
 * @param {number} tilgungRate - Annual tilgung rate as percentage
 * @param {number} maxYears - Maximum loan duration in years
 * @param {Array<{id: string, date: Date, amount: number}>} specialPayments - Array of special payments
 * @param {Date} startDate - Loan start date
 * @param {Array<{id: string, date: Date, rate: number}>} tilgungChanges - Array of tilgung rate changes
 * @returns {Array<{id: string, interestSaved: number}>} Interest saved by each payment
 */
export function calculateSpecialPaymentSavings(principal, annualRate, tilgungRate, maxYears, specialPayments, startDate, tilgungChanges = []) {
    if (!specialPayments || specialPayments.length === 0) {
        return [];
    }
    
    // Generate schedule with ALL special payments
    const fullSchedule = generateAmortizationSchedule(
        principal, annualRate, tilgungRate, maxYears, specialPayments, startDate, tilgungChanges
    );
    const fullStats = calculateLoanStatistics(fullSchedule, principal);
    
    // For each special payment, calculate what the interest would be WITHOUT it
    const savings = specialPayments.map(payment => {
        // Create array without this specific payment
        const paymentsWithoutThis = specialPayments.filter(p => p.id !== payment.id);
        
        // Generate schedule without this payment
        const scheduleWithoutThis = generateAmortizationSchedule(
            principal, annualRate, tilgungRate, maxYears, paymentsWithoutThis, startDate, tilgungChanges
        );
        const statsWithoutThis = calculateLoanStatistics(scheduleWithoutThis, principal);
        
        // Calculate interest saved by this specific payment
        const interestSaved = statsWithoutThis.totalInterest - fullStats.totalInterest;
        
        return {
            id: payment.id,
            interestSaved: roundToDecimals(Math.max(0, interestSaved), 2)
        };
    });
    
    return savings;
}

/**
 * Calculates interest saved by each individual repayment rate change
 * Compares each change against keeping the ORIGINAL repayment rate throughout
 * 
 * @param {number} principal - Initial loan amount in EUR
 * @param {number} annualRate - Annual interest rate as percentage
 * @param {number} tilgungRate - Initial annual repayment rate as percentage
 * @param {number} maxYears - Maximum loan duration in years
 * @param {Array<{id: string, date: Date, amount: number}>} specialPayments - Array of special payments
 * @param {Date} startDate - Loan start date
 * @param {Array<{id: string, date: Date, rate: number}>} tilgungChanges - Array of repayment rate changes
 * @returns {Array<{id: string, interestSaved: number}>} Interest saved by each repayment change
 */
export function calculateTilgungChangeSavings(principal, annualRate, tilgungRate, maxYears, specialPayments, startDate, tilgungChanges) {
    if (!tilgungChanges || tilgungChanges.length === 0) {
        return [];
    }
    
    // Generate baseline schedule with NO repayment changes (original rate throughout)
    const baselineSchedule = generateAmortizationSchedule(
        principal, annualRate, tilgungRate, maxYears, specialPayments, startDate, [] // No repayment changes
    );
    const baselineStats = calculateLoanStatistics(baselineSchedule, principal);
    
    // For each repayment change, calculate what the interest would be with ONLY that change
    const savings = tilgungChanges.map(change => {
        // Generate schedule with ONLY this specific change
        const scheduleWithOnlyThis = generateAmortizationSchedule(
            principal, annualRate, tilgungRate, maxYears, specialPayments, startDate, [change]
        );
        const statsWithOnlyThis = calculateLoanStatistics(scheduleWithOnlyThis, principal);
        
        // Calculate interest saved by this specific change compared to baseline
        // Positive = saves interest (higher rate)
        // Negative = costs more interest (lower rate)
        const interestSaved = baselineStats.totalInterest - statsWithOnlyThis.totalInterest;
        
        return {
            id: change.id,
            interestSaved: roundToDecimals(interestSaved, 2) // Can be negative
        };
    });
    
    return savings;
}

/**
 * Calculates effective annual interest rate (APR)
 * This is a simplified calculation - real APR includes fees
 * 
 * @param {number} principal - Loan amount
 * @param {number} monthlyPayment - Monthly payment
 * @param {number} months - Number of months
 * @returns {number} Effective annual rate as percentage
 */
export function calculateEffectiveRate(principal, monthlyPayment, months) {
    // Use Newton-Raphson method to solve for rate
    let rate = 0.05; // Initial guess: 5%
    const tolerance = 0.0001;
    const maxIterations = 100;
    
    for (let i = 0; i < maxIterations; i++) {
        const monthlyRate = rate / 12;
        const factor = Math.pow(1 + monthlyRate, months);
        const pv = monthlyPayment * (factor - 1) / (monthlyRate * factor);
        const error = pv - principal;
        
        if (Math.abs(error) < tolerance) {
            break;
        }
        
        // Derivative for Newton-Raphson
        const derivative = monthlyPayment * (
            (months * factor) / (monthlyRate * factor) -
            (factor - 1) / (monthlyRate * monthlyRate * factor) -
            (months * (factor - 1)) / (monthlyRate * factor * factor)
        ) / 12;
        
        rate = rate - error / derivative;
    }
    
    return roundToDecimals(rate * 100, 2);
}

/**
 * Validates calculation inputs
 * 
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Interest rate
 * @param {number} tilgungRate - Tilgung rate
 * @param {number} years - Duration
 * @returns {boolean} True if inputs are valid
 */
export function validateCalculationInputs(principal, annualRate, tilgungRate, years) {
    if (principal <= 0 || principal > 10000000) return false;
    if (annualRate < 0 || annualRate > 15) return false;
    if (tilgungRate < 0 || tilgungRate > 10) return false;
    if (years <= 0 || years > 40) return false;
    return true;
}

/**
 * Calculates the remaining balance at a specific month
 * 
 * @param {number} principal - Initial loan amount
 * @param {number} annualRate - Annual interest rate
 * @param {number} monthlyPayment - Monthly payment amount
 * @param {number} month - Month number
 * @returns {number} Remaining balance
 */
export function calculateRemainingBalance(principal, annualRate, monthlyPayment, month) {
    const monthlyRate = annualRate / 12 / 100;
    
    if (monthlyRate === 0) {
        return Math.max(0, principal - (monthlyPayment * month));
    }
    
    const factor = Math.pow(1 + monthlyRate, month);
    const balance = principal * factor - monthlyPayment * (factor - 1) / monthlyRate;
    
    return roundToDecimals(Math.max(0, balance), 2);
}
