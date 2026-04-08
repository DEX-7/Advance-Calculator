class ScientificCalculator {
    constructor() {
        this.expression = '';
        this.result = '0';
        this.shouldResetOnNextInput = false;
        this.isRadianMode = false; // Defaulting to DEG based on toggle visuals
        this.initializeUI();
        this.attachEventListeners();
    }

    initializeUI() {
        const buttons = document.getElementById('buttons');
        const buttonLayout = [
            ['sin', 'cos', 'tan', 'C', '⌫'],
            ['log', 'ln', '(', ')', '√'],
            ['7', '8', '9', '÷', '^'],
            ['4', '5', '6', '×', '!'],
            ['1', '2', '3', '-', 'π'],
            ['0', '.', 'e', '+', '=']
        ];

        buttonLayout.forEach(row => {
            row.forEach(btn => {
                const button = document.createElement('button');
                button.textContent = btn;
                button.className = this.getButtonClass(btn);
                button.dataset.value = btn;
                buttons.appendChild(button);
            });
        });
    }

    getButtonClass(btn) {
        if (['sin', 'cos', 'tan', 'log', 'ln', '√', '!', 'π', 'e'].includes(btn)) return 'function';
        if (['÷', '×', '-', '+', '^'].includes(btn)) return 'operator';
        if (btn === '=') return 'equals';
        if (btn === 'C') return 'clear';
        return '';
    }

    attachEventListeners() {
        document.getElementById('buttons').addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                this.handleButtonClick(e.target.dataset.value);
            }
        });

        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e.key);
        });

        const toggle = document.getElementById('degRadToggle');
        toggle.addEventListener('change', (e) => {
            this.isRadianMode = e.target.checked;
            this.updateModeLabels();
        });
        this.updateModeLabels();
    }

    handleButtonClick(value) {
        if (this.shouldResetOnNextInput && !['C', '⌫', '=', '+', '-', '×', '÷', '^'].includes(value)) {
            this.expression = '';
            this.shouldResetOnNextInput = false;
        }

        switch(value) {
            case 'C': this.clear(); break;
            case '⌫': this.backspace(); break;
            case '=': this.calculate(); break;
            case 'sin':
            case 'cos':
            case 'tan':
            case 'log':
            case 'ln':
            case '√':
            case '!':
            case 'π':
            case 'e':
                this.insertFunction(value);
                break;
            case '×': this.handleOperator('*'); break;
            case '÷': this.handleOperator('/'); break;
            case '^': this.handleOperator('^'); break;
            case '+': this.handleOperator('+'); break;
            case '-': this.handleOperator('-'); break;
            default: this.appendToExpression(value);
        }
    }

    handleKeyboard(key) {
        const keyMap = {
            'Enter': '=', 'Escape': 'C', 'Backspace': '⌫',
            '*': '×', '/': '÷', 'p': 'π', 'e': 'e'
        };
        const mappedKey = keyMap[key] || key;
        const validKeys = '0123456789.+-*/^()';
        if (validKeys.includes(mappedKey) || Object.values(keyMap).includes(mappedKey)) {
            this.handleButtonClick(mappedKey);
        }
    }

    appendToExpression(value) {
        this.expression += value;
        this.updateDisplay();
    }

    handleOperator(op) {
        if (this.expression === '' && op === '-') {
            this.expression = '-';
        } else {
            this.expression = this.expression.replace(/[\+\-\*\^\/]+$/, '') + op;
        }
        this.updateDisplay();
    }

    insertFunction(func) {
        const functions = {
            'sin': 'sin(', 'cos': 'cos(', 'tan': 'tan(',
            'log': 'log(', 'ln': 'ln(', '√': 'sqrt(',
            '!': '!', 'π': 'pi', 'e': 'e'
        };
        this.expression += functions[func];
        this.updateDisplay();
    }

    clear() {
        this.expression = '';
        this.result = '0';
        this.updateDisplay();
    }

    backspace() {
        this.expression = this.expression.slice(0, -1);
        this.updateDisplay();
    }

    calculate() {
        try {
            let expr = this.autoFixExpression(this.expression);
            
            // 1. Replace constants
            expr = expr.replace(/pi/g, `(${Math.PI})`).replace(/e/g, `(${Math.E})`);
            
            // 2. Handle Trig Functions specifically
            expr = this.processTrigFunctions(expr);
            
            // 3. Replace other math functions
            expr = expr.replace(/log\(/g, 'Math.log10(')
                       .replace(/ln\(/g, 'Math.log(')
                       .replace(/sqrt\(/g, 'Math.sqrt(')
                       .replace(/\^/g, '**');
            
            // 4. Factorial (simple regex for integers)
            expr = expr.replace(/(\d+)!/g, (match, n) => this.factorial(parseInt(n)));
            
            // Evaluate
            const finalResult = new Function(`return ${expr}`)();
            
            if (isNaN(finalResult) || !isFinite(finalResult)) {
                throw new Error('Invalid');
            }

            this.result = this.formatResult(finalResult);
            this.shouldResetOnNextInput = true;
            this.updateDisplay();
        } catch (error) {
            console.error(error);
            this.result = 'Error';
            this.shouldResetOnNextInput = true;
            this.updateDisplay();
        }
    }

    autoFixExpression(expr) {
        // Auto-close parentheses
        const openCount = (expr.match(/\(/g) || []).length;
        const closeCount = (expr.match(/\)/g) || []).length;
        expr += ')'.repeat(Math.max(0, openCount - closeCount));
        
        // Implicit multiplication (e.g., 5(2) -> 5*(2) or 5pi -> 5*pi)
        expr = expr.replace(/(\d)(?=[a-z\(])/g, '$1*');
        expr = expr.replace(/(\))(?=[\d\w\(])/g, '$1*');
        
        return expr;
    }

    processTrigFunctions(expr) {
        const trigFuncs = ['sin', 'cos', 'tan'];
        trigFuncs.forEach(func => {
            // Updated Regex: no double backslashes needed for the parenthesis literal
            const regex = new RegExp(`${func}\\(`, 'g');
            expr = expr.replace(regex, () => {
                return this.isRadianMode ? `Math.${func}(` : `Math.${func}((Math.PI/180)*`;
            });
        });
        return expr;
    }

    updateModeLabels() {
        const labels = document.querySelectorAll('.mode-label');
        if(labels.length >= 2) {
            labels[0].classList.toggle('active', !this.isRadianMode);
            labels[1].classList.toggle('active', this.isRadianMode);
        }
    }

    factorial(n) {
        if (n < 0) return NaN;
        if (n === 0) return 1;
        let res = 1;
        for (let i = 1; i <= n; i++) res *= i;
        return res;
    }

    formatResult(result) {
        const rounded = parseFloat(result.toFixed(10));
        if (Math.abs(rounded) < 1e-10 && rounded !== 0) return result.toExponential(4);
        return rounded.toString();
    }

    updateDisplay() {
        const pretty = this.expression
            .replace(/\*/g, '×')
            .replace(/\//g, '÷')
            .replace(/sqrt\(/g, '√(')
            .replace(/pi/g, 'π');
        document.getElementById('expression').textContent = pretty || '';
        document.getElementById('result').textContent = this.result;
    }
}

new ScientificCalculator();