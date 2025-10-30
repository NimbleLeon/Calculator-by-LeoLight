class UltraCalculator {
    constructor() {
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = null;
        this.waitingForNewInput = false;
        this.history = [];
        this.soundEnabled = true;
        this.theme = 'dark';
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupCustomCursor();
        this.loadFromLocalStorage();
    }

    initializeElements() {
        this.currentOperationElement = document.getElementById('currentOperation');
        this.previousOperationElement = document.getElementById('previousOperation');
        this.historyList = document.getElementById('historyList');
        this.historyPanel = document.getElementById('historyPanel');
        
        // Создаем простые звуки
        this.createSounds();
    }

    createSounds() {
        // Создаем простые звуки с помощью Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        this.clickSound = this.createBeepSound(800, 0.1);
        this.equalsSound = this.createBeepSound(600, 0.3);
        this.clearSound = this.createBeepSound(400, 0.2);
    }

    createBeepSound(frequency, duration) {
        return () => {
            if (!this.soundEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }

    setupEventListeners() {
        // Кнопки цифр
        document.querySelectorAll('.btn-number').forEach(button => {
            button.addEventListener('click', (e) => {
                this.playSound(this.clickSound);
                this.addButtonPressEffect(e.target);
                this.inputNumber(button.dataset.number);
            });
        });

        // Кнопки операторов
        document.querySelectorAll('.btn-operator').forEach(button => {
            button.addEventListener('click', (e) => {
                this.playSound(this.clickSound);
                this.addButtonPressEffect(e.target);
                this.inputOperator(button.dataset.operator);
            });
        });

        // Функциональные кнопки
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                this.playSound(this.clickSound);
                this.addButtonPressEffect(e.target);
                
                switch(button.dataset.action) {
                    case 'clear':
                        this.clear();
                        break;
                    case 'backspace':
                        this.backspace();
                        break;
                    case 'percentage':
                        this.percentage();
                        break;
                    case 'calculate':
                        this.playSound(this.equalsSound);
                        this.calculate();
                        break;
                }
            });
        });

        // Дополнительные функции
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('historyToggle').addEventListener('click', () => this.toggleHistory());
        document.getElementById('soundToggle').addEventListener('click', () => this.toggleSound());
        document.getElementById('clearHistory').addEventListener('click', () => this.clearHistory());

        // Клавиатура
        document.addEventListener('keydown', (e) => this.handleKeyboardInput(e));
    }

    setupCustomCursor() {
        const cursor = document.querySelector('.custom-cursor');
        const follower = document.querySelector('.cursor-follower');

        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            
            setTimeout(() => {
                follower.style.left = e.clientX + 'px';
                follower.style.top = e.clientY + 'px';
            }, 100);
        });

        // Эффект при наведении на кнопки
        const buttons = document.querySelectorAll('.btn, .feature-btn');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                cursor.style.width = '12px';
                cursor.style.height = '12px';
                follower.style.width = '40px';
                follower.style.height = '40px';
                follower.style.borderColor = getComputedStyle(button).color;
            });

            button.addEventListener('mouseleave', () => {
                cursor.style.width = '6px';
                cursor.style.height = '6px';
                follower.style.width = '30px';
                follower.style.height = '30px';
                follower.style.borderColor = 'var(--primary-glow)';
            });
        });
    }

    addButtonPressEffect(button) {
        button.classList.add('btn-press');
        setTimeout(() => {
            button.classList.remove('btn-press');
        }, 300);

        // Добавляем эффект искр
        const sparkle = button.querySelector('.btn-sparkle');
        if (sparkle) {
            sparkle.style.left = Math.random() * 80 + 10 + '%';
            sparkle.style.top = Math.random() * 80 + 10 + '%';
        }
    }

    playSound(soundFunction) {
        if (this.soundEnabled && soundFunction) {
            soundFunction();
        }
    }

    inputNumber(num) {
        if (this.waitingForNewInput) {
            this.currentInput = num;
            this.waitingForNewInput = false;
        } else {
            this.currentInput = this.currentInput === '0' ? num : this.currentInput + num;
        }
        this.updateDisplay();
    }

    inputOperator(nextOperator) {
        const inputValue = parseFloat(this.currentInput);

        if (this.previousInput === '') {
            this.previousInput = inputValue;
        } else if (this.operator) {
            const currentValue = parseFloat(this.currentInput);
            const result = this.performCalculation(this.previousInput, currentValue, this.operator);
            
            this.currentInput = String(result);
            this.previousInput = result;
        }

        this.waitingForNewInput = true;
        this.operator = nextOperator;
        this.updateDisplay();
    }

    performCalculation(firstOperand, secondOperand, operator) {
        switch (operator) {
            case '+':
                return firstOperand + secondOperand;
            case '-':
                return firstOperand - secondOperand;
            case '×':
                return firstOperand * secondOperand;
            case '÷':
                return firstOperand / secondOperand;
            default:
                return secondOperand;
        }
    }

    calculate() {
        if (!this.operator || this.waitingForNewInput) return;

        const prev = parseFloat(this.previousInput);
        const current = parseFloat(this.currentInput);
        
        if (isNaN(prev) || isNaN(current)) return;

        const result = this.performCalculation(prev, current, this.operator);
        
        // Добавляем в историю
        this.addToHistory(`${prev} ${this.operator} ${current} = ${result}`);
        
        this.currentInput = String(result);
        this.previousInput = '';
        this.operator = null;
        this.waitingForNewInput = true;
        
        this.updateDisplay();
        this.saveToLocalStorage();
    }

    clear() {
        this.playSound(this.clearSound);
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = null;
        this.waitingForNewInput = false;
        this.updateDisplay();
    }

    backspace() {
        if (this.currentInput.length > 1) {
            this.currentInput = this.currentInput.slice(0, -1);
        } else {
            this.currentInput = '0';
        }
        this.updateDisplay();
    }

    percentage() {
        this.currentInput = String(parseFloat(this.currentInput) / 100);
        this.updateDisplay();
    }

    updateDisplay() {
        this.currentOperationElement.textContent = this.currentInput;
        this.previousOperationElement.textContent = 
            this.previousInput && this.operator ? 
            `${this.previousInput} ${this.operator}` : '';
    }

    addToHistory(expression) {
        const [calculation, result] = expression.split(' = ');
        this.history.unshift({ calculation, result });
        
        if (this.history.length > 10) {
            this.history.pop();
        }
        
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        this.historyList.innerHTML = '';
        
        this.history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-expression">${item.calculation}</div>
                <div class="history-result">${item.result}</div>
            `;
            
            historyItem.addEventListener('click', () => {
                this.currentInput = item.result;
                this.updateDisplay();
            });
            
            this.historyList.appendChild(historyItem);
        });
    }

    clearHistory() {
        this.history = [];
        this.updateHistoryDisplay();
        this.saveToLocalStorage();
    }

    toggleHistory() {
        this.historyPanel.classList.toggle('active');
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundBtn = document.getElementById('soundToggle');
        const icon = soundBtn.querySelector('.feature-icon');
        icon.textContent = this.soundEnabled ? '🔊' : '🔇';
        this.saveToLocalStorage();
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.theme);
        this.saveToLocalStorage();
    }

    handleKeyboardInput(e) {
        e.preventDefault();
        
        if (e.key >= '0' && e.key <= '9') {
            this.inputNumber(e.key);
        } else if (e.key === '.') {
            this.inputNumber('.');
        } else if (e.key === '+') {
            this.inputOperator('+');
        } else if (e.key === '-') {
            this.inputOperator('-');
        } else if (e.key === '*') {
            this.inputOperator('×');
        } else if (e.key === '/') {
            this.inputOperator('÷');
        } else if (e.key === 'Enter' || e.key === '=') {
            this.calculate();
        } else if (e.key === 'Escape') {
            this.clear();
        } else if (e.key === 'Backspace') {
            this.backspace();
        } else if (e.key === '%') {
            this.percentage();
        }
    }

    saveToLocalStorage() {
        const data = {
            history: this.history,
            soundEnabled: this.soundEnabled,
            theme: this.theme
        };
        localStorage.setItem('ultraCalculator', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const data = JSON.parse(localStorage.getItem('ultraCalculator'));
        if (data) {
            this.history = data.history || [];
            this.soundEnabled = data.soundEnabled !== undefined ? data.soundEnabled : true;
            this.theme = data.theme || 'dark';
            
            document.documentElement.setAttribute('data-theme', this.theme);
            this.updateHistoryDisplay();
        }
    }
}

// Инициализация калькулятора когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
    new UltraCalculator();
});

// Добавляем CSS для светлой темы
const lightThemeStyles = `
    [data-theme="light"] {
        --primary-glow: #0066cc;
        --secondary-glow: #0099ff;
        --accent-glow: #ff3366;
        --danger-glow: #ff4444;
        --bg-primary: #f0f2f5;
        --bg-secondary: #ffffff;
        --bg-tertiary: #e4e6eb;
        --text-primary: #1a1a1a;
        --text-secondary: #666666;
        --glass-bg: rgba(255, 255, 255, 0.7);
        --glass-border: rgba(0, 0, 0, 0.1);
        --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    [data-theme="light"] .animated-bg {
        background: 
            radial-gradient(circle at 20% 80%, rgba(0, 102, 204, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(0, 153, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255, 51, 102, 0.05) 0%, transparent 50%);
    }

    [data-theme="light"] .grid-lines {
        background-image: 
            linear-gradient(rgba(0, 102, 204, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 102, 204, 0.05) 1px, transparent 1px);
    }
`;

const style = document.createElement('style');
style.textContent = lightThemeStyles;
document.head.appendChild(style);