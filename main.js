/**
 * CodeAlpha Language Translation Tool - Frontend Application Script
 * Author: CodeAlpha AI Internship Submission
 */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. DOM Element Selectors
    // ----------------------------------------------------------------------
    const sourceLangSelect = document.getElementById('sourceLangSelect');
    const targetLangSelect = document.getElementById('targetLangSelect');
    const swapLangBtn = document.getElementById('swapLangBtn');
    
    const sourceText = document.getElementById('sourceText');
    const targetText = document.getElementById('targetText');
    const clearSourceBtn = document.getElementById('clearSourceBtn');
    const pasteBtn = document.getElementById('pasteBtn');
    
    const charCounter = document.getElementById('charCounter');
    const charProgressFill = document.getElementById('charProgressFill');
    const detectedBadge = document.getElementById('detectedBadge');
    const detectedLangName = document.getElementById('detectedLangName');
    
    const translateBtn = document.getElementById('translateBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const copyBtn = document.getElementById('copyBtn');
    const speakBtn = document.getElementById('speakBtn');
    const voiceSelect = document.getElementById('voiceSelect');
    
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const historyToggleBtn = document.getElementById('historyToggleBtn');
    const historyOverlay = document.getElementById('historyOverlay');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const toastContainer = document.getElementById('toastContainer');
    const apiStatusBadge = document.getElementById('apiStatusBadge');

    const MAX_CHARS = 5000;
    let supportedLanguagesDict = {};
    let currentVoices = [];
    let isTranslating = false;

    // ----------------------------------------------------------------------
    // 2. Initial Setup & Event Listeners Initialization
    // ----------------------------------------------------------------------
    initTheme();
    fetchLanguages();
    initSpeechSynthesis();
    setupEventListeners();

    // ----------------------------------------------------------------------
    // 3. API & Language Loading Functions
    // ----------------------------------------------------------------------
    async function fetchLanguages() {
        try {
            const response = await fetch('/api/languages');
            const data = await response.json();
            
            if (data.success && data.languages) {
                supportedLanguagesDict = data.languages;
                populateLanguageDropdowns(data.languages);
                updateApiStatus(true);
            } else {
                throw new Error('Invalid language list payload');
            }
        } catch (error) {
            console.error('Failed to load supported languages:', error);
            updateApiStatus(false);
            showToast('Unable to connect to language API server.', 'error');
        }
    }

    function populateLanguageDropdowns(languages) {
        // Clear existing dynamic options (keep Auto-detect in source)
        sourceLangSelect.innerHTML = '<option value="auto" selected>✨ Auto-detect</option>';
        targetLangSelect.innerHTML = '';

        // Sort language names alphabetically
        const sortedNames = Object.keys(languages).sort();

        sortedNames.forEach(name => {
            const code = languages[name];

            // Source option
            const srcOption = document.createElement('option');
            srcOption.value = code;
            srcOption.textContent = name;
            sourceLangSelect.appendChild(srcOption);

            // Target option
            const tgtOption = document.createElement('option');
            tgtOption.value = code;
            tgtOption.textContent = name;
            targetLangSelect.appendChild(tgtOption);
        });

        // Default Target Language: Spanish ('es') or English ('en')
        if (languages['Spanish']) {
            targetLangSelect.value = languages['Spanish'];
        } else if (languages['English']) {
            targetLangSelect.value = languages['English'];
        }
    }

    function updateApiStatus(isOnline) {
        if (!apiStatusBadge) return;
        const dot = apiStatusBadge.querySelector('.status-dot');
        const text = apiStatusBadge.querySelector('.status-text');
        
        if (isOnline) {
            dot.className = 'status-dot green';
            text.textContent = 'API Online';
        } else {
            dot.className = 'status-dot red';
            text.textContent = 'Offline';
        }
    }

    // ----------------------------------------------------------------------
    // 4. Translation Core Logic
    // ----------------------------------------------------------------------
    async function handleTranslation() {
        if (isTranslating) return;

        const text = sourceText.value.trim();
        const sourceLang = sourceLangSelect.value;
        const targetLang = targetLangSelect.value;

        // Input Validation
        if (!text) {
            showToast('Please enter text to translate.', 'info');
            sourceText.focus();
            return;
        }

        if (text.length > MAX_CHARS) {
            showToast(`Text exceeds maximum character limit of ${MAX_CHARS}.`, 'error');
            return;
        }

        // Show Loading UI State
        setLoadingState(true);

        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    source_lang: sourceLang,
                    target_lang: targetLang
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                targetText.value = data.translated_text;

                // Handle Auto-detection badge UI
                if (sourceLang === 'auto' && data.detected_lang_name) {
                    detectedLangName.textContent = data.detected_lang_name;
                    detectedBadge.classList.remove('hidden');
                } else {
                    detectedBadge.classList.add('hidden');
                }

                // Enable Action Buttons
                copyBtn.disabled = false;
                speakBtn.disabled = false;

                // Save to Translation History
                saveToHistory({
                    sourceText: text,
                    targetText: data.translated_text,
                    sourceLangName: sourceLang === 'auto' ? `Auto (${data.detected_lang_name})` : getLangNameByCode(sourceLang),
                    targetLangName: data.target_lang_name || getLangNameByCode(targetLang),
                    timestamp: new Date().toISOString()
                });
            } else {
                showToast(data.error || 'Translation failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Translation Error:', error);
            showToast('Network error while connecting to translation server.', 'error');
        } finally {
            setLoadingState(false);
        }
    }

    function setLoadingState(loading) {
        isTranslating = loading;
        if (loading) {
            loadingOverlay.classList.remove('hidden');
            translateBtn.disabled = true;
            translateBtn.style.opacity = '0.7';
        } else {
            loadingOverlay.classList.add('hidden');
            translateBtn.disabled = false;
            translateBtn.style.opacity = '1';
        }
    }

    // ----------------------------------------------------------------------
    // 5. Usability & Interactivity Helpers
    // ----------------------------------------------------------------------
    function setupEventListeners() {
        // Character Counter & Live UI Updates
        sourceText.addEventListener('input', updateCharCounter);

        // Clear Source Text Button
        clearSourceBtn.addEventListener('click', () => {
            sourceText.value = '';
            targetText.value = '';
            updateCharCounter();
            detectedBadge.classList.add('hidden');
            copyBtn.disabled = true;
            speakBtn.disabled = true;
            sourceText.focus();
        });

        // Paste from Clipboard
        pasteBtn.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                if (text) {
                    sourceText.value = text;
                    updateCharCounter();
                    showToast('Pasted text from clipboard', 'info');
                }
            } catch (err) {
                showToast('Clipboard read access denied.', 'error');
            }
        });

        // Translate Button Click & Keyboard Shortcuts
        translateBtn.addEventListener('click', handleTranslation);
        
        sourceText.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleTranslation();
            }
        });

        // Swap Languages Button
        swapLangBtn.addEventListener('click', handleLanguageSwap);

        // Copy Target Text to Clipboard
        copyBtn.addEventListener('click', () => {
            if (!targetText.value) return;
            navigator.clipboard.writeText(targetText.value);
            showToast('Translation copied to clipboard!', 'success');
        });

        // Speak Text to Speech
        speakBtn.addEventListener('click', handleTextToSpeech);

        // Theme Toggle
        themeToggleBtn.addEventListener('click', toggleTheme);

        // History Drawer Toggle
        historyToggleBtn.addEventListener('click', openHistory);
        closeHistoryBtn.addEventListener('click', closeHistory);
        historyOverlay.addEventListener('click', (e) => {
            if (e.target === historyOverlay) closeHistory();
        });
        clearHistoryBtn.addEventListener('click', clearHistory);
    }

    function updateCharCounter() {
        const length = sourceText.value.length;
        charCounter.textContent = `${length} / ${MAX_CHARS}`;
        
        const percentage = Math.min(100, (length / MAX_CHARS) * 100);
        charProgressFill.style.width = `${percentage}%`;

        // Color shifts based on character threshold
        charProgressFill.className = 'progress-bar-fill';
        if (percentage >= 90) {
            charProgressFill.classList.add('danger');
        } else if (percentage >= 75) {
            charProgressFill.classList.add('warning');
        }

        // Toggle clear button
        if (length > 0) {
            clearSourceBtn.classList.remove('hidden');
        } else {
            clearSourceBtn.classList.add('hidden');
        }
    }

    function handleLanguageSwap() {
        const srcVal = sourceLangSelect.value;
        const tgtVal = targetLangSelect.value;

        if (srcVal === 'auto') {
            showToast('Select a explicit source language before swapping.', 'info');
            return;
        }

        // Swap language selections
        sourceLangSelect.value = tgtVal;
        targetLangSelect.value = srcVal;

        // Swap text contents if target text is available
        const srcTextVal = sourceText.value;
        const tgtTextVal = targetText.value;

        if (tgtTextVal) {
            sourceText.value = tgtTextVal;
            targetText.value = srcTextVal;
            updateCharCounter();
        }

        showToast('Languages swapped!', 'info');
    }

    // ----------------------------------------------------------------------
    // 6. Web Speech API (Text-to-Speech) Integration
    // ----------------------------------------------------------------------
    function initSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = () => {
                currentVoices = window.speechSynthesis.getVoices();
            };
        }
    }

    function handleTextToSpeech() {
        if (!('speechSynthesis' in window)) {
            showToast('Text-to-Speech is not supported in this browser.', 'error');
            return;
        }

        const text = targetText.value.trim();
        if (!text) return;

        // If currently speaking, stop
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            speakBtn.querySelector('span').textContent = 'Listen';
            speakBtn.querySelector('i').className = 'fa-solid fa-volume-high';
            return;
        }

        const targetLangCode = targetLangSelect.value;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = targetLangCode;

        // Find voice matching language code
        if (currentVoices.length > 0) {
            const matchingVoice = currentVoices.find(v => v.lang.startsWith(targetLangCode));
            if (matchingVoice) utterance.voice = matchingVoice;
        }

        utterance.onstart = () => {
            speakBtn.querySelector('span').textContent = 'Stop';
            speakBtn.querySelector('i').className = 'fa-solid fa-square-stop';
        };

        utterance.onend = utterance.onerror = () => {
            speakBtn.querySelector('span').textContent = 'Listen';
            speakBtn.querySelector('i').className = 'fa-solid fa-volume-high';
        };

        window.speechSynthesis.speak(utterance);
    }

    // ----------------------------------------------------------------------
    // 7. Theme Preference Management (Light vs Dark)
    // ----------------------------------------------------------------------
    function initTheme() {
        const savedTheme = localStorage.getItem('codealpha_translator_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('codealpha_translator_theme', newTheme);
        updateThemeIcon(newTheme);
        showToast(`Switched to ${newTheme} theme`, 'info');
    }

    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeIcon.className = 'fa-solid fa-sun';
        } else {
            themeIcon.className = 'fa-solid fa-moon';
        }
    }

    // ----------------------------------------------------------------------
    // 8. Translation History (LocalStorage Management)
    // ----------------------------------------------------------------------
    function getHistory() {
        try {
            return JSON.parse(localStorage.getItem('codealpha_trans_history')) || [];
        } catch {
            return [];
        }
    }

    function saveToHistory(item) {
        let history = getHistory();
        // Remove duplicates of exact same source text
        history = history.filter(h => h.sourceText !== item.sourceText);
        history.unshift(item); // Add to beginning
        if (history.length > 20) history.pop(); // Keep max 20 entries
        localStorage.setItem('codealpha_trans_history', JSON.stringify(history));
    }

    function openHistory() {
        renderHistoryList();
        historyOverlay.classList.remove('hidden');
    }

    function closeHistory() {
        historyOverlay.classList.add('hidden');
    }

    function renderHistoryList() {
        const history = getHistory();
        historyList.innerHTML = '';

        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <i class="fa-solid fa-inbox"></i>
                    <p>No recent translations yet.</p>
                </div>`;
            return;
        }

        history.forEach(item => {
            const card = document.createElement('div');
            card.className = 'history-item';
            card.innerHTML = `
                <div class="history-item-langs">${escapeHtml(item.sourceLangName)} &rarr; ${escapeHtml(item.targetLangName)}</div>
                <div class="history-item-src">${escapeHtml(item.sourceText)}</div>
                <div class="history-item-tgt">${escapeHtml(item.targetText)}</div>
            `;
            card.addEventListener('click', () => {
                sourceText.value = item.sourceText;
                targetText.value = item.targetText;
                updateCharCounter();
                copyBtn.disabled = false;
                speakBtn.disabled = false;
                closeHistory();
                showToast('Loaded translation from history', 'info');
            });
            historyList.appendChild(card);
        });
    }

    function clearHistory() {
        localStorage.removeItem('codealpha_trans_history');
        renderHistoryList();
        showToast('History cleared', 'info');
    }

    // ----------------------------------------------------------------------
    // 9. Toast Notification System
    // ----------------------------------------------------------------------
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let iconClass = 'fa-solid fa-circle-info';
        if (type === 'success') iconClass = 'fa-solid fa-circle-check';
        if (type === 'error') iconClass = 'fa-solid fa-triangle-exclamation';

        toast.innerHTML = `<i class="${iconClass}"></i> <span>${escapeHtml(message)}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Utility Helpers
    function getLangNameByCode(code) {
        for (const [name, c] of Object.entries(supportedLanguagesDict)) {
            if (c === code) return name;
        }
        return code.toUpperCase();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
