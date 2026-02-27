// PassGen - Secure Password Generator

// Character sets
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS = 'l1IO0';

// Word list for passphrases
const WORDS = [
    'apple', 'banana', 'cherry', 'dragon', 'eagle', 'forest', 'garden', 'harbor',
    'island', 'jungle', 'kingdom', 'lemon', 'mountain', 'nature', 'ocean', 'planet',
    'quantum', 'river', 'sunset', 'thunder', 'umbrella', 'valley', 'winter', 'xylophone',
    'yellow', 'zebra', 'anchor', 'breeze', 'castle', 'diamond', 'echo', 'falcon',
    'guitar', 'horizon', 'ivory', 'jasmine', 'kite', 'lantern', 'marble', 'nectar',
    'olive', 'pearl', 'quartz', 'rainbow', 'silver', 'tiger', 'unity', 'velvet',
    'willow', 'xenon', 'yacht', 'zenith', 'amber', 'blaze', 'coral', 'dusk'
];

// State
let history = [];

// DOM Elements
const passwordOutput = document.getElementById('password-output');
const lengthSlider = document.getElementById('length');
const lengthValue = document.getElementById('length-value');
const strengthFill = document.getElementById('strength-fill');
const strengthText = document.getElementById('strength-text');
const historyList = document.getElementById('history-list');
const bulkOutput = document.getElementById('bulk-output');

// Presets
const presets = {
    pin: { length: 4, uppercase: false, lowercase: false, numbers: true, symbols: false },
    simple: { length: 12, uppercase: true, lowercase: true, numbers: true, symbols: false },
    strong: { length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true },
    ultra: { length: 24, uppercase: true, lowercase: true, numbers: true, symbols: true },
    passphrase: { type: 'passphrase', words: 4 }
};

// Initialize
function init() {
    loadHistory();
    setupEventListeners();
    generatePassword();
}

function setupEventListeners() {
    // Length slider
    lengthSlider.addEventListener('input', (e) => {
        lengthValue.textContent = e.target.value;
    });

    // Generate button
    document.getElementById('generate-btn').addEventListener('click', generatePassword);

    // Copy button
    document.getElementById('copy-btn').addEventListener('click', copyPassword);

    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', generatePassword);

    // Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
    });

    // Bulk generate
    document.getElementById('bulk-generate').addEventListener('click', bulkGenerate);

    // Clear history
    document.getElementById('clear-history').addEventListener('click', clearHistory);

    // Auto-generate on option change
    ['uppercase', 'lowercase', 'numbers', 'symbols', 'exclude-ambiguous', 'exclude-chars'].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('change', generatePassword);
        if (el.tagName === 'INPUT' && el.type === 'text') {
            el.addEventListener('input', generatePassword);
        }
    });

    lengthSlider.addEventListener('change', generatePassword);
}

function getOptions() {
    return {
        length: parseInt(lengthSlider.value),
        uppercase: document.getElementById('uppercase').checked,
        lowercase: document.getElementById('lowercase').checked,
        numbers: document.getElementById('numbers').checked,
        symbols: document.getElementById('symbols').checked,
        excludeAmbiguous: document.getElementById('exclude-ambiguous').checked,
        excludeChars: document.getElementById('exclude-chars').value
    };
}

function generatePassword() {
    const options = getOptions();
    
    // Build character set
    let charset = '';
    if (options.uppercase) charset += UPPERCASE;
    if (options.lowercase) charset += LOWERCASE;
    if (options.numbers) charset += NUMBERS;
    if (options.symbols) charset += SYMBOLS;
    
    // Remove excluded characters
    if (options.excludeAmbiguous) {
        charset = charset.split('').filter(c => !AMBIGUOUS.includes(c)).join('');
    }
    if (options.excludeChars) {
        charset = charset.split('').filter(c => !options.excludeChars.includes(c)).join('');
    }
    
    if (!charset) {
        passwordOutput.value = 'Select at least one character type';
        return;
    }
    
    // Generate password using crypto
    const password = generateSecure(charset, options.length);
    
    passwordOutput.value = password;
    updateStrength(password);
    addToHistory(password);
}

function generateSecure(charset, length) {
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset[array[i] % charset.length];
    }
    
    return password;
}

function generatePassphrase(wordCount = 4) {
    const array = new Uint32Array(wordCount);
    crypto.getRandomValues(array);
    
    const words = [];
    for (let i = 0; i < wordCount; i++) {
        const word = WORDS[array[i] % WORDS.length];
        // Capitalize first letter
        words.push(word.charAt(0).toUpperCase() + word.slice(1));
    }
    
    // Add a random number
    const numArray = new Uint32Array(1);
    crypto.getRandomValues(numArray);
    const num = (numArray[0] % 900) + 100;
    
    return words.join('-') + '-' + num;
}

function applyPreset(presetName) {
    const preset = presets[presetName];
    if (!preset) return;
    
    if (preset.type === 'passphrase') {
        const passphrase = generatePassphrase(preset.words);
        passwordOutput.value = passphrase;
        updateStrength(passphrase);
        addToHistory(passphrase);
        return;
    }
    
    // Apply preset options
    lengthSlider.value = preset.length;
    lengthValue.textContent = preset.length;
    document.getElementById('uppercase').checked = preset.uppercase;
    document.getElementById('lowercase').checked = preset.lowercase;
    document.getElementById('numbers').checked = preset.numbers;
    document.getElementById('symbols').checked = preset.symbols;
    
    generatePassword();
}

function updateStrength(password) {
    const score = calculateStrength(password);
    
    strengthFill.className = 'strength-fill';
    
    if (score < 30) {
        strengthFill.classList.add('weak');
        strengthText.textContent = 'Weak';
    } else if (score < 50) {
        strengthFill.classList.add('fair');
        strengthText.textContent = 'Fair';
    } else if (score < 70) {
        strengthFill.classList.add('good');
        strengthText.textContent = 'Good';
    } else {
        strengthFill.classList.add('strong');
        strengthText.textContent = 'Strong';
    }
}

function calculateStrength(password) {
    let score = 0;
    
    // Length
    score += Math.min(password.length * 4, 40);
    
    // Character variety
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;
    
    // Bonus for mixing
    const types = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(r => r.test(password)).length;
    score += types * 5;
    
    return Math.min(score, 100);
}

function copyPassword() {
    const password = passwordOutput.value;
    navigator.clipboard.writeText(password).then(() => {
        const btn = document.getElementById('copy-btn');
        btn.textContent = '✅';
        setTimeout(() => btn.textContent = '📋', 2000);
    });
}

function bulkGenerate() {
    const count = parseInt(document.getElementById('bulk-count').value) || 5;
    const options = getOptions();
    
    let charset = '';
    if (options.uppercase) charset += UPPERCASE;
    if (options.lowercase) charset += LOWERCASE;
    if (options.numbers) charset += NUMBERS;
    if (options.symbols) charset += SYMBOLS;
    
    if (options.excludeAmbiguous) {
        charset = charset.split('').filter(c => !AMBIGUOUS.includes(c)).join('');
    }
    if (options.excludeChars) {
        charset = charset.split('').filter(c => !options.excludeChars.includes(c)).join('');
    }
    
    if (!charset) {
        bulkOutput.innerHTML = '<p class="empty-state">Select at least one character type</p>';
        return;
    }
    
    const passwords = [];
    for (let i = 0; i < count; i++) {
        passwords.push(generateSecure(charset, options.length));
    }
    
    bulkOutput.innerHTML = passwords.map((p, i) => `
        <div class="bulk-item">
            <span>${p}</span>
            <button onclick="copyText('${p}', this)">Copy</button>
        </div>
    `).join('');
}

function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        btn.textContent = '✓';
        setTimeout(() => btn.textContent = 'Copy', 2000);
    });
}
window.copyText = copyText;

// History
function addToHistory(password) {
    // Don't add duplicates or placeholder
    if (password.includes('Select') || history.includes(password)) return;
    
    history.unshift(password);
    if (history.length > 10) history.pop();
    
    saveHistory();
    renderHistory();
}

function renderHistory() {
    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-state">Generated passwords will appear here</p>';
        return;
    }
    
    historyList.innerHTML = history.map(p => `
        <div class="history-item">
            <span class="password">${p}</span>
            <button class="copy-btn" onclick="copyText('${p}', this)">Copy</button>
        </div>
    `).join('');
}

function clearHistory() {
    history = [];
    saveHistory();
    renderHistory();
}

function saveHistory() {
    localStorage.setItem('passgen-history', JSON.stringify(history));
}

function loadHistory() {
    const saved = localStorage.getItem('passgen-history');
    if (saved) {
        history = JSON.parse(saved);
        renderHistory();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
