/**
 * Optimization analyzer for loan scenarios
 * Generates ranked suggestions with clear explanations
 * Jake Wharton style: clear APIs, thoughtful abstractions
 */

import {
    generateAmortizationSchedule,
    calculateLoanStatistics,
    calculateSavings
} from './calculator.js';
import { roundToDecimals, formatCurrency } from './utils.js';

/**
 * Optimization suggestion structure
 * @typedef {Object} OptimizationSuggestion
 * @property {string} id - Unique identifier
 * @property {string} title - Suggestion title
 * @property {string} description - What to do
 * @property {string} explanation - Why it matters
 * @property {string} impact - 'high' | 'medium' | 'low'
 * @property {number} monthlyCost - Additional monthly cost (0 if one-time)
 * @property {number} totalSavings - Total EUR saved
 * @property {number} timeSaved - Months saved
 * @property {number} roiScore - Return on investment score
 * @property {string} recommendation - Recommendation strength
 * @property {Object} modifiedParams - Modified loan parameters
 */

/**
 * Generates optimization suggestions for a loan
 * 
 * @param {Object} baselineParams - Current loan parameters
 * @param {Object} baselineStats - Current loan statistics
 * @returns {Array<OptimizationSuggestion>} Ranked suggestions
 */
export function generateOptimizationSuggestions(baselineParams, baselineStats) {
    const suggestions = [];
    
    // 1. Increase Tilgung by 1%
    suggestions.push(analyzeTilgungIncrease(baselineParams, baselineStats, 1));
    
    // 2. Increase Tilgung by 2%
    suggestions.push(analyzeTilgungIncrease(baselineParams, baselineStats, 2));
    
    // 3. Add annual special payment of 5000 EUR
    suggestions.push(analyzeAnnualSpecialPayment(baselineParams, baselineStats, 5000));
    
    // 4. Add annual special payment of 2000 EUR
    suggestions.push(analyzeAnnualSpecialPayment(baselineParams, baselineStats, 2000));
    
    // 5. Add one-time early special payment
    suggestions.push(analyzeEarlySpecialPayment(baselineParams, baselineStats, 10000, 1));
    
    // 6. Negotiate interest rate down by 0.3%
    suggestions.push(analyzeRateReduction(baselineParams, baselineStats, 0.3));
    
    // 7. Negotiate interest rate down by 0.5%
    suggestions.push(analyzeRateReduction(baselineParams, baselineStats, 0.5));
    
    // Filter out invalid suggestions and rank by impact
    return suggestions
        .filter(s => s !== null && s.totalSavings > 0)
        .map(s => ({
            ...s,
            impact: determineImpact(s.totalSavings, s.timeSaved),
            recommendation: determineRecommendation(s)
        }))
        .sort((a, b) => {
            // Sort by impact level first, then by total savings
            const impactOrder = { high: 0, medium: 1, low: 2 };
            if (impactOrder[a.impact] !== impactOrder[b.impact]) {
                return impactOrder[a.impact] - impactOrder[b.impact];
            }
            return b.totalSavings - a.totalSavings;
        });
}

/**
 * Analyzes the impact of increasing repayment rate
 */
function analyzeTilgungIncrease(baselineParams, baselineStats, increasePercent) {
    const newTilgung = baselineParams.tilgung + increasePercent;
    
    if (newTilgung > 10) {
        return null; // Invalid
    }
    
    const modifiedParams = {
        ...baselineParams,
        tilgung: newTilgung
    };
    
    const schedule = generateAmortizationSchedule(
        modifiedParams.principal,
        modifiedParams.interestRate,
        modifiedParams.tilgung,
        modifiedParams.duration,
        modifiedParams.specialPayments || []
    );
    
    const stats = calculateLoanStatistics(schedule, modifiedParams.principal);
    const savings = calculateSavings(baselineStats, stats);
    
    // Calculate monthly cost increase
    const baselineMonthly = baselineStats.averageMonthlyPayment;
    const newMonthly = stats.averageMonthlyPayment;
    const monthlyCost = newMonthly - baselineMonthly;
    
    // Calculate ROI
    const totalExtraCost = monthlyCost * stats.actualMonths;
    const roiScore = totalExtraCost > 0 ? savings.interestSaved / totalExtraCost : 0;
    
    return {
        id: `tilgung-increase-${increasePercent}`,
        title: `Increase Repayment by ${increasePercent}%`,
        description: `Increase your annual repayment from ${baselineParams.tilgung}% to ${newTilgung}%`,
        explanation: `Early payments reduce the principal faster, which means less interest compounds over time. This is exponential, not linear. By paying more each month now, you save significantly more in interest later.`,
        monthlyCost: roundToDecimals(monthlyCost, 2),
        totalSavings: savings.interestSaved,
        timeSaved: savings.monthsSaved,
        roiScore: roundToDecimals(roiScore, 2),
        modifiedParams
    };
}

/**
 * Analyzes the impact of annual special payments
 */
function analyzeAnnualSpecialPayment(baselineParams, baselineStats, annualAmount) {
    const specialPayments = [...(baselineParams.specialPayments || [])];
    const startDate = new Date();
    
    // Add annual payments for the duration of the loan
    const maxYears = Math.min(baselineParams.duration, 20); // Cap at 20 years
    for (let year = 1; year <= maxYears; year++) {
        const paymentDate = new Date(startDate);
        paymentDate.setFullYear(paymentDate.getFullYear() + year);
        specialPayments.push({
            date: paymentDate,
            amount: annualAmount
        });
    }
    
    const modifiedParams = {
        ...baselineParams,
        specialPayments
    };
    
    const schedule = generateAmortizationSchedule(
        modifiedParams.principal,
        modifiedParams.interestRate,
        modifiedParams.tilgung,
        modifiedParams.duration,
        specialPayments
    );
    
    const stats = calculateLoanStatistics(schedule, modifiedParams.principal);
    const savings = calculateSavings(baselineStats, stats);
    
    // Monthly cost equivalent
    const monthlyCost = annualAmount / 12;
    
    // Calculate ROI
    const totalExtraCost = stats.totalSpecialPayments;
    const roiScore = totalExtraCost > 0 ? savings.interestSaved / totalExtraCost : 0;
    
    return {
        id: `annual-special-${annualAmount}`,
        title: `Add ${formatCurrency(annualAmount)} Annual Payment`,
        description: `Make a special payment of ${formatCurrency(annualAmount)} every year`,
        explanation: `Consistent special payments chip away at the principal steadily. Each payment reduces your loan balance, which means you pay less interest on that amount for the rest of the loan. It's like compound interest working in your favor.`,
        monthlyCost: roundToDecimals(monthlyCost, 2),
        totalSavings: savings.interestSaved,
        timeSaved: savings.monthsSaved,
        roiScore: roundToDecimals(roiScore, 2),
        modifiedParams
    };
}

/**
 * Analyzes the impact of an early special payment
 */
function analyzeEarlySpecialPayment(baselineParams, baselineStats, amount, yearNumber) {
    const specialPayments = [...(baselineParams.specialPayments || [])];
    const paymentDate = new Date();
    paymentDate.setFullYear(paymentDate.getFullYear() + yearNumber);
    
    specialPayments.push({
        date: paymentDate,
        amount: amount
    });
    
    const modifiedParams = {
        ...baselineParams,
        specialPayments
    };
    
    const schedule = generateAmortizationSchedule(
        modifiedParams.principal,
        modifiedParams.interestRate,
        modifiedParams.tilgung,
        modifiedParams.duration,
        specialPayments
    );
    
    const stats = calculateLoanStatistics(schedule, modifiedParams.principal);
    const savings = calculateSavings(baselineStats, stats);
    
    // Calculate ROI
    const roiScore = amount > 0 ? savings.interestSaved / amount : 0;
    
    return {
        id: `early-special-${amount}-year${yearNumber}`,
        title: `Add ${formatCurrency(amount)} in Year ${yearNumber}`,
        description: `Make a one-time special payment of ${formatCurrency(amount)} in year ${yearNumber}`,
        explanation: `A payment today saves you from paying interest on that amount for the entire remaining loan duration. Early payments have exponential impact because they reduce the base on which interest compounds. The earlier you pay, the more you save.`,
        monthlyCost: 0, // One-time payment
        totalSavings: savings.interestSaved,
        timeSaved: savings.monthsSaved,
        roiScore: roundToDecimals(roiScore, 2),
        modifiedParams
    };
}

/**
 * Analyzes the impact of negotiating a lower interest rate
 */
function analyzeRateReduction(baselineParams, baselineStats, reduction) {
    const newRate = baselineParams.interestRate - reduction;
    
    if (newRate < 0.1) {
        return null; // Invalid
    }
    
    const modifiedParams = {
        ...baselineParams,
        interestRate: newRate
    };
    
    const schedule = generateAmortizationSchedule(
        modifiedParams.principal,
        modifiedParams.interestRate,
        modifiedParams.tilgung,
        modifiedParams.duration,
        modifiedParams.specialPayments || []
    );
    
    const stats = calculateLoanStatistics(schedule, modifiedParams.principal);
    const savings = calculateSavings(baselineStats, stats);
    
    return {
        id: `rate-reduction-${reduction}`,
        title: `Negotiate ${reduction}% Lower Rate`,
        description: `Reduce your interest rate from ${baselineParams.interestRate}% to ${newRate}%`,
        explanation: `Even small rate reductions compound over long periods. A lower rate means less interest accrues each month, which adds up significantly over years. This requires negotiation effort but has no ongoing cost.`,
        monthlyCost: 0, // No additional cost
        totalSavings: savings.interestSaved,
        timeSaved: savings.monthsSaved,
        roiScore: Infinity, // No cost, pure savings
        modifiedParams
    };
}

/**
 * Determines impact level based on savings
 */
function determineImpact(totalSavings, timeSaved) {
    if (totalSavings > 10000 || timeSaved > 12) {
        return 'high';
    } else if (totalSavings > 3000 || timeSaved > 6) {
        return 'medium';
    } else {
        return 'low';
    }
}

/**
 * Determines recommendation strength
 */
function determineRecommendation(suggestion) {
    if (suggestion.impact === 'high' && suggestion.roiScore > 20) {
        return 'Highly recommended';
    } else if (suggestion.impact === 'high' || suggestion.roiScore > 10) {
        return 'Worth considering';
    } else if (suggestion.impact === 'medium') {
        return 'Consider if possible';
    } else {
        return 'Minimal benefit';
    }
}

/**
 * Generates a comparison between two loan scenarios
 * 
 * @param {Object} scenario1 - First scenario stats
 * @param {Object} scenario2 - Second scenario stats
 * @returns {Object} Comparison data
 */
export function compareScenarios(scenario1, scenario2) {
    return {
        interestDifference: roundToDecimals(scenario1.totalInterest - scenario2.totalInterest, 2),
        timeDifference: scenario1.actualMonths - scenario2.actualMonths,
        paymentDifference: roundToDecimals(scenario1.averageMonthlyPayment - scenario2.averageMonthlyPayment, 2),
        totalPaidDifference: roundToDecimals(scenario1.totalPaid - scenario2.totalPaid, 2)
    };
}

/**
 * Analyzes the diminishing returns of late-term special payments
 * 
 * @param {Object} params - Loan parameters
 * @param {Object} stats - Current loan statistics
 * @returns {Object} Analysis of late payment impact
 */
export function analyzeLatePaymentImpact(params, stats) {
    const lateYear = Math.max(1, Math.floor(params.duration * 0.8)); // 80% through loan
    const amount = 5000;
    
    const suggestion = analyzeEarlySpecialPayment(params, stats, amount, lateYear);
    
    return {
        ...suggestion,
        warning: `By year ${lateYear}, most interest has already been paid. Your money might be better invested elsewhere or used for early payments in a refinance.`
    };
}
