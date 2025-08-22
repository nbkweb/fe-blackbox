// Black Rock Terminal - Validation Functions

class BlackRockValidation {
    constructor() {
        this.validators = {
            cardNumber: this.validateCardNumber.bind(this),
            expiryDate: this.validateExpiryDate.bind(this),
            cvv: this.validateCVV.bind(this),
            amount: this.validateAmount.bind(this),
            cardholderName: this.validateCardholderName.bind(this),
            email: this.validateEmail.bind(this),
            phone: this.validatePhone.bind(this),
            authCode: this.validateAuthCode.bind(this)
        };
    }

    // Card Number Validation
    validateCardNumber(cardNumber) {
        const cleanNumber = cardNumber.replace(/\s/g, '');
        
        if (!cleanNumber) {
            return { valid: false, message: 'Card number is required' };
        }
        
        if (cleanNumber.length < 13 || cleanNumber.length > 19) {
            return { valid: false, message: 'Card number must be 13-19 digits' };
        }
        
        if (!/^\d+$/.test(cleanNumber)) {
            return { valid: false, message: 'Card number must contain only digits' };
        }
        
        if (!this.luhnCheck(cleanNumber)) {
            return { valid: false, message: 'Invalid card number (failed Luhn check)' };
        }
        
        return { valid: true, message: 'Valid card number', cardType: this.detectCardType(cleanNumber) };
    }

    // Expiry Date Validation
    validateExpiryDate(expiry) {
        if (!expiry) {
            return { valid: false, message: 'Expiry date is required' };
        }
        
        if (!expiry.includes('/') || expiry.length !== 5) {
            return { valid: false, message: 'Expiry date must be in MM/YY format' };
        }
        
        const [month, year] = expiry.split('/');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;
        
        const expiryMonth = parseInt(month);
        const expiryYear = parseInt(year);
        
        if (isNaN(expiryMonth) || isNaN(expiryYear)) {
            return { valid: false, message: 'Invalid expiry date format' };
        }
        
        if (expiryMonth < 1 || expiryMonth > 12) {
            return { valid: false, message: 'Invalid month (must be 01-12)' };
        }
        
        if (expiryYear < currentYear) {
            return { valid: false, message: 'Card has expired' };
        }
        
        if (expiryYear === currentYear && expiryMonth < currentMonth) {
            return { valid: false, message: 'Card has expired' };
        }
        
        return { valid: true, message: 'Valid expiry date' };
    }

    // CVV Validation
    validateCVV(cvv) {
        if (!cvv) {
            return { valid: false, message: 'CVV is required' };
        }
        
        if (!/^\d{3,4}$/.test(cvv)) {
            return { valid: false, message: 'CVV must be 3-4 digits' };
        }
        
        return { valid: true, message: 'Valid CVV' };
    }

    // Amount Validation
    validateAmount(amount) {
        if (!amount) {
            return { valid: false, message: 'Amount is required' };
        }
        
        const numAmount = parseFloat(amount);
        
        if (isNaN(numAmount)) {
            return { valid: false, message: 'Amount must be a valid number' };
        }
        
        if (numAmount <= 0) {
            return { valid: false, message: 'Amount must be greater than zero' };
        }
        
        if (numAmount > 50000) {
            return { valid: false, message: 'Amount cannot exceed $50,000' };
        }
        
        return { valid: true, message: 'Valid amount' };
    }

    // Cardholder Name Validation
    validateCardholderName(name) {
        if (!name) {
            return { valid: false, message: 'Cardholder name is required' };
        }
        
        if (name.length < 2) {
            return { valid: false, message: 'Name must be at least 2 characters' };
        }
        
        if (!/^[A-Z\s]+$/.test(name)) {
            return { valid: false, message: 'Name must contain only letters and spaces' };
        }
        
        return { valid: true, message: 'Valid cardholder name' };
    }

    // Email Validation
    validateEmail(email) {
        if (!email) {
            return { valid: false, message: 'Email is required' };
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { valid: false, message: 'Invalid email format' };
        }
        
        return { valid: true, message: 'Valid email address' };
    }

    // Phone Validation
    validatePhone(phone) {
        if (!phone) {
            return { valid: false, message: 'Phone number is required' };
        }
        
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 15) {
            return { valid: false, message: 'Phone number must be 10-15 digits' };
        }
        
        return { valid: true, message: 'Valid phone number' };
    }

    // Authorization Code Validation
    validateAuthCode(authCode, protocol) {
        if (!authCode) {
            return { valid: false, message: 'Authorization code is required' };
        }
        
        if (!protocol) {
            return { valid: false, message: 'Please select a protocol first' };
        }
        
        const requiredLength = this.getProtocolDigits(protocol);
        if (!requiredLength) {
            return { valid: false, message: 'Invalid protocol selected' };
        }
        
        if (!/^\d+$/.test(authCode)) {
            return { valid: false, message: 'Authorization code must contain only digits' };
        }
        
        if (authCode.length !== requiredLength) {
            return { valid: false, message: `Authorization code must be exactly ${requiredLength} digits` };
        }
        
        return { valid: true, message: `Valid ${requiredLength}-digit authorization code` };
    }

    // Protocol Digits Mapping
    getProtocolDigits(protocol) {
        const protocolMap = {
            "POS Terminal -101.1 (4-digit approval)": 4,
            "POS Terminal -101.4 (6-digit approval)": 6,
            "POS Terminal -101.6 (Pre-authorization)": 6,
            "POS Terminal -101.7 (4-digit approval)": 4,
            "POS Terminal -101.8 (PIN-LESS transaction)": 4,
            "POS Terminal -201.1 (6-digit approval)": 6,
            "POS Terminal -201.3 (6-digit approval)": 6,
            "POS Terminal -201.5 (6-digit approval)": 6
        };
        
        return protocolMap[protocol] || null;
    }

    // Luhn Algorithm Implementation
    luhnCheck(cardNumber) {
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
    detectCardType(cardNumber) {
        const patterns = {
            'VISA': /^4/,
            'VISA_TEST': /^411111/,
            'MASTERCARD': /^(5[1-5]|2[2-7])/,
            'AMERICAN_EXPRESS': /^3[47]/,
            'DISCOVER': /^(6011|65)/,
            'JCB': /^35/,
            'DINERS_CLUB': /^(30|36|38)/
        };
        
        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(cardNumber)) {
                return type.replace('_', ' ');
            }
        }
        
        return 'Unknown';
    }

    // Validate Entire Form
    validateForm(formData) {
        const results = {};
        let isValid = true;
        
        // Validate each field
        Object.keys(formData).forEach(field => {
            if (this.validators[field]) {
                if (field === 'authCode') {
                    results[field] = this.validators[field](formData[field], formData.protocol);
                } else {
                    results[field] = this.validators[field](formData[field]);
                }
                
                if (!results[field].valid) {
                    isValid = false;
                }
            }
        });
        
        return {
            isValid: isValid,
            results: results,
            errors: Object.values(results).filter(r => !r.valid).map(r => r.message)
        };
    }

    // Apply Validation to Input Element
    applyValidation(inputElement, validationResult) {
        const parentElement = inputElement.parentElement;
        let feedbackElement = parentElement.querySelector('.validation-feedback');
        
        // Remove existing validation classes
        inputElement.classList.remove('card-valid', 'card-invalid', 'border-green-500', 'border-red-500');
        
        if (validationResult.valid) {
            inputElement.classList.add('card-valid', 'border-green-500');
            inputElement.style.backgroundColor = '#f0fdf4';
            
            if (feedbackElement) {
                feedbackElement.textContent = validationResult.message;
                feedbackElement.className = 'validation-feedback text-xs text-green-600 font-bold mt-1';
            }
        } else {
            inputElement.classList.add('card-invalid', 'border-red-500');
            inputElement.style.backgroundColor = '#fef2f2';
            
            if (feedbackElement) {
                feedbackElement.textContent = validationResult.message;
                feedbackElement.className = 'validation-feedback text-xs text-red-600 font-bold mt-1';
            }
        }
    }

    // Real-time Validation Setup
    setupRealTimeValidation() {
        // Card Number
        const cardNumberInput = document.getElementById('cardNumber');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('blur', () => {
                const result = this.validateCardNumber(cardNumberInput.value);
                this.applyValidation(cardNumberInput, result);
            });
        }
        
        // Expiry Date
        const expiryInput = document.getElementById('cardExpiry');
        if (expiryInput) {
            expiryInput.addEventListener('blur', () => {
                const result = this.validateExpiryDate(expiryInput.value);
                this.applyValidation(expiryInput, result);
            });
        }
        
        // CVV
        const cvvInput = document.getElementById('cardCvv');
        if (cvvInput) {
            cvvInput.addEventListener('blur', () => {
                const result = this.validateCVV(cvvInput.value);
                this.applyValidation(cvvInput, result);
            });
        }
        
        // Amount
        const amountInput = document.getElementById('amount');
        if (amountInput) {
            amountInput.addEventListener('blur', () => {
                const result = this.validateAmount(amountInput.value);
                this.applyValidation(amountInput, result);
            });
        }
        
        // Cardholder Name
        const nameInput = document.getElementById('cardHolder');
        if (nameInput) {
            nameInput.addEventListener('blur', () => {
                const result = this.validateCardholderName(nameInput.value);
                this.applyValidation(nameInput, result);
            });
        }
        
        // Authorization Code
        const authInput = document.getElementById('authCode');
        const protocolSelect = document.getElementById('protocol');
        if (authInput && protocolSelect) {
            authInput.addEventListener('blur', () => {
                const result = this.validateAuthCode(authInput.value, protocolSelect.value);
                this.applyValidation(authInput, result);
            });
        }
    }
}

// Initialize Validation
const blackRockValidation = new BlackRockValidation();

// Setup validation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    blackRockValidation.setupRealTimeValidation();
});

// Export for global use
window.BlackRockValidation = blackRockValidation;
