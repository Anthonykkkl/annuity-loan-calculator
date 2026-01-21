/**
 * Main UI controller
 * Handles user interactions, form validation, and orchestrates all modules
 */

import {
    generateAmortizationSchedule,
    calculateLoanStatistics,
    validateCalculationInputs,
    calculateSpecialPaymentSavings,
    calculateTilgungChangeSavings
} from './calculator.js';
import {
    createTimelineChart,
    createBreakdownChart,
    createComparisonChart
} from './charts.js';
import {
    generateOptimizationSuggestions
} from './optimizer.js';
import {
    formatCurrency,
    formatMonthYear,
    formatDate,
    validateLoanParams,
    exportToCSV,
    saveToLocalStorage,
    loadFromLocalStorage,
    generateId,
    debounce
} from './utils.js';
import {
    animateNumber,
    flashHighlight,
    shakeElement,
    slideInRight,
    staggeredFadeIn,
    addRippleEffect,
    showConfetti
} from './animations.js';

// Application state
let currentSchedule = null;
let currentStats = null;
let currentParams = null;
let baselineSchedule = null; // Schedule without special payments for comparison
let baselineStats = null; // Stats without special payments for comparison
let specialPayments = [];
let tilgungChanges = [];

/**
 * Initializes the application
 */
function init() {
    console.log('🚀 Initializing Annuity Loan Calculator...');
    
    try {
        // Hide loading overlay
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.style.opacity = '0';
                loadingOverlay.style.transition = 'opacity 0.3s ease-out';
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                }, 300);
            }, 100);
        }
        
        // Set default start date to 01.12.2023 if not set
        const startDateInput = document.getElementById('start-date');
        if (startDateInput && !startDateInput.value) {
            startDateInput.value = '2023-12-01';
        }
        
        // Clear any error states from previous sessions
        document.querySelectorAll('.form-input').forEach(input => {
            input.classList.remove('error');
        });
        document.querySelectorAll('.form-error').forEach(errorEl => {
            errorEl.textContent = '';
        });
        
        // Load saved data from localStorage
        console.log('📦 Loading saved data...');
        loadSavedData();
        
        // Don't auto-generate special payments - let user add them manually
        // User can use the "Default Annual Special Payment" field to generate them
        
        // Set up event listeners
        console.log('🎯 Setting up event listeners...');
        setupEventListeners();
        
        // Initialize scroll reveal
        // initScrollReveal(); // Commented out for initial load
        
        // Run initial calculation if we have default values
        console.log('🔢 Running initial calculation...');
        const startTime = performance.now();
        if (validateForm()) {
            calculate();
            const endTime = performance.now();
            console.log(`⏱️ Initial calculation took ${(endTime - startTime).toFixed(2)}ms`);
        }
        
        console.log('✅ Initialization complete!');
    } catch (error) {
        console.error('❌ Initialization error:', error);
        
        // Hide loading overlay even on error
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.innerHTML = `
                <div style="text-align: center; color: #ef4444;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                    <div style="font-size: 1.5rem; font-weight: 600;">Initialization Failed</div>
                    <div style="font-size: 1rem; margin-top: 0.5rem;">${error.message}</div>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #2563eb; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1rem;">Reload Page</button>
                </div>
            `;
        }
    }
}

/**
 * Sets up all event listeners
 */
function setupEventListeners() {
    // Form submission (keep for accessibility - Enter key)
    const form = document.getElementById('loan-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        calculate();
    });
    
    // Real-time calculation on input change
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        // Validate on blur
        input.addEventListener('blur', () => validateInput(input));
        
        // Auto-calculate on input change (debounced for performance)
        input.addEventListener('input', debounce(() => {
            saveFormData();
            if (validateForm()) {
                calculate();
            }
        }, 300)); // 300ms debounce - feels instant but prevents excessive calculations
    });
    
    // Tilgung changes
    const addTilgungChangeBtn = document.getElementById('add-tilgung-change');
    if (addTilgungChangeBtn) {
        addTilgungChangeBtn.addEventListener('click', addTilgungChange);
    }
    
    // Special payments
    const addPaymentBtn = document.getElementById('add-special-payment');
    if (addPaymentBtn) {
        addPaymentBtn.addEventListener('click', addSpecialPayment);
    }
    
    // Generate special payments button
    const generateSpecialPaymentsBtn = document.getElementById('generate-special-payments-btn');
    if (generateSpecialPaymentsBtn) {
        generateSpecialPaymentsBtn.addEventListener('click', () => {
            const defaultAmount = parseFloat(document.getElementById('default-special-payment').value);
            
            if (!defaultAmount || defaultAmount <= 0) {
                alert('Please enter a default annual special payment amount greater than 0.');
                return;
            }
            
            // Ask for confirmation if special payments already exist
            if (specialPayments.length > 0) {
                if (!confirm(`This will replace all ${specialPayments.length} existing special payments. Continue?`)) {
                    return;
                }
            }
            
            // Clear and regenerate
            specialPayments = [];
            generateDefaultSpecialPayments();
            calculate();
        });
    }
    
    // Chart tabs
    const chartTabs = document.querySelectorAll('.chart-tab');
    chartTabs.forEach(tab => {
        tab.addEventListener('click', () => switchChartTab(tab));
    });
    
    // Table toggle
    const toggleTableBtn = document.getElementById('toggle-table');
    toggleTableBtn.addEventListener('click', toggleTable);
    
    // CSV export
    const exportBtn = document.getElementById('export-csv');
    exportBtn.addEventListener('click', exportTableToCSV);
    
    // Add ripple effect to all buttons
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', addRippleEffect);
    });
}

/**
 * Validates a single input field
 */
function validateInput(input) {
    // Skip validation for optional fields that are empty
    if (!input.required && (!input.value || input.value === '' || input.value === '0')) {
        input.classList.remove('error');
        const errorElement = document.getElementById(`${input.id}-error`);
        if (errorElement) {
            errorElement.textContent = '';
        }
        return true;
    }
    
    const value = parseFloat(input.value);
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    const errorElement = document.getElementById(`${input.id}-error`);
    
    if (isNaN(value) || value < min || value > max) {
        input.classList.add('error');
        shakeElement(input);
        if (errorElement) {
            errorElement.textContent = `Value must be between ${min} and ${max}`;
        }
        return false;
    } else {
        input.classList.remove('error');
        if (errorElement) {
            errorElement.textContent = '';
        }
        return true;
    }
}

/**
 * Validates the entire form
 */
function validateForm() {
    const form = document.getElementById('loan-form');
    const inputs = form.querySelectorAll('input[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

/**
 * Gets form data
 */
function getFormData() {
    const startDateInput = document.getElementById('start-date');
    let startDate = startDateInput ? new Date(startDateInput.value) : new Date();
    
    // If no date set or invalid, use today
    if (!startDateInput || !startDateInput.value || isNaN(startDate.getTime())) {
        startDate = new Date();
    }
    
    return {
        startDate,
        principal: parseFloat(document.getElementById('principal').value),
        interestRate: parseFloat(document.getElementById('interest-rate').value),
        effectiveRate: parseFloat(document.getElementById('effective-rate').value) || 
                       parseFloat(document.getElementById('interest-rate').value),
        tilgung: parseFloat(document.getElementById('tilgung').value),
        duration: parseInt(document.getElementById('duration').value),
        specialPayments: [...specialPayments],
        tilgungChanges: [...tilgungChanges]
    };
}

/**
 * Main calculation function
 */
function calculate() {
    console.log('🔢 Starting calculation...');
    
    if (!validateForm()) {
        console.warn('⚠️  Form validation failed');
        return;
    }
    
    try {
        const params = getFormData();
        console.log('📊 Parameters:', params);
        currentParams = params;
        
        // Always generate baseline schedule (without special payments AND without repayment changes) for comparison
        // This ensures we have accurate savings calculations
        // IMPORTANT: Use a large max duration (40 years) to let the loan run until fully paid off
        // This shows the TRUE time saved by special payments and repayment changes, not limited by contract duration
        baselineSchedule = generateAmortizationSchedule(
            params.principal,
            params.interestRate,
            params.tilgung,
            40, // Use max duration to let loan run until fully paid off
            [], // No special payments
            params.startDate,
            [] // No repayment changes - pure baseline
        );
        baselineStats = calculateLoanStatistics(baselineSchedule, params.principal);
        console.log('📊 Baseline stats calculated (no special payments, no repayment changes, until fully paid):', baselineStats);
        
        // Generate amortization schedule with special payments
        console.log('📈 Generating amortization schedule...');
        console.log(`📅 Special payments: ${params.specialPayments.length}`, params.specialPayments);
        console.log(`📈 Tilgung changes: ${params.tilgungChanges.length}`, params.tilgungChanges);
        currentSchedule = generateAmortizationSchedule(
            params.principal,
            params.interestRate,
            params.tilgung,
            params.duration,
            params.specialPayments,
            params.startDate,
            params.tilgungChanges
        );
        console.log(`✅ Schedule generated: ${currentSchedule.length} months`);
        
        // Log special payments in schedule
        const monthsWithSpecialPayments = currentSchedule.filter(m => m.specialPayment > 0);
        console.log(`💰 Months with special payments: ${monthsWithSpecialPayments.length}`, 
                    monthsWithSpecialPayments.map(m => ({ month: m.month, amount: m.specialPayment })));
        
        // Calculate statistics
        console.log('📊 Calculating statistics...');
        currentStats = calculateLoanStatistics(currentSchedule, params.principal);
        console.log('✅ Statistics calculated');
        
        // Update UI
        console.log('🎨 Updating UI...');
        updateStatistics(currentStats, params);
        updateCharts();
        updateTable();
        
        // Update special payments display with interest savings
        renderSpecialPayments();
        
        // Update repayment changes display with interest savings
        renderTilgungChanges();
        
        // OPTIMIZATION: Skip optimization suggestions on initial load for faster startup
        // They can be generated on-demand later
        console.log('⏭️ Skipping optimization suggestions for faster initial load');
        // updateOptimizations(); // Commented out for performance
        console.log('✅ UI updated');
        
        // Save to localStorage
        saveFormData();
        console.log('💾 Data saved');
        
    } catch (error) {
        console.error('❌ Calculation error:', error);
        alert('Calculation failed. Please check your inputs and try again.');
    }
}

/**
 * Updates the statistics dashboard
 */
function updateStatistics(stats, params) {
    if (!stats) return;
    
    // Hero metrics
    const totalInterestEl = document.getElementById('total-interest');
    const interestContextEl = document.getElementById('interest-context');
    const timeSavedEl = document.getElementById('time-saved');
    const timeSavedContextEl = document.getElementById('time-saved-context');
    
    // Animate total interest
    animateNumber(
        totalInterestEl,
        0,
        stats.totalInterest,
        1500,
        (v) => formatCurrency(v)
    );
    
    // Show savings if special payments exist
    const interestSavingsEl = document.getElementById('interest-savings');
    const interestSavingsAmountEl = document.getElementById('interest-savings-amount');
    
    if (specialPayments.length > 0 && baselineStats) {
        const savings = baselineStats.totalInterest - stats.totalInterest;
        if (savings > 0) {
            interestSavingsAmountEl.textContent = formatCurrency(savings);
            interestSavingsEl.style.display = 'flex';
        } else {
            interestSavingsEl.style.display = 'none';
        }
    } else {
        interestSavingsEl.style.display = 'none';
    }
    
    // Show context
    const interestPercentage = ((stats.totalInterest / params.principal) * 100).toFixed(1);
    interestContextEl.textContent = `That's ${interestPercentage}% of your loan amount`;
    
    // Calculate time saved vs. baseline (without special payments and repayment changes)
    if ((specialPayments.length > 0 || tilgungChanges.length > 0) && baselineStats) {
        const monthsSaved = baselineStats.actualMonths - stats.actualMonths;
        const yearsSaved = (monthsSaved / 12).toFixed(1);
        
        console.log('⏱️ Time saved calculation:');
        console.log(`   Baseline (no special payments, no repayment changes): ${baselineStats.actualMonths} months (${(baselineStats.actualMonths/12).toFixed(1)} years)`);
        console.log(`   Current scenario: ${stats.actualMonths} months (${(stats.actualMonths/12).toFixed(1)} years)`);
        console.log(`   Time saved: ${monthsSaved} months (${yearsSaved} years)`);
        
        if (monthsSaved > 0) {
            timeSavedEl.textContent = `${yearsSaved} years`;
            
            // Create context message based on what's active
            let contextParts = [];
            if (specialPayments.length > 0) contextParts.push('special payments');
            if (tilgungChanges.length > 0) contextParts.push('repayment changes');
            const contextStr = contextParts.join(' and ');
            
            timeSavedContextEl.textContent = `Pay off ${monthsSaved} months earlier (vs. ${(baselineStats.actualMonths/12).toFixed(1)} years baseline)`;
        } else {
            timeSavedEl.textContent = '—';
            timeSavedContextEl.textContent = 'No time saved yet';
        }
    } else {
        timeSavedEl.textContent = '—';
        timeSavedContextEl.textContent = 'Add special payments or change repayment rate to save time';
    }
    
    // Secondary metrics
    const monthlyPaymentEl = document.getElementById('monthly-payment');
    const totalPaidEl = document.getElementById('total-paid');
    const totalSpecialPaymentsEl = document.getElementById('total-special-payments');
    const payoffDateEl = document.getElementById('payoff-date');
    
    // Get current schedule to check for repayment changes
    const schedule = currentSchedule || [];
    const initialMonthlyPayment = schedule.length > 0 ? schedule[0].payment : stats.averageMonthlyPayment;
    const latestMonthlyPayment = schedule.length > 0 ? schedule[schedule.length - 1].payment : stats.averageMonthlyPayment;
    
    // Show current monthly payment (use latest if repayment changed, otherwise average)
    const displayMonthlyPayment = tilgungChanges.length > 0 ? latestMonthlyPayment : stats.averageMonthlyPayment;
    
    animateNumber(
        monthlyPaymentEl,
        0,
        displayMonthlyPayment,
        1000,
        (v) => formatCurrency(v)
    );
    
    // Show monthly payment comparison if repayment rate changed
    const monthlyPaymentComparisonEl = document.getElementById('monthly-payment-comparison');
    const monthlyPaymentIncreaseEl = document.getElementById('monthly-payment-increase');
    const monthlyPaymentBaselineEl = document.getElementById('monthly-payment-baseline');
    
    if (tilgungChanges.length > 0 && schedule.length > 0) {
        const paymentDifference = latestMonthlyPayment - initialMonthlyPayment;
        if (Math.abs(paymentDifference) > 0.01) {
            const arrow = monthlyPaymentComparisonEl.querySelector('.comparison-arrow');
            if (paymentDifference > 0) {
                arrow.textContent = '↑';
                arrow.style.color = '#ef4444'; // Red for increase
                monthlyPaymentIncreaseEl.textContent = `+${formatCurrency(paymentDifference)}`;
            } else {
                arrow.textContent = '↓';
                arrow.style.color = '#10b981'; // Green for decrease
                monthlyPaymentIncreaseEl.textContent = formatCurrency(Math.abs(paymentDifference));
            }
            monthlyPaymentBaselineEl.textContent = formatCurrency(initialMonthlyPayment);
            monthlyPaymentComparisonEl.style.display = 'flex';
        } else {
            monthlyPaymentComparisonEl.style.display = 'none';
        }
    } else {
        monthlyPaymentComparisonEl.style.display = 'none';
    }
    
    animateNumber(
        totalPaidEl,
        0,
        stats.totalPaid,
        1200,
        (v) => formatCurrency(v)
    );
    
    // Show total paid comparison if special payments or repayment changes exist
    const totalPaidComparisonEl = document.getElementById('total-paid-comparison');
    const totalPaidSavingsEl = document.getElementById('total-paid-savings');
    const totalPaidBaselineEl = document.getElementById('total-paid-baseline');
    
    
    if ((specialPayments.length > 0 || tilgungChanges.length > 0) && baselineStats) {
        const totalPaidSavings = baselineStats.totalPaid - stats.totalPaid;
        if (totalPaidSavings > 0) {
            totalPaidSavingsEl.textContent = formatCurrency(totalPaidSavings);
            totalPaidBaselineEl.textContent = formatCurrency(baselineStats.totalPaid);
            totalPaidComparisonEl.style.display = 'flex';
        } else {
            totalPaidComparisonEl.style.display = 'none';
        }
    } else {
        totalPaidComparisonEl.style.display = 'none';
    }
    
    // Show special payments or placeholder
    if (stats.totalSpecialPayments > 0) {
        animateNumber(
            totalSpecialPaymentsEl,
            0,
            stats.totalSpecialPayments,
            1100,
            (v) => formatCurrency(v)
        );
    } else {
        totalSpecialPaymentsEl.textContent = '—';
    }
    
    // Payoff date with baseline comparison
    payoffDateEl.textContent = formatMonthYear(stats.payoffDate);
    
    const payoffDateComparisonEl = document.getElementById('payoff-date-comparison');
    const payoffDateBaselineEl = document.getElementById('payoff-date-baseline');
    
    if (specialPayments.length > 0 && baselineStats) {
        const monthsSaved = baselineStats.actualMonths - stats.actualMonths;
        if (monthsSaved > 0) {
            payoffDateBaselineEl.textContent = formatMonthYear(baselineStats.payoffDate);
            payoffDateComparisonEl.style.display = 'flex';
        } else {
            payoffDateComparisonEl.style.display = 'none';
        }
    } else {
        payoffDateComparisonEl.style.display = 'none';
    }
    
    // Staggered fade-in for metric cards
    const metricCards = document.querySelectorAll('.metric-card');
    staggeredFadeIn(metricCards, 100);
}

/**
 * Updates all charts
 */
function updateCharts() {
    if (!currentSchedule) {
        console.warn('⚠️  Cannot update charts: no schedule data');
        return;
    }
    
    try {
        // Update active chart
        const activeTab = document.querySelector('.chart-tab.active');
        if (!activeTab) {
            console.warn('⚠️  No active chart tab found');
            return;
        }
        
        const chartType = activeTab.dataset.chart;
        console.log(`📊 Rendering ${chartType} chart...`);
        
        if (chartType === 'timeline') {
            // Pass baseline schedule to show comparison
            createTimelineChart('chart-timeline', currentSchedule, {
                baselineSchedule: specialPayments.length > 0 ? baselineSchedule : null
            });
        } else if (chartType === 'breakdown') {
            createBreakdownChart('chart-breakdown', currentSchedule);
        }
        
        console.log('✅ Chart rendered');
    } catch (error) {
        console.error('❌ Error updating charts:', error);
    }
}

/**
 * Switches between chart tabs
 */
function switchChartTab(tab) {
    // Update active tab
    document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Update active chart
    document.querySelectorAll('.chart').forEach(c => c.classList.remove('active'));
    const chartId = `chart-${tab.dataset.chart}`;
    document.getElementById(chartId).classList.add('active');
    
    // Render chart if needed
    const chartType = tab.dataset.chart;
    if (chartType === 'timeline') {
        createTimelineChart('chart-timeline', currentSchedule, {
            baselineSchedule: specialPayments.length > 0 ? baselineSchedule : null
        });
    } else if (chartType === 'breakdown') {
        createBreakdownChart('chart-breakdown', currentSchedule);
    } else if (chartType === 'comparison' && currentSchedule) {
        // Use stored baseline schedule (or generate with max duration to show full payoff)
        const comparisonBaseline = baselineSchedule || generateAmortizationSchedule(
            currentParams.principal,
            currentParams.interestRate,
            currentParams.tilgung,
            40, // Use max duration to let loan run until fully paid off
            [],
            currentParams.startDate,
            currentParams.tilgungChanges
        );
        createComparisonChart('chart-comparison', baselineSchedule, currentSchedule);
    }
}

/**
 * Updates the amortization table
 */
function updateTable() {
    if (!currentSchedule) return;
    
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    
    currentSchedule.forEach(record => {
        const row = document.createElement('tr');
        if (record.specialPayment > 0) {
            row.classList.add('special-payment-row');
        }
        
        row.innerHTML = `
            <td>${record.month}</td>
            <td>${formatDate(record.date)}</td>
            <td>${formatCurrency(record.payment)}</td>
            <td>${formatCurrency(record.interest)}</td>
            <td>${formatCurrency(record.principal)}</td>
            <td>${record.specialPayment > 0 ? formatCurrency(record.specialPayment) : '—'}</td>
            <td>${formatCurrency(record.remainingBalance)}</td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * Toggles the amortization table visibility
 */
function toggleTable() {
    const container = document.getElementById('table-container');
    const btn = document.getElementById('toggle-table');
    
    if (container.classList.contains('collapsed')) {
        container.classList.remove('collapsed');
        container.classList.add('expanded');
        btn.textContent = 'Hide Table';
    } else {
        container.classList.add('collapsed');
        container.classList.remove('expanded');
        btn.textContent = 'Show Table';
    }
}

/**
 * Exports table to CSV
 */
function exportTableToCSV() {
    if (!currentSchedule) return;
    
    const data = currentSchedule.map(record => ({
        Month: record.month,
        Date: formatDate(record.date),
        Payment: record.payment,
        Interest: record.interest,
        Principal: record.principal,
        'Special Payment': record.specialPayment,
        'Remaining Balance': record.remainingBalance
    }));
    
    exportToCSV(data, 'amortization-schedule.csv');
}

/**
 * Updates optimization suggestions
 */
function updateOptimizations() {
    if (!currentStats || !currentParams) {
        console.warn('⚠️  Cannot update optimizations: missing stats or params');
        return;
    }
    
    try {
        console.log('💡 Generating optimization suggestions...');
        const suggestions = generateOptimizationSuggestions(currentParams, currentStats);
        console.log(`✅ Generated ${suggestions.length} suggestions`);
        
        const container = document.getElementById('optimization-list');
        container.innerHTML = '';
        
        suggestions.forEach(suggestion => {
            const card = createOptimizationCard(suggestion);
            container.appendChild(card);
        });
        
        // Staggered fade-in
        staggeredFadeIn(container.children, 100);
    } catch (error) {
        console.error('❌ Error updating optimizations:', error);
    }
}

/**
 * Creates an optimization suggestion card
 */
function createOptimizationCard(suggestion) {
    const card = document.createElement('div');
    card.className = 'optimization-card';
    
    const impactClass = `${suggestion.impact}-impact`;
    const impactLabel = suggestion.impact === 'high' ? 'High Impact' :
                       suggestion.impact === 'medium' ? 'Worth Considering' :
                       'Minimal Benefit';
    
    card.innerHTML = `
        <div class="optimization-header">
            <div>
                <h3 class="optimization-title">${suggestion.title}</h3>
                <span class="optimization-badge ${impactClass}">${impactLabel}</span>
            </div>
        </div>
        <div class="optimization-stats">
            <div class="optimization-stat">
                <div class="optimization-stat-label">Monthly Cost</div>
                <div class="optimization-stat-value">${suggestion.monthlyCost > 0 ? '+' + formatCurrency(suggestion.monthlyCost) : 'One-time'}</div>
            </div>
            <div class="optimization-stat">
                <div class="optimization-stat-label">Total Savings</div>
                <div class="optimization-stat-value">${formatCurrency(suggestion.totalSavings)}</div>
            </div>
            <div class="optimization-stat">
                <div class="optimization-stat-label">Time Saved</div>
                <div class="optimization-stat-value">${suggestion.timeSaved} months</div>
            </div>
        </div>
        <p class="optimization-explanation">${suggestion.explanation}</p>
    `;
    
    // Add click handler to apply optimization
    card.addEventListener('click', () => {
        applyOptimization(suggestion);
    });
    
    return card;
}

/**
 * Applies an optimization suggestion
 */
function applyOptimization(suggestion) {
    // Update form with modified parameters
    document.getElementById('principal').value = suggestion.modifiedParams.principal;
    document.getElementById('interest-rate').value = suggestion.modifiedParams.interestRate;
    document.getElementById('tilgung').value = suggestion.modifiedParams.tilgung;
    document.getElementById('duration').value = suggestion.modifiedParams.duration;
    
    // Update special payments
    specialPayments = [...(suggestion.modifiedParams.specialPayments || [])];
    renderSpecialPayments();
    
    // Recalculate
    calculate();
    
    // Show success feedback
    const card = event.currentTarget;
    flashHighlight(card, '#10b981');
}

/**
 * Adds a special payment
 */
function addSpecialPayment() {
    // Get the default special payment amount from the form
    const defaultSpecialPaymentInput = document.getElementById('default-special-payment');
    const defaultAmount = defaultSpecialPaymentInput ? parseFloat(defaultSpecialPaymentInput.value) || 5000 : 5000;
    
    let paymentDate;
    let paymentAmount = defaultAmount;
    
    // If there are existing special payments, copy the last one and increment year by 1
    if (specialPayments.length > 0) {
        const lastPayment = specialPayments[specialPayments.length - 1];
        paymentDate = new Date(lastPayment.date);
        paymentDate.setFullYear(paymentDate.getFullYear() + 1);
        paymentAmount = lastPayment.amount; // Use the same amount as the previous payment
    } else {
        // First payment: default to January 31st of the current year
        const now = new Date();
        paymentDate = new Date(now.getFullYear(), 0, 31, 12, 0, 0); // Month 0 = January, day 31, noon to avoid timezone issues
    }
    
    const payment = {
        id: generateId(),
        date: paymentDate,
        amount: paymentAmount
    };
    
    specialPayments.push(payment);
    renderSpecialPayments();
    saveFormData();
    calculate(); // Recalculate when special payment is added
}

/**
 * Removes a special payment
 */
function removeSpecialPayment(id) {
    specialPayments = specialPayments.filter(p => p.id !== id);
    renderSpecialPayments();
    saveFormData();
    calculate(); // Recalculate when special payment is removed
}

/**
 * Renders the special payments list
 */
function renderSpecialPayments() {
    const container = document.getElementById('special-payments-list');
    container.innerHTML = '';
    
    // Calculate interest savings for each special payment (if we have current params)
    let savingsMap = new Map();
    if (currentParams && specialPayments.length > 0) {
        try {
            const savings = calculateSpecialPaymentSavings(
                currentParams.principal,
                currentParams.interestRate,
                currentParams.tilgung,
                40, // Use max duration to calculate full savings
                specialPayments,
                currentParams.startDate,
                currentParams.tilgungChanges || []
            );
            savings.forEach(s => savingsMap.set(s.id, s.interestSaved));
        } catch (error) {
            console.warn('Could not calculate special payment savings:', error);
        }
    }
    
    specialPayments.forEach(payment => {
        const item = document.createElement('div');
        item.className = 'special-payment-item';
        
        const dateStr = payment.date.toISOString().split('T')[0];
        const interestSaved = savingsMap.get(payment.id);
        
        // Create interest savings display if available
        const savingsDisplay = interestSaved > 0 
            ? `<div class="special-payment-savings">💰 Saves ${formatCurrency(interestSaved)} in interest</div>`
            : '';
        
        item.innerHTML = `
            <div class="special-payment-inputs">
                <input 
                    type="date" 
                    class="special-payment-input" 
                    value="${dateStr}"
                    data-id="${payment.id}"
                />
                <input 
                    type="number" 
                    class="special-payment-input" 
                    value="${payment.amount}"
                    min="100"
                    max="100000"
                    step="100"
                    placeholder="Amount (EUR)"
                    data-id="${payment.id}"
                />
                <button type="button" class="btn-remove" data-id="${payment.id}">×</button>
            </div>
            ${savingsDisplay}
        `;
        
        // Event listeners
        const dateInput = item.querySelector('input[type="date"]');
        const amountInput = item.querySelector('input[type="number"]');
        const removeBtn = item.querySelector('.btn-remove');
        
        dateInput.addEventListener('change', (e) => {
            const p = specialPayments.find(sp => sp.id === payment.id);
            if (p) {
                p.date = new Date(e.target.value);
                saveFormData();
                calculate(); // Recalculate when date changes
            }
        });
        
        amountInput.addEventListener('change', (e) => {
            const p = specialPayments.find(sp => sp.id === payment.id);
            if (p) {
                p.amount = parseFloat(e.target.value);
                saveFormData();
                calculate(); // Recalculate when amount changes
            }
        });
        
        removeBtn.addEventListener('click', () => {
            removeSpecialPayment(payment.id);
        });
        
        container.appendChild(item);
        slideInRight(item);
    });
}

/**
 * Adds a new repayment change
 */
function addTilgungChange() {
    const change = {
        id: generateId(),
        date: new Date(),
        rate: 2.0
    };
    
    tilgungChanges.push(change);
    renderTilgungChanges();
    saveFormData();
    calculate(); // Recalculate when repayment change is added
}

/**
 * Removes a repayment change
 */
function removeTilgungChange(id) {
    tilgungChanges = tilgungChanges.filter(c => c.id !== id);
    renderTilgungChanges();
    saveFormData();
    calculate(); // Recalculate when repayment change is removed
}

/**
 * Renders the repayment changes list
 */
function renderTilgungChanges() {
    const container = document.getElementById('tilgung-changes-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Calculate interest savings for each repayment change (if we have current params)
    let savingsMap = new Map();
    if (currentParams && tilgungChanges.length > 0) {
        try {
            const savings = calculateTilgungChangeSavings(
                currentParams.principal,
                currentParams.interestRate,
                currentParams.tilgung,
                40, // Use max duration to calculate full savings
                currentParams.specialPayments || [],
                currentParams.startDate,
                tilgungChanges
            );
            savings.forEach(s => savingsMap.set(s.id, s.interestSaved));
        } catch (error) {
            console.warn('Could not calculate repayment change savings:', error);
        }
    }
    
    tilgungChanges.forEach(change => {
        const item = document.createElement('div');
        item.className = 'special-payment-item'; // Reuse same styling
        
        const dateStr = change.date.toISOString().split('T')[0];
        const interestSaved = savingsMap.get(change.id);
        
        // Create interest savings display if available
        let savingsDisplay = '';
        if (interestSaved !== undefined) {
            if (interestSaved > 0) {
                savingsDisplay = `<div class="special-payment-savings">💰 Saves ${formatCurrency(interestSaved)} in interest</div>`;
            } else if (interestSaved < 0) {
                savingsDisplay = `<div class="special-payment-savings repayment-cost">⚠️ Costs ${formatCurrency(Math.abs(interestSaved))} more in interest</div>`;
            }
        }
        
        item.innerHTML = `
            <div class="special-payment-inputs">
                <input 
                    type="date" 
                    class="special-payment-input" 
                    value="${dateStr}"
                    data-id="${change.id}"
                />
                <input 
                    type="number" 
                    class="special-payment-input" 
                    value="${change.rate}"
                    min="0.01"
                    max="10"
                    step="0.01"
                    placeholder="Rate (%)"
                    data-id="${change.id}"
                />
                <button type="button" class="btn-remove" data-id="${change.id}">×</button>
            </div>
            ${savingsDisplay}
        `;
        
        // Event listeners
        const dateInput = item.querySelector('input[type="date"]');
        const rateInput = item.querySelector('input[type="number"]');
        const removeBtn = item.querySelector('.btn-remove');
        
        dateInput.addEventListener('change', (e) => {
            const c = tilgungChanges.find(tc => tc.id === change.id);
            if (c) {
                c.date = new Date(e.target.value);
                saveFormData();
                calculate(); // Recalculate when date changes
            }
        });
        
        rateInput.addEventListener('change', (e) => {
            const c = tilgungChanges.find(tc => tc.id === change.id);
            if (c) {
                c.rate = parseFloat(e.target.value);
                saveFormData();
                calculate(); // Recalculate when rate changes
            }
        });
        
        removeBtn.addEventListener('click', () => {
            removeTilgungChange(change.id);
        });
        
        container.appendChild(item);
        slideInRight(item);
    });
}

/**
 * Generates default annual special payments based on the default field
 */
function generateDefaultSpecialPayments() {
    const defaultAmountInput = document.getElementById('default-special-payment');
    const startDateInput = document.getElementById('start-date');
    const durationInput = document.getElementById('duration');
    
    if (!defaultAmountInput || !startDateInput || !durationInput) return;
    
    const defaultAmount = parseFloat(defaultAmountInput.value);
    const startDate = new Date(startDateInput.value);
    const duration = parseInt(durationInput.value);
    
    if (!defaultAmount || defaultAmount <= 0) return;
    
    console.log(`📅 Generating default special payments: ${defaultAmount} EUR annually for ${duration} years`);
    
    // Generate annual special payments
    for (let year = 1; year <= duration; year++) {
        const paymentDate = new Date(startDate);
        paymentDate.setFullYear(startDate.getFullYear() + year);
        
        specialPayments.push({
            id: generateId(),
            date: paymentDate,
            amount: defaultAmount
        });
    }
    
    console.log(`✅ Generated ${specialPayments.length} default special payments`);
    renderSpecialPayments();
}

/**
 * Saves form data to localStorage
 */
function saveFormData() {
    const data = {
        ...getFormData(),
        specialPayments: specialPayments.map(p => ({
            ...p,
            date: p.date.toISOString()
        })),
        tilgungChanges: tilgungChanges.map(c => ({
            ...c,
            date: c.date.toISOString()
        }))
    };
    saveToLocalStorage('loanCalculatorData', data);
}

/**
 * Loads saved data from localStorage
 */
function loadSavedData() {
    const data = loadFromLocalStorage('loanCalculatorData');
    
    if (data) {
        // Restore form values
        if (data.startDate) {
            const startDateInput = document.getElementById('start-date');
            if (startDateInput) {
                startDateInput.value = new Date(data.startDate).toISOString().split('T')[0];
            }
        }
        if (data.principal) document.getElementById('principal').value = data.principal;
        if (data.interestRate) document.getElementById('interest-rate').value = data.interestRate;
        if (data.effectiveRate) document.getElementById('effective-rate').value = data.effectiveRate;
        if (data.tilgung) document.getElementById('tilgung').value = data.tilgung;
        if (data.duration) document.getElementById('duration').value = data.duration;
        
        // Restore repayment changes
        if (data.tilgungChanges) {
            tilgungChanges = data.tilgungChanges.map(c => ({
                ...c,
                date: new Date(c.date)
            }));
            renderTilgungChanges();
        }
        
        // Restore special payments
        if (data.specialPayments) {
            specialPayments = data.specialPayments.map(p => ({
                ...p,
                date: new Date(p.date)
            }));
            renderSpecialPayments();
        }
    }
}

// Initialize when DOM is ready
function startInit() {
    // Check if D3 is loaded
    if (typeof d3 === 'undefined') {
        console.warn('⚠️  D3.js not loaded yet, waiting...');
        setTimeout(startInit, 100);
        return;
    }
    
    console.log('✅ D3.js loaded, version:', d3.version);
    init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startInit);
} else {
    startInit();
}
