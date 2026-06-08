// ===== CalcVoice — Smart Voice Calculator =====

(function () {
    'use strict';

    // ===== State =====
    const state = {
        currentInput: '0',
        previousInput: '',
        operator: null,
        waitingForOperand: false,
        expression: '',
        history: JSON.parse(localStorage.getItem('calcHistory') || '[]'),
        lastAnswer: 0,
        mode: 'standard', // standard | scientific | converter
        isRecording: false,
        recognition: null,
        parenthesesCount: 0,
        sciExpression: '',
    };

    // ===== DOM Elements =====
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const els = {
        expression: $('#expression'),
        result: $('#result'),
        voiceBtn: $('#voiceBtn'),
        voiceIndicator: $('#voiceIndicator'),
        themeToggle: $('#themeToggle'),
        historyToggle: $('#historyToggle'),
        historyPanel: $('#historyPanel'),
        historyList: $('#historyList'),
        clearHistory: $('#clearHistory'),
        toast: $('#toast'),
        standardKeypad: $('#standardKeypad'),
        scientificKeypad: $('#scientificKeypad'),
        converterPanel: $('#converterPanel'),
        fromUnit: $('#fromUnit'),
        toUnit: $('#toUnit'),
        fromValue: $('#fromValue'),
        toValue: $('#toValue'),
        swapUnits: $('#swapUnits'),
    };

    // ===== Theme =====
    function initTheme() {
        const saved = localStorage.getItem('calcTheme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('calcTheme', next);
        showToast(next === 'dark' ? '🌙 다크 모드' : '☀️ 라이트 모드');
    }

    // ===== Toast =====
    let toastTimer;
    function showToast(message) {
        clearTimeout(toastTimer);
        els.toast.textContent = message;
        els.toast.classList.add('visible');
        toastTimer = setTimeout(() => els.toast.classList.remove('visible'), 2200);
    }

    // ===== Display =====
    function updateDisplay() {
        els.expression.textContent = state.expression;
        els.result.textContent = state.currentInput;

        // Dynamic font sizing
        const len = state.currentInput.length;
        els.result.classList.remove('shrink', 'shrink-more');
        if (len > 14) els.result.classList.add('shrink-more');
        else if (len > 10) els.result.classList.add('shrink');
    }

    function animateResult() {
        els.result.classList.remove('pop');
        void els.result.offsetWidth; // trigger reflow
        els.result.classList.add('pop');
    }

    // ===== Calculator Logic =====
    function inputDigit(digit) {
        if (state.waitingForOperand) {
            state.currentInput = digit;
            state.waitingForOperand = false;
        } else {
            state.currentInput = state.currentInput === '0' ? digit : state.currentInput + digit;
        }
        updateDisplay();
    }

    function inputDecimal() {
        if (state.waitingForOperand) {
            state.currentInput = '0.';
            state.waitingForOperand = false;
            updateDisplay();
            return;
        }
        if (!state.currentInput.includes('.')) {
            state.currentInput += '.';
        }
        updateDisplay();
    }

    function toggleSign() {
        if (state.currentInput === '0') return;
        state.currentInput = state.currentInput.startsWith('-')
            ? state.currentInput.slice(1)
            : '-' + state.currentInput;
        updateDisplay();
    }

    function inputPercent() {
        const value = parseFloat(state.currentInput);
        if (isNaN(value)) return;
        state.currentInput = formatNumber(value / 100);
        updateDisplay();
    }

    function handleOperator(op) {
        const inputValue = parseFloat(state.currentInput);
        const opSymbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' };

        if (state.operator && !state.waitingForOperand) {
            const result = calculate(parseFloat(state.previousInput), inputValue, state.operator);
            state.currentInput = formatNumber(result);
            state.expression = `${state.currentInput} ${opSymbols[op]}`;
        } else {
            state.expression = `${state.currentInput} ${opSymbols[op]}`;
        }

        state.previousInput = state.currentInput;
        state.operator = op;
        state.waitingForOperand = true;

        // Highlight active operator
        $$('.key.operator').forEach(k => k.classList.remove('active-op'));
        const activeKey = document.querySelector(`.key.operator[data-action="${op}"]`);
        if (activeKey) activeKey.classList.add('active-op');

        updateDisplay();
    }

    function calculate(a, b, op) {
        switch (op) {
            case 'add': return a + b;
            case 'subtract': return a - b;
            case 'multiply': return a * b;
            case 'divide': return b !== 0 ? a / b : NaN;
            default: return b;
        }
    }

    function handleEquals() {
        if (!state.operator) return;
        const inputValue = parseFloat(state.currentInput);
        const prevValue = parseFloat(state.previousInput);
        const opSymbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' };

        const result = calculate(prevValue, inputValue, state.operator);
        const fullExpr = `${state.previousInput} ${opSymbols[state.operator]} ${state.currentInput}`;

        state.expression = fullExpr + ' =';
        state.currentInput = formatNumber(result);
        state.lastAnswer = result;

        addToHistory(fullExpr, state.currentInput);
        animateResult();

        state.operator = null;
        state.previousInput = '';
        state.waitingForOperand = true;

        $$('.key.operator').forEach(k => k.classList.remove('active-op'));
        updateDisplay();
    }

    function clearAll() {
        state.currentInput = '0';
        state.previousInput = '';
        state.operator = null;
        state.waitingForOperand = false;
        state.expression = '';
        state.parenthesesCount = 0;
        state.sciExpression = '';
        $$('.key.operator').forEach(k => k.classList.remove('active-op'));
        updateDisplay();
    }

    function formatNumber(num) {
        if (isNaN(num)) return 'Error';
        if (!isFinite(num)) return '∞';
        // Avoid floating point display issues
        const str = parseFloat(num.toPrecision(12)).toString();
        return str;
    }

    // ===== Scientific Functions =====
    function handleScientific(action) {
        const value = parseFloat(state.currentInput);

        let result;
        let expr;

        switch (action) {
            case 'sin':
                result = Math.sin(value * Math.PI / 180);
                expr = `sin(${value}°)`;
                break;
            case 'cos':
                result = Math.cos(value * Math.PI / 180);
                expr = `cos(${value}°)`;
                break;
            case 'tan':
                result = Math.tan(value * Math.PI / 180);
                expr = `tan(${value}°)`;
                break;
            case 'log':
                result = Math.log10(value);
                expr = `log(${value})`;
                break;
            case 'ln':
                result = Math.log(value);
                expr = `ln(${value})`;
                break;
            case 'sqrt':
                result = Math.sqrt(value);
                expr = `√(${value})`;
                break;
            case 'square':
                result = value * value;
                expr = `(${value})²`;
                break;
            case 'cube':
                result = value * value * value;
                expr = `(${value})³`;
                break;
            case 'factorial':
                result = factorial(value);
                expr = `${value}!`;
                break;
            case 'abs':
                result = Math.abs(value);
                expr = `|${value}|`;
                break;
            case 'inv':
                result = value !== 0 ? 1 / value : NaN;
                expr = `1/${value}`;
                break;
            case 'pi':
                state.currentInput = Math.PI.toString();
                updateDisplay();
                return;
            case 'e':
                state.currentInput = Math.E.toString();
                updateDisplay();
                return;
            case 'ans':
                state.currentInput = state.lastAnswer.toString();
                updateDisplay();
                return;
            case 'power':
                handleOperator('power');
                state.operator = 'power';
                return;
            case 'exp':
                handleOperator('exp');
                state.operator = 'exp';
                return;
            case 'openParen':
            case 'closeParen':
                // Simple parentheses handling - store in expression
                return;
            case 'backspace':
                if (state.currentInput.length > 1) {
                    state.currentInput = state.currentInput.slice(0, -1);
                } else {
                    state.currentInput = '0';
                }
                updateDisplay();
                return;
            default:
                return;
        }

        state.expression = `${expr} =`;
        state.currentInput = formatNumber(result);
        state.lastAnswer = result;
        addToHistory(expr, state.currentInput);
        animateResult();
        state.waitingForOperand = true;
        updateDisplay();
    }

    function factorial(n) {
        if (n < 0 || !Number.isInteger(n)) return NaN;
        if (n > 170) return Infinity;
        if (n <= 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    }

    // Override calculate for power
    const originalCalculate = calculate;
    function calculateExtended(a, b, op) {
        if (op === 'power') return Math.pow(a, b);
        if (op === 'exp') return a * Math.pow(10, b);
        return originalCalculate(a, b, op);
    }

    // Patch handleEquals to use extended calculate
    const origHandleEquals = handleEquals;

    // ===== Unit Converter =====
    const units = {
        length: {
            units: [
                { value: 'mm', label: '밀리미터 (mm)' },
                { value: 'cm', label: '센티미터 (cm)' },
                { value: 'm', label: '미터 (m)' },
                { value: 'km', label: '킬로미터 (km)' },
                { value: 'in', label: '인치 (in)' },
                { value: 'ft', label: '피트 (ft)' },
                { value: 'yd', label: '야드 (yd)' },
                { value: 'mi', label: '마일 (mi)' },
            ],
            // All relative to meters
            toBase: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 },
        },
        weight: {
            units: [
                { value: 'mg', label: '밀리그램 (mg)' },
                { value: 'g', label: '그램 (g)' },
                { value: 'kg', label: '킬로그램 (kg)' },
                { value: 't', label: '톤 (t)' },
                { value: 'oz', label: '온스 (oz)' },
                { value: 'lb', label: '파운드 (lb)' },
            ],
            toBase: { mg: 0.000001, g: 0.001, kg: 1, t: 1000, oz: 0.0283495, lb: 0.453592 },
        },
        temperature: {
            units: [
                { value: 'C', label: '섭씨 (°C)' },
                { value: 'F', label: '화씨 (°F)' },
                { value: 'K', label: '켈빈 (K)' },
            ],
            convert: (value, from, to) => {
                let celsius;
                if (from === 'C') celsius = value;
                else if (from === 'F') celsius = (value - 32) * 5 / 9;
                else celsius = value - 273.15;

                if (to === 'C') return celsius;
                if (to === 'F') return celsius * 9 / 5 + 32;
                return celsius + 273.15;
            },
        },
        speed: {
            units: [
                { value: 'ms', label: '미터/초 (m/s)' },
                { value: 'kmh', label: '킬로미터/시 (km/h)' },
                { value: 'mph', label: '마일/시 (mph)' },
                { value: 'knot', label: '노트 (knot)' },
            ],
            toBase: { ms: 1, kmh: 0.277778, mph: 0.44704, knot: 0.514444 },
        },
    };

    let currentConvType = 'length';

    function initConverter() {
        populateUnitSelects();
        setupConverterListeners();
    }

    function populateUnitSelects() {
        const unitData = units[currentConvType];
        els.fromUnit.innerHTML = '';
        els.toUnit.innerHTML = '';

        unitData.units.forEach((u, i) => {
            const opt1 = new Option(u.label, u.value);
            const opt2 = new Option(u.label, u.value);
            els.fromUnit.add(opt1);
            els.toUnit.add(opt2);
        });

        // Default second option
        if (unitData.units.length > 1) {
            els.toUnit.selectedIndex = 1;
        }

        els.fromValue.value = '';
        els.toValue.value = '';
    }

    function convertUnit() {
        const value = parseFloat(els.fromValue.value);
        if (isNaN(value)) {
            els.toValue.value = '';
            return;
        }

        const from = els.fromUnit.value;
        const to = els.toUnit.value;
        const unitData = units[currentConvType];

        let result;
        if (unitData.convert) {
            result = unitData.convert(value, from, to);
        } else {
            const baseValue = value * unitData.toBase[from];
            result = baseValue / unitData.toBase[to];
        }

        els.toValue.value = parseFloat(result.toPrecision(10));
    }

    function setupConverterListeners() {
        els.fromValue.addEventListener('input', convertUnit);
        els.fromUnit.addEventListener('change', convertUnit);
        els.toUnit.addEventListener('change', convertUnit);

        els.swapUnits.addEventListener('click', () => {
            const tempUnit = els.fromUnit.value;
            const tempVal = els.fromValue.value;
            els.fromUnit.value = els.toUnit.value;
            els.toUnit.value = tempUnit;
            els.fromValue.value = els.toValue.value;
            convertUnit();
        });

        $$('.converter-type').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.converter-type').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentConvType = btn.dataset.type;
                populateUnitSelects();
            });
        });
    }

    // ===== Mode Switching =====
    function switchMode(mode) {
        state.mode = mode;
        $$('.mode-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.mode-tab[data-mode="${mode}"]`).classList.add('active');

        els.standardKeypad.classList.toggle('hidden', mode !== 'standard');
        els.scientificKeypad.classList.toggle('hidden', mode !== 'scientific');
        els.converterPanel.classList.toggle('hidden', mode !== 'converter');

        // Show/hide voice section and display for converter
        const voiceSection = document.querySelector('.voice-section');
        const displayArea = document.querySelector('.display-area');
        if (mode === 'converter') {
            voiceSection.style.display = 'none';
            displayArea.style.display = 'none';
        } else {
            voiceSection.style.display = '';
            displayArea.style.display = '';
        }
    }

    // ===== History =====
    function addToHistory(expression, result) {
        const item = {
            expression,
            result,
            timestamp: Date.now(),
        };
        state.history.unshift(item);
        if (state.history.length > 50) state.history.pop();
        localStorage.setItem('calcHistory', JSON.stringify(state.history));
        renderHistory();
    }

    function renderHistory() {
        if (state.history.length === 0) {
            els.historyList.innerHTML = `
                <div class="history-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    <p>아직 계산 기록이 없습니다</p>
                </div>`;
            return;
        }

        els.historyList.innerHTML = state.history.map((item, i) => `
            <div class="history-item" data-index="${i}">
                <div class="hist-expr">${item.expression}</div>
                <div class="hist-result">= ${item.result}</div>
                <div class="hist-time">${formatTime(item.timestamp)}</div>
            </div>
        `).join('');

        // Click to reuse
        $$('.history-item').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.dataset.index);
                const item = state.history[idx];
                state.currentInput = item.result;
                state.waitingForOperand = true;
                updateDisplay();
                toggleHistory();
                showToast('📋 값을 불러왔습니다');
            });
        });
    }

    function formatTime(timestamp) {
        const d = new Date(timestamp);
        const now = new Date();
        const diff = now - d;

        if (diff < 60000) return '방금 전';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
        return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    // History panel
    let overlay;
    function toggleHistory() {
        const isOpen = els.historyPanel.classList.toggle('open');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'history-overlay';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', toggleHistory);
        }

        overlay.classList.toggle('visible', isOpen);
    }

    // ===== Voice Recognition =====
    function initVoice() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            els.voiceBtn.addEventListener('click', () => {
                showToast('⚠️ 이 브라우저에서는 음성 인식을 지원하지 않습니다');
            });
            return;
        }

        state.recognition = new SpeechRecognition();
        state.recognition.lang = 'ko-KR';
        state.recognition.continuous = false;
        state.recognition.interimResults = true;

        state.recognition.onstart = () => {
            state.isRecording = true;
            els.voiceBtn.classList.add('recording');
            els.voiceIndicator.classList.add('active');
            els.voiceBtn.querySelector('span').textContent = '듣는 중...';
        };

        state.recognition.onend = () => {
            state.isRecording = false;
            els.voiceBtn.classList.remove('recording');
            els.voiceIndicator.classList.remove('active');
            els.voiceBtn.querySelector('span').textContent = '음성 입력';
        };

        state.recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            if (event.results[event.results.length - 1].isFinal) {
                processVoiceCommand(transcript);
            } else {
                // Show interim result
                els.expression.textContent = `🎙️ "${transcript}"`;
            }
        };

        state.recognition.onerror = (event) => {
            console.error('Voice error:', event.error);
            state.isRecording = false;
            els.voiceBtn.classList.remove('recording');
            els.voiceIndicator.classList.remove('active');
            els.voiceBtn.querySelector('span').textContent = '음성 입력';

            if (event.error === 'no-speech') {
                showToast('🎙️ 음성이 감지되지 않았습니다');
            } else if (event.error === 'not-allowed') {
                showToast('🎙️ 마이크 권한이 필요합니다');
            }
        };

        els.voiceBtn.addEventListener('click', () => {
            if (state.isRecording) {
                state.recognition.stop();
            } else {
                state.recognition.start();
            }
        });
    }

    function processVoiceCommand(text) {
        showToast(`🎙️ "${text}"`);
        const processed = parseVoiceExpression(text);

        if (processed !== null) {
            try {
                const result = evaluateSafeExpression(processed.expression);
                state.expression = `🎙️ ${processed.display} =`;
                state.currentInput = formatNumber(result);
                state.lastAnswer = result;
                addToHistory(`🎙️ ${processed.display}`, state.currentInput);
                animateResult();
                state.waitingForOperand = true;
                updateDisplay();
            } catch (e) {
                state.expression = `🎙️ "${text}"`;
                state.currentInput = 'Error';
                updateDisplay();
                showToast('⚠️ 계산할 수 없는 표현입니다');
            }
        }
    }

    function parseVoiceExpression(text) {
        let expr = text.toLowerCase().trim();
        let display = text;

        // Korean number words to digits
        const koreanNumbers = {
            '영': '0', '공': '0', '일': '1', '이': '2', '삼': '3', '사': '4',
            '오': '5', '육': '6', '칠': '7', '팔': '8', '구': '9', '십': '10',
            '백': '100', '천': '1000', '만': '10000',
        };

        // Replace operator words
        expr = expr
            .replace(/더하기|플러스|을?\s*더해?\s*(줘|봐)?/g, '+')
            .replace(/빼기|마이너스|을?\s*빼\s*(줘|봐)?/g, '-')
            .replace(/곱하기|을?\s*곱해?\s*(줘|봐)?|times/g, '*')
            .replace(/나누기|을?\s*나눠?\s*(줘|봐)?|나누어?\s*(줘|봐)?/g, '/')
            .replace(/의?\s*제곱근|루트|스퀘어\s*루트/g, 'Math.sqrt')
            .replace(/의?\s*제곱/g, '**2')
            .replace(/의?\s*세제곱/g, '**3')
            .replace(/팩토리얼/g, '!')
            .replace(/퍼센트|프로/g, '/100')
            .replace(/는\s*뭐야\??|은\s*뭐야\??|는\s*얼마\??|은\s*얼마\??|계산해\s*(줘)?/g, '')
            .replace(/파이/g, String(Math.PI))
            .replace(/사인/g, 'Math.sin(')
            .replace(/코사인/g, 'Math.cos(')
            .replace(/탄젠트/g, 'Math.tan(');

        // Clean up
        expr = expr.replace(/\s+/g, ' ').trim();

        // Extract numbers and operators
        // Match patterns like "123 + 456" or just a number
        const mathExpr = expr.replace(/[^0-9+\-*/().^도\s]/g, ' ').replace(/\s+/g, ' ').trim();

        // Try to parse as a simple math expression from the cleaned text
        let evalExpr = expr
            .replace(/[가-힣]+/g, '') // Remove remaining Korean
            .replace(/\s+/g, '')
            .trim();

        // If we still have a valid-looking expression
        if (evalExpr && /^[\d+\-*/().%^Math.sqrtsincotan\s]+$/.test(evalExpr)) {
            return { expression: evalExpr, display: text };
        }

        // Try extracting just numbers and basic operators
        const nums = text.match(/[\d.]+/g);
        const ops = text.match(/더하기|플러스|빼기|마이너스|곱하기|나누기/g);

        if (nums && nums.length >= 2 && ops && ops.length >= 1) {
            const opMap = {
                '더하기': '+', '플러스': '+',
                '빼기': '-', '마이너스': '-',
                '곱하기': '*',
                '나누기': '/',
            };
            let built = nums[0];
            for (let i = 0; i < ops.length && i + 1 < nums.length; i++) {
                built += opMap[ops[i]] + nums[i + 1];
            }
            return { expression: built, display: text };
        }

        // Check for sqrt patterns: "25의 제곱근" or "루트 25"
        const sqrtMatch = text.match(/([\d.]+)\s*의?\s*(제곱근|루트)/);
        const sqrtMatch2 = text.match(/(루트|제곱근)\s*([\d.]+)/);
        if (sqrtMatch) {
            return { expression: `Math.sqrt(${sqrtMatch[1]})`, display: `√${sqrtMatch[1]}` };
        }
        if (sqrtMatch2) {
            return { expression: `Math.sqrt(${sqrtMatch2[2]})`, display: `√${sqrtMatch2[2]}` };
        }

        // Check for square: "5의 제곱"
        const sqMatch = text.match(/([\d.]+)\s*의?\s*제곱/);
        if (sqMatch) {
            return { expression: `Math.pow(${sqMatch[1]},2)`, display: `${sqMatch[1]}²` };
        }

        // Single number
        if (nums && nums.length === 1 && !ops) {
            return { expression: nums[0], display: nums[0] };
        }

        showToast('⚠️ 인식할 수 없는 명령입니다');
        return null;
    }

    function evaluateSafeExpression(expr) {
        // Sanitize: allow only safe math characters
        const sanitized = expr
            .replace(/\^/g, '**')
            .replace(/[^0-9+\-*/().%Mathsqrtsincoepow,\s]/g, '');

        // Use Function constructor for safe eval
        const fn = new Function(`"use strict"; return (${sanitized})`);
        const result = fn();

        if (typeof result !== 'number') throw new Error('Not a number');
        return result;
    }

    // ===== Key Handler =====
    function handleKeyAction(action) {
        // Numbers
        if (/^[0-9]$/.test(action)) {
            inputDigit(action);
            return;
        }

        switch (action) {
            case 'decimal':
                inputDecimal();
                break;
            case 'clear':
                clearAll();
                break;
            case 'sign':
                toggleSign();
                break;
            case 'percent':
                inputPercent();
                break;
            case 'add':
            case 'subtract':
            case 'multiply':
            case 'divide':
                handleOperator(action);
                break;
            case 'equals':
                // Use extended calculate
                if (state.operator === 'power' || state.operator === 'exp') {
                    const inputValue = parseFloat(state.currentInput);
                    const prevValue = parseFloat(state.previousInput);
                    const opSymbols = { power: '^', exp: 'E' };
                    const result = calculateExtended(prevValue, inputValue, state.operator);
                    const fullExpr = `${state.previousInput} ${opSymbols[state.operator]} ${state.currentInput}`;
                    state.expression = fullExpr + ' =';
                    state.currentInput = formatNumber(result);
                    state.lastAnswer = result;
                    addToHistory(fullExpr, state.currentInput);
                    animateResult();
                    state.operator = null;
                    state.previousInput = '';
                    state.waitingForOperand = true;
                    $$('.key.operator').forEach(k => k.classList.remove('active-op'));
                    updateDisplay();
                } else {
                    handleEquals();
                }
                break;
            // Scientific
            case 'sin': case 'cos': case 'tan':
            case 'log': case 'ln': case 'sqrt':
            case 'square': case 'cube': case 'power':
            case 'factorial': case 'pi': case 'e':
            case 'abs': case 'inv': case 'exp':
            case 'ans': case 'backspace':
            case 'openParen': case 'closeParen':
                handleScientific(action);
                break;
        }
    }

    // ===== Keyboard Support =====
    function handleKeyboard(e) {
        if (state.mode === 'converter') return;

        const key = e.key;

        if (/^[0-9]$/.test(key)) {
            e.preventDefault();
            handleKeyAction(key);
        } else if (key === '.') {
            e.preventDefault();
            handleKeyAction('decimal');
        } else if (key === '+') {
            e.preventDefault();
            handleKeyAction('add');
        } else if (key === '-') {
            e.preventDefault();
            handleKeyAction('subtract');
        } else if (key === '*') {
            e.preventDefault();
            handleKeyAction('multiply');
        } else if (key === '/') {
            e.preventDefault();
            handleKeyAction('divide');
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            handleKeyAction('equals');
        } else if (key === 'Escape' || key === 'c' || key === 'C') {
            e.preventDefault();
            handleKeyAction('clear');
        } else if (key === 'Backspace') {
            e.preventDefault();
            handleKeyAction('backspace');
        } else if (key === '%') {
            e.preventDefault();
            handleKeyAction('percent');
        }
    }

    // ===== Event Listeners =====
    function bindEvents() {
        // Key buttons
        $$('.key').forEach(key => {
            key.addEventListener('click', () => {
                handleKeyAction(key.dataset.action);
            });
        });

        // Mode tabs
        $$('.mode-tab').forEach(tab => {
            tab.addEventListener('click', () => switchMode(tab.dataset.mode));
        });

        // Theme
        els.themeToggle.addEventListener('click', toggleTheme);

        // History
        els.historyToggle.addEventListener('click', toggleHistory);
        els.clearHistory.addEventListener('click', () => {
            state.history = [];
            localStorage.removeItem('calcHistory');
            renderHistory();
            showToast('🗑️ 히스토리가 삭제되었습니다');
        });

        // Keyboard
        document.addEventListener('keydown', handleKeyboard);
    }

    // ===== Init =====
    function init() {
        initTheme();
        initConverter();
        initVoice();
        bindEvents();
        renderHistory();
        updateDisplay();
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
