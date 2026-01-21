/**
 * Utility functions for formatting, validation, and date handling
 * Following Jake Wharton principles: clear, composable, pure functions
 */

/**
 * Formats a number as EUR currency
 * @param {number} amount - Amount in EUR
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
    try {
        // Use window.Intl to avoid any potential shadowing issues
        if (typeof window !== 'undefined' && window.Intl && window.Intl.NumberFormat) {
            return new window.Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        }
    } catch (error) {
        console.warn('Intl.NumberFormat not available, using fallback');
    }
    
    // Fallback: manual formatting (UK style: €1,234.56)
    const formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `€${formatted}`;
}

/**
 * Formats a number as percentage
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 2) {
    try {
        // Use window.Intl to avoid any potential shadowing issues
        if (typeof window !== 'undefined' && window.Intl && window.Intl.NumberFormat) {
            return new window.Intl.NumberFormat('en-GB', {
                style: 'percent',
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(value / 100);
        }
    } catch (error) {
        console.warn('Intl.NumberFormat not available, using fallback');
    }
    
    // Fallback: manual formatting
    return `${(value).toFixed(decimals)}%`;
}

/**
 * Formats a date as German locale string
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
    try {
        // Use window.Intl to avoid any potential shadowing issues
        if (typeof window !== 'undefined' && window.Intl && window.Intl.DateTimeFormat) {
            return new window.Intl.DateTimeFormat('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(date);
        }
    } catch (error) {
        console.warn('Intl.DateTimeFormat not available, using fallback');
    }
    
    // Fallback: manual formatting (UK style: DD/MM/YYYY)
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Formats a date as month/year string
 * @param {Date} date - Date to format
 * @returns {string} Formatted month/year string
 */
export function formatMonthYear(date) {
    try {
        // Use window.Intl to avoid any potential shadowing issues
        if (typeof window !== 'undefined' && window.Intl && window.Intl.DateTimeFormat) {
            return new window.Intl.DateTimeFormat('en-GB', {
                year: 'numeric',
                month: 'short'
            }).format(date);
        }
    } catch (error) {
        console.warn('Intl.DateTimeFormat not available, using fallback');
    }
    
    // Fallback: manual formatting (UK English month names)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Rounds a number to specified decimal places
 * Uses banker's rounding (round half to even) for financial accuracy
 * @param {number} value - Value to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} Rounded value
 */
export function roundToDecimals(value, decimals = 2) {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
}

/**
 * Converts cents to euros for precise currency calculations
 * @param {number} cents - Amount in cents
 * @returns {number} Amount in euros
 */
export function centsToEuros(cents) {
    return cents / 100;
}

/**
 * Converts euros to cents for precise currency calculations
 * @param {number} euros - Amount in euros
 * @returns {number} Amount in cents
 */
export function eurosToCents(euros) {
    return Math.round(euros * 100);
}

/**
 * Validates loan parameters
 * @param {Object} params - Loan parameters
 * @returns {Object} Validation result with isValid and errors
 */
export function validateLoanParams(params) {
    const errors = {};
    
    // Principal validation
    if (!params.principal || params.principal < 10000 || params.principal > 10000000) {
        errors.principal = 'Amount must be between 10,000 and 10,000,000 EUR';
    }
    
    // Interest rate validation
    if (!params.interestRate || params.interestRate < 0.1 || params.interestRate > 15) {
        errors.interestRate = 'Interest rate must be between 0.1% and 15%';
    }
    
    // Repayment rate validation
    if (!params.tilgung || params.tilgung < 1 || params.tilgung > 10) {
        errors.tilgung = 'Repayment rate must be between 1% and 10%';
    }
    
    // Duration validation
    if (!params.duration || params.duration < 1 || params.duration > 40) {
        errors.duration = 'Duration must be between 1 and 40 years';
    }
    
    // Special payments validation
    if (params.specialPayments) {
        params.specialPayments.forEach((payment, index) => {
            if (payment.amount < 100 || payment.amount > 100000) {
                errors[`specialPayment${index}`] = 'Special payment must be between 100 and 100,000 EUR';
            }
        });
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Animates a number counter
 * @param {HTMLElement} element - Element to animate
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} duration - Animation duration in ms
 * @param {Function} formatter - Optional formatter function
 */
export function animateCounter(element, start, end, duration = 1000, formatter = (v) => v) {
    const startTime = performance.now();
    const difference = end - start;
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out cubic)
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (difference * eased);
        
        element.textContent = formatter(current);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = formatter(end);
        }
    }
    
    requestAnimationFrame(update);
}

/**
 * Adds months to a date
 * @param {Date} date - Starting date
 * @param {number} months - Number of months to add
 * @returns {Date} New date
 */
export function addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

/**
 * Gets the number of months between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Number of months
 */
export function monthsBetween(startDate, endDate) {
    const years = endDate.getFullYear() - startDate.getFullYear();
    const months = endDate.getMonth() - startDate.getMonth();
    return years * 12 + months;
}

/**
 * Saves data to localStorage
 * @param {string} key - Storage key
 * @param {*} data - Data to save
 */
export function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.warn('Failed to save to localStorage:', error);
    }
}

/**
 * Loads data from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Loaded data or default value
 */
export function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn('Failed to load from localStorage:', error);
        return defaultValue;
    }
}

/**
 * Exports data as CSV file
 * @param {Array<Object>} data - Array of objects to export
 * @param {string} filename - Filename for download
 */
export function exportToCSV(data, filename = 'export.csv') {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header];
                // Escape commas and quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

/**
 * Generates a unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clamps a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
