// Pomodoro Timer
// Debug logging - opt in with ?debug in the URL so tracing is always available
// without shipping a console message every second to everyone else.
const DEBUG = new URLSearchParams(window.location.search).has('debug');
const log = (...args) => {
    if (DEBUG) console.log('[Pomodoro]', ...args);
};

class PomodoroTimer {
    constructor() {
        log('Initializing PomodoroTimer');

        // Timer modes (in minutes)
        this.modes = {
            work: 25,
            short: 5,
            long: 15
        };

        // State
        this.currentMode = 'work';
        this.timeRemaining = this.modes[this.currentMode] * 60; // in seconds
        this.isRunning = false;
        this.intervalId = null;
        this.sessionCount = 0;
        this.originalTitle = document.title;
        // Wall-clock deadline the countdown is measured against. Set on start,
        // cleared on pause. See startTimer() for why this exists.
        this.endTime = null;
        this.hasRequestedNotifications = false;

        // DOM elements
        this.timerDisplay = document.getElementById('timerDisplay');
        this.startPauseBtn = document.getElementById('startPauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.sessionCountDisplay = document.getElementById('sessionCount');
        this.modeButtons = document.querySelectorAll('.mode-btn');

        log('DOM elements:', {
            timerDisplay: this.timerDisplay,
            startPauseBtn: this.startPauseBtn,
            resetBtn: this.resetBtn,
            sessionCountDisplay: this.sessionCountDisplay,
            modeButtons: this.modeButtons.length
        });

        // Initialize
        this.init();
    }

    init() {
        log('Running init()');

        // Load saved state
        this.loadState();

        // Set up event listeners
        this.startPauseBtn?.addEventListener('click', () => this.toggleTimer());
        this.resetBtn?.addEventListener('click', () => this.resetTimer());

        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                log('Mode button clicked:', mode);
                this.switchMode(mode);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                log('Space key pressed');
                this.toggleTimer();
            }
            if (e.code === 'KeyR' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                log('R key pressed');
                this.resetTimer();
            }
        });

        // Update display
        this.updateDisplay();

        log('Initialization complete');
    }

    loadState() {
        log('Loading state from localStorage');

        try {
            const savedState = localStorage.getItem('pomodoroState');
            if (savedState) {
                const state = JSON.parse(savedState);
                log('Loaded state:', state);

                // Check if saved state is from today
                const today = new Date().toDateString();
                if (state.date === today) {
                    this.sessionCount = state.sessionCount || 0;
                    log('Restored session count:', this.sessionCount);
                } else {
                    log('Saved state is from different day, resetting session count');
                    this.sessionCount = 0;
                }
            }
        } catch (error) {
            log('Error loading state:', error);
        }
    }

    saveState() {
        log('Saving state to localStorage');

        try {
            const state = {
                sessionCount: this.sessionCount,
                date: new Date().toDateString()
            };
            localStorage.setItem('pomodoroState', JSON.stringify(state));
            log('State saved:', state);
        } catch (error) {
            log('Error saving state:', error);
        }
    }

    switchMode(mode) {
        log('Switching to mode:', mode);

        if (this.isRunning) {
            log('Timer is running, stopping it first');
            this.toggleTimer();
        }

        this.currentMode = mode;
        this.timeRemaining = this.modes[mode] * 60;
        this.endTime = null;

        // Update UI
        this.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        this.updateDisplay();
    }

    toggleTimer() {
        log('Toggling timer, current state:', this.isRunning);

        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        log('Starting timer');

        // Asking for notification permission needs a user gesture - browsers
        // ignore or auto-block prompts fired on page load.
        this.requestNotificationPermission();

        this.isRunning = true;
        if (this.startPauseBtn) this.startPauseBtn.textContent = 'pause';

        /*
         * Count down against a wall-clock deadline rather than by decrementing
         * once per interval. Browsers throttle timers in background tabs
         * (often to once a minute), so a counter-based timer runs long by
         * exactly the amount of time you spent in another tab - which for a
         * "lock in" timer is most of the session.
         */
        this.endTime = Date.now() + this.timeRemaining * 1000;

        this.intervalId = setInterval(() => {
            this.timeRemaining = Math.max(0, Math.round((this.endTime - Date.now()) / 1000));

            if (this.timeRemaining <= 0) {
                log('Timer completed!');
                this.timerComplete();
                return;
            }

            this.updateDisplay();
        }, 250);

        log('Timer started, deadline:', new Date(this.endTime).toISOString());
    }

    pauseTimer() {
        log('Pausing timer');

        // Freeze the remaining time against the deadline before dropping it,
        // so resuming picks up exactly where the clock actually is.
        if (this.isRunning && this.endTime) {
            this.timeRemaining = Math.max(0, Math.round((this.endTime - Date.now()) / 1000));
        }
        this.endTime = null;

        this.isRunning = false;
        if (this.startPauseBtn) this.startPauseBtn.textContent = 'start';

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            log('Interval cleared');
        }

        // Reset document title when paused
        document.title = this.originalTitle;
    }

    resetTimer() {
        log('Resetting timer');

        this.pauseTimer();
        this.timeRemaining = this.modes[this.currentMode] * 60;
        this.updateDisplay();
        document.title = this.originalTitle;
    }

    timerComplete() {
        log('Timer complete, mode:', this.currentMode);

        this.pauseTimer();

        // Increment session count if work session completed
        if (this.currentMode === 'work') {
            this.sessionCount++;
            this.sessionCountDisplay.textContent = this.sessionCount;
            this.saveState();
            log('Session completed, total:', this.sessionCount);
        }

        // Play notification sound
        this.playNotificationSound();

        // Show browser notification
        this.showNotification();

        // Auto-switch to break or work
        if (this.currentMode === 'work') {
            // After work, go to short break (or long break after 4 pomodoros)
            const nextMode = this.sessionCount % 4 === 0 ? 'long' : 'short';
            log('Auto-switching to break mode:', nextMode);
            this.switchMode(nextMode);
        } else {
            // After break, go back to work
            log('Auto-switching back to work');
            this.switchMode('work');
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (this.timerDisplay) {
            this.timerDisplay.textContent = timeString;
        }

        if (this.sessionCountDisplay) {
            this.sessionCountDisplay.textContent = this.sessionCount;
        }

        // Update document title when running
        if (this.isRunning) {
            document.title = `${timeString} - ${this.currentMode} - ${this.originalTitle}`;
        }
    }

    async requestNotificationPermission() {
        // Only ever ask once per page load, and only from a click.
        if (this.hasRequestedNotifications) return;
        this.hasRequestedNotifications = true;

        if (!('Notification' in window)) {
            log('Notifications unsupported in this browser');
            return;
        }

        if (Notification.permission !== 'default') {
            log('Notification permission already set:', Notification.permission);
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            log('Notification permission:', permission);
        } catch (error) {
            log('Error requesting notification permission:', error);
        }
    }

    showNotification() {
        log('Attempting to show notification');

        if ('Notification' in window && Notification.permission === 'granted') {
            const title = this.currentMode === 'work'
                ? 'Work session complete!'
                : 'Break time over!';
            const body = this.currentMode === 'work'
                ? 'Great job! Time for a break.'
                : 'Break\'s over. Ready to lock in?';

            const notification = new Notification(title, {
                body: body,
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                tag: 'pomodoro-timer',
                requireInteraction: false
            });

            log('Notification created:', title);

            // Close notification after 5 seconds
            setTimeout(() => notification.close(), 5000);
        } else {
            log('Notifications not available or not granted');
        }
    }

    playNotificationSound() {
        log('Playing notification sound');

        try {
            // Create a simple beep using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800; // Frequency in Hz
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);

            log('Sound played');
        } catch (error) {
            log('Error playing sound:', error);
        }
    }
}

// Initialize timer when page loads
document.addEventListener('DOMContentLoaded', () => {
    log('DOM loaded, initializing timer');

    // Only initialize on the pomodoro page
    if (document.querySelector('.pomodoro-section')) {
        log('Pomodoro section found, creating timer');
        const timer = new PomodoroTimer();

        // Make timer accessible globally for debugging
        window.pomodoroTimer = timer;
        log('Timer instance stored in window.pomodoroTimer');
    } else {
        log('Not on pomodoro page, skipping initialization');
    }
});

log('pomodoro.js loaded');
