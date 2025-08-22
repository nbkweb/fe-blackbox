// Black Rock Terminal - Main JavaScript Functions

// Global Variables
let isFormValid = false;
let currentTransaction = null;
let authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

// Utility Functions
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Card Number Formatting
function formatCardNumber(value) {
    // Remove all non-digits
    let cleanValue = value.replace(/\D/g, '');
    
    // Limit to 16 digits
    if (cleanValue.length > 16) {
        cleanValue = cleanValue.substring(0, 16);
    }
    
    // Add spaces every 4 digits: 4242 4242 4242 4242
    return cleanValue.replace(/(\d{4})(?=\d)/g, '$1 ');
}

// Expiry Date Formatting
function formatExpiryDate(value) {
    // Remove all non-digits
    let cleanValue = value.replace(/\D/g, '');
    
    // Limit to 4 digits
    if (cleanValue.length > 4) {
        cleanValue = cleanValue.substring(0, 4);
    }
    
    // Add slash: MM/YY
    if (cleanValue.length >= 2) {
        return cleanValue.substring(0, 2) + '/' + cleanValue.substring(2);
    }
    
    return cleanValue;
}

// Card Validation (Luhn Algorithm)
function luhnCheck(cardNumber) {
    let sum = 0;
    let shouldDouble = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i]);
        
        if (shouldDouble) {
            if ((digit *= 2) > 9) digit -= 9;
        }
        
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    
    return (sum % 10) === 0;
}

// Card Type Detection
function detectCardType(cardNumber) {
    if (cardNumber.startsWith('4')) return 'VISA';
    if (cardNumber.startsWith('411111')) return 'VISA TEST';
    if (cardNumber.startsWith('5') || cardNumber.startsWith('2')) return 'MASTERCARD';
    if (cardNumber.startsWith('34') || cardNumber.startsWith('37')) return 'AMERICAN EXPRESS';
    if (cardNumber.startsWith('6011') || cardNumber.startsWith('65')) return 'DISCOVER';
    if (cardNumber.startsWith('35')) return 'JCB';
    return 'Unknown';
}

// Email Validation
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Phone Number Validation
function isValidPhone(phone) {
    return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/\s/g, ''));
}

// Show Notification
function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-md ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        type === 'warning' ? 'bg-yellow-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-start">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 
                type === 'warning' ? 'fa-exclamation-triangle' :
                'fa-info-circle'
            } mr-3 mt-1 text-xl"></i>
            <div class="flex-1">
                <p class="font-bold mb-1">${
                    type === 'success' ? 'Success!' : 
                    type === 'error' ? 'Error!' : 
                    type === 'warning' ? 'Warning!' :
                    'Information'
                }</p>
                <p class="text-sm">${message}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-xl opacity-75 hover:opacity-100">
                &times;
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
    }
}

// Processing Step Animation
function updateProcessingStep(stepId, status) {
    const stepElement = document.getElementById(`step-${stepId}`);
    if (!stepElement) return;
    
    const dot = stepElement.querySelector('.w-4, .w-3, .w-2');
    const text = stepElement.querySelector('span');
    
    if (!dot || !text) return;
    
    // Remove existing classes
    dot.className = dot.className.replace(/bg-\w+-\d+/g, '').replace(/animate-\w+/g, '');
    text.className = text.className.replace(/text-\w+-\d+/g, '').replace(/font-\w+/g, '');
    
    switch (status) {
        case 'processing':
            dot.className += ' bg-blue-500 animate-pulse';
            text.className += ' text-blue-600 font-bold';
            break;
        case 'completed':
            dot.className += ' bg-green-500';
            text.className += ' text-green-600 font-bold';
            break;
        case 'failed':
            dot.className += ' bg-red-500';
            text.className += ' text-red-600 font-bold';
            break;
        default: // pending
            dot.className += ' bg-gray-300';
            text.className += ' text-gray-600';
            break;
    }
}

// Number to Words Conversion
function numberToWords(amount) {
    if (amount === 0) return 'Zero dollars';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    function convertHundreds(num) {
        let result = '';
        
        if (num > 99) {
            result += ones[Math.floor(num / 100)] + ' Hundred ';
            num %= 100;
        }
        
        if (num > 19) {
            result += tens[Math.floor(num / 10)] + ' ';
            num %= 10;
        } else if (num > 9) {
            result += teens[num - 10] + ' ';
            num = 0;
        }
        
        if (num > 0) {
            result += ones[num] + ' ';
        }
        
        return result;
    }
    
    const integerPart = Math.floor(amount);
    const cents = Math.round((amount - integerPart) * 100);
    
    let result = convertHundreds(integerPart);
    result += integerPart === 1 ? 'Dollar' : 'Dollars';
    
    if (cents > 0) {
        result += ' and ' + convertHundreds(cents);
        result += cents === 1 ? 'Cent' : 'Cents';
    }
    
    return result.trim();
}

// Local Storage Helpers
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function getFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

// Session Management
function setAuthToken(token) {
    authToken = token;
    localStorage.setItem('auth_token', token);
    sessionStorage.setItem('auth_token', token);
}

function clearAuthToken() {
    authToken = null;
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
}

function getAuthToken() {
    return authToken || localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

// API Helper Functions
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`/api/proxy/${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API call failed for ${endpoint}:`, error);
        throw error;
    }
}

// Form Validation Helpers
function validateCardNumber(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    return cleanNumber.length >= 13 && cleanNumber.length <= 19 && luhnCheck(cleanNumber);
}

function validateExpiryDate(expiry) {
    if (!expiry || !expiry.includes('/') || expiry.length !== 5) return false;
    
    const [month, year] = expiry.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expiryMonth = parseInt(month);
    const expiryYear = parseInt(year);
    
    if (expiryMonth < 1 || expiryMonth > 12) return false;
    if (expiryYear < currentYear) return false;
    if (expiryYear === currentYear && expiryMonth < currentMonth) return false;
    
    return true;
}

function validateCVV(cvv) {
    return cvv && cvv.length >= 3 && cvv.length <= 4 && /^\d+$/.test(cvv);
}

function validateAmount(amount) {
    const numAmount = parseFloat(amount);
    return numAmount && numAmount > 0 && numAmount <= 50000;
}

function validateCardholderName(name) {
    return name && name.length >= 2 && /^[A-Z\s]+$/.test(name);
}

// Clear Form Data
function clearFormData() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="password"], input[type="email"], input[type="tel"], select, textarea');
    inputs.forEach(input => {
        if (!input.readOnly && !input.disabled) {
            input.value = '';
            input.classList.remove('card-valid', 'card-invalid', 'border-green-500', 'border-red-500');
        }
    });
}

// Copy to Clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
            showNotification('Copied to clipboard!', 'success', 2000);
        }, function() {
            showNotification('Failed to copy to clipboard', 'error');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showNotification('Copied to clipboard!', 'success', 2000);
        } catch (err) {
            showNotification('Failed to copy to clipboard', 'error');
        }
        document.body.removeChild(textArea);
    }
}

// Generate Transaction ID
function generateTransactionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BRT${timestamp}${random}`;
}

// Format Transaction ID for Display
function formatTransactionId(txId) {
    if (txId.length > 16) {
        return txId.substring(0, 8) + '...' + txId.slice(-6);
    }
    return txId;
}

// Logout Function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        clearAuthToken();
        window.location.href = '/logout';
    }
}

// Error Handler
function handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    showNotification(`An error occurred${context ? ' in ' + context : ''}. Please try again.`, 'error');
}

// Initialize Common Functions
document.addEventListener('DOMContentLoaded', function() {
    // Set auth token in headers for AJAX requests
    const token = getAuthToken();
    if (token) {
        // Add default headers for fetch requests
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            if (url.startsWith('/api/')) {
                options.headers = options.headers || {};
                options.headers['Authorization'] = `Bearer ${token}`;
            }
            return originalFetch(url, options);
        };
    }
    
    // Auto-logout on token expiration
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = payload.exp * 1000;
            const currentTime = Date.now();
            
            if (expirationTime <= currentTime) {
                clearAuthToken();
                window.location.href = '/login';
            } else {
                // Set timeout for auto-logout
                const timeUntilExpiration = expirationTime - currentTime;
                setTimeout(() => {
                    alert('Your session has expired. Please login again.');
                    clearAuthToken();
                    window.location.href = '/login';
                }, timeUntilExpiration);
            }
        } catch (error) {
            console.error('Error parsing token:', error);
        }
    }
});

// Security: Clear sensitive data on page unload
window.addEventListener('beforeunload', function() {
    // Clear sensitive form fields
    const sensitiveFields = document.querySelectorAll('input[type="password"], #cardNumber, #cardCvv, #authCode');
    sensitiveFields.forEach(field => {
        if (field) field.value = '';
    });
});

// Prevent right-click on sensitive fields
document.addEventListener('DOMContentLoaded', function() {
    const sensitiveFields = document.querySelectorAll('#cardNumber, #cardCvv, #authCode');
    sensitiveFields.forEach(field => {
        if (field) {
            field.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                showNotification('Right-click disabled for security', 'warning', 2000);
            });
        }
    });
});

// Export functions for use in other scripts
window.BlackRockTerminal = {
    formatCardNumber,
    formatExpiryDate,
    luhnCheck,
    detectCardType,
    isValidEmail,
    isValidPhone,
    showNotification,
    updateProcessingStep,
    numberToWords,
    formatCurrency,
    formatDate,
    formatTime,
    copyToClipboard,
    generateTransactionId,
    formatTransactionId,
    validateCardNumber,
    validateExpiryDate,
    validateCVV,
    validateAmount,
    validateCardholderName,
    clearFormData,
    apiCall,
    handleError,
    delay
};
