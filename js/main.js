/**
 * ============================================================
 * Vibe Boilerplate — main.js
 * ============================================================
 * Vanilla JavaScript. No frameworks. No build step.
 *
 * All logic is wrapped in an init() function called after
 * DOMContentLoaded. This ensures the DOM is ready before any
 * element references are made.
 *
 * ORGANISATION:
 *   1.  Utility helpers
 *   2.  Initialisation entry point
 *   3.  Pomodoro timer
 *   4.  Service worker registration
 *
 * HOW TO EXTEND:
 *   - Add new feature functions below initPomodoroTimer()
 *   - Call them inside init()
 *   - Keep each feature isolated in its own function block
 * ============================================================
 */


/* ============================================================
   1. UTILITY HELPERS
   Small, reusable functions used throughout the file.
   ============================================================ */

/**
 * Shorthand for document.querySelector.
 * Returns the first matching element, or null if not found.
 *
 * @param {string} selector - CSS selector string
 * @param {Element|Document} [context=document] - Optional root to search within
 * @returns {Element|null}
 */
const qs = (selector, context = document) => context.querySelector(selector);

/**
 * Shorthand for document.querySelectorAll.
 * Returns a NodeList. Use Array.from() if you need array methods.
 *
 * @param {string} selector - CSS selector string
 * @param {Element|Document} [context=document] - Optional root to search within
 * @returns {NodeList}
 */
const qsa = (selector, context = document) => context.querySelectorAll(selector);

/**
 * Add an event listener and return a cleanup function.
 * Useful for components that may be torn down and re-initialised.
 *
 * @param {EventTarget} target  - Element or window/document
 * @param {string}      event   - Event name, e.g. 'click'
 * @param {Function}    handler - Callback function
 * @param {object}      [opts]  - addEventListener options
 * @returns {Function}          - Call to remove the listener
 */
const on = (target, event, handler, opts) => {
  target.addEventListener(event, handler, opts);
  return () => target.removeEventListener(event, handler, opts);
};

/**
 * Trap focus inside a given container element.
 * Used for modals, dropdowns, and other overlay components.
 * Call the returned cleanup function when the trap is no longer needed.
 *
 * @param {Element} container - The element to trap focus within
 * @returns {Function}        - Cleanup function to remove the trap
 */
function trapFocus(container) {
  const focusable = Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), ' +
      'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );

  if (focusable.length === 0) return () => {};

  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  function handleKeydown(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      // Shift+Tab: going backwards
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab: going forwards
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  container.addEventListener('keydown', handleKeydown);
  return () => container.removeEventListener('keydown', handleKeydown);
}

/**
 * Debounce: delay invoking fn until after wait ms have elapsed
 * since the last invocation. Useful for scroll/resize handlers.
 *
 * @param {Function} fn   - Function to debounce
 * @param {number}   wait - Milliseconds to delay
 * @returns {Function}
 */
function debounce(fn, wait = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}


/* ============================================================
   3. POMODORO TIMER
   Circular-progress Pomodoro timer with focus/break cycle flow,
   session stats persisted to localStorage, motivational messages,
   and a cycle-count stepper. All DOM updates go through render().
   ============================================================ */

/**
 * Initialise the Pomodoro timer section.
 * Guard clause exits cleanly if the section is absent from the page.
 */
function initPomodoroTimer() {
  const section = qs('#pomodoro');
  if (!section) return;

  // --- DOM references ---
  const phaseEl       = qs('#pomo-phase',         section);
  const cycleEl       = qs('#pomo-cycle',          section);
  const timeEl        = qs('#pomo-time',           section);
  const ringEl        = qs('#pomo-ring-progress',  section);
  const playBtn       = qs('#pomo-play',           section);
  const playLabel     = qs('.pomo-play-label',     section);
  const resetBtn      = qs('#pomo-reset',          section);
  const skipBtn       = qs('#pomo-skip',           section);
  const upNextEl      = qs('#pomo-up-next',        section);
  const messageEl     = qs('#pomo-message',        section);
  const cyclesValEl   = qs('#pomo-cycles-val',     section);
  const cyclesDownBtn = qs('#pomo-cycles-down',    section);
  const cyclesUpBtn   = qs('#pomo-cycles-up',      section);
  const statSessions  = qs('#pomo-stat-sessions',  section);
  const statToday     = qs('#pomo-stat-today',     section);
  const statMonth     = qs('#pomo-stat-month',     section);

  // --- Config ---
  const WORK_DURATION  = 25 * 60; // 1500 seconds
  const BREAK_DURATION = 5  * 60; //  300 seconds
  // SVG circle r=45 → circumference = 2π×45 ≈ 282.74
  const CIRCUMFERENCE  = 2 * Math.PI * 45;

  const MESSAGES = [
    'Stay focused. One step at a time.',
    'Deep work is your superpower.',
    'You\'re building momentum.',
    'Silence is productive.',
    'Small efforts compound greatly.',
    'Be present. Be purposeful.',
    'Progress over perfection.',
    'This moment is enough.',
    'Focused energy moves mountains.',
    'Rest is part of the work.',
  ];

  // --- State ---
  // Owned entirely by this function; no globals needed.
  let state = {
    isRunning:        false,
    isWorkPhase:      true,
    currentTime:      WORK_DURATION,
    duration:         WORK_DURATION,
    currentCycle:     1,
    totalCycles:      4,
    timerId:          null,
    lastMessageIndex: -1,
  };

  // --- localStorage helpers ---
  function saveStats(stats) {
    try { localStorage.setItem('pomo-stats', JSON.stringify(stats)); } catch (_) {}
  }

  function loadStats() {
    try {
      const raw = localStorage.getItem('pomo-stats');
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  /**
   * Return today's stats object, resetting daily/monthly counters
   * automatically when the calendar date or month has changed.
   */
  function getStats() {
    const now      = new Date();
    const dateKey  = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const monthKey = now.toISOString().slice(0, 7);  // YYYY-MM
    const saved    = loadStats();

    if (!saved) {
      return { date: dateKey, month: monthKey, sessionsToday: 0, minutesToday: 0, minutesMonth: 0 };
    }
    if (saved.date !== dateKey) {
      // New day — reset daily totals; preserve monthly if same month
      return {
        date:          dateKey,
        month:         monthKey,
        sessionsToday: 0,
        minutesToday:  0,
        minutesMonth:  saved.month === monthKey ? saved.minutesMonth : 0,
      };
    }
    return saved;
  }

  /** Record a completed focus session and persist immediately. */
  function recordCompletedSession() {
    const stats = getStats();
    const mins  = Math.round(WORK_DURATION / 60);
    stats.sessionsToday  += 1;
    stats.minutesToday   += mins;
    stats.minutesMonth   += mins;
    saveStats(stats);
    renderStats();
  }

  // --- Formatting ---
  function formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  // --- Rendering ---
  function renderStats() {
    const stats = getStats();
    statSessions.textContent = stats.sessionsToday;
    statToday.textContent    = stats.minutesToday + 'm';
    statMonth.textContent    = stats.minutesMonth + 'm';
  }

  function renderRing() {
    // offset=0 → full circle (start); offset=CIRCUMFERENCE → empty (done)
    const offset = CIRCUMFERENCE * (1 - state.currentTime / state.duration);
    ringEl.style.strokeDashoffset = offset;
  }

  function renderUpNext() {
    if (state.isWorkPhase) {
      upNextEl.textContent = state.currentCycle < state.totalCycles
        ? `Up next: Break ${formatTime(BREAK_DURATION)}`
        : 'Last cycle — finish strong!';
    } else {
      upNextEl.textContent = `Up next: Focus ${formatTime(WORK_DURATION)}`;
    }
  }

  /** Full render pass — keeps all DOM in sync with state. */
  function render() {
    const timeStr = formatTime(state.currentTime);

    timeEl.textContent = timeStr;
    // Aria label updated every render so screen readers get the value on demand
    timeEl.setAttribute('aria-label', `Time remaining: ${timeStr}`);

    phaseEl.textContent = state.isWorkPhase ? 'Focus' : 'Break';
    cycleEl.textContent = `Cycle ${state.currentCycle} of ${state.totalCycles}`;

    renderRing();
    renderUpNext();
    renderStats();

    // Reflect running state on the play button
    playBtn.setAttribute('aria-pressed', String(state.isRunning));
    playBtn.setAttribute('aria-label', state.isRunning ? 'Pause timer' : 'Start timer');
    playLabel.textContent = state.isRunning ? 'Pause' : 'Start';
    playBtn.classList.toggle('is-running', state.isRunning);

    // CSS classes drive phase colour and ring pulse animation
    section.classList.toggle('pomo-is-running', state.isRunning);
    section.classList.toggle('pomo-is-break',   !state.isWorkPhase);

    // Stepper buttons disabled while timer is running
    cyclesDownBtn.disabled = state.isRunning;
    cyclesUpBtn.disabled   = state.isRunning;
    cyclesValEl.textContent = state.totalCycles;
  }

  // --- Message rotation ---
  /** Pick a random message, never the same as the previous one. */
  function showNextMessage() {
    let idx;
    do {
      idx = Math.floor(Math.random() * MESSAGES.length);
    } while (idx === state.lastMessageIndex && MESSAGES.length > 1);
    state.lastMessageIndex  = idx;
    messageEl.textContent   = MESSAGES[idx];
  }

  // --- Timer logic ---
  function tick() {
    if (state.currentTime <= 0) {
      onPhaseEnd();
      return;
    }
    state.currentTime--;
    render();
  }

  /**
   * Called when a phase countdown reaches zero.
   * Records completed focus sessions, transitions state, then
   * auto-starts the next phase (or stops cleanly on the last cycle).
   */
  function onPhaseEnd() {
    clearInterval(state.timerId);
    state.timerId   = null;
    state.isRunning = false;

    if (state.isWorkPhase) {
      recordCompletedSession();

      if (state.currentCycle >= state.totalCycles) {
        // All cycles complete — stop cleanly
        state.currentTime = 0;
        render();
        upNextEl.textContent  = 'All cycles complete — great work!';
        phaseEl.textContent   = 'Done';
        showNextMessage();
        return;
      }

      // Transition to break
      state.isWorkPhase = false;
      state.currentTime = BREAK_DURATION;
      state.duration    = BREAK_DURATION;
    } else {
      // Break over — advance to next focus cycle
      state.currentCycle++;
      state.isWorkPhase = true;
      state.currentTime = WORK_DURATION;
      state.duration    = WORK_DURATION;
    }

    showNextMessage();
    render();
    // Auto-start the next phase so the flow is uninterrupted
    startTimer();
  }

  function startTimer() {
    if (state.timerId) return;
    state.isRunning = true;
    state.timerId   = setInterval(tick, 1000);
    render();
  }

  function pauseTimer() {
    clearInterval(state.timerId);
    state.timerId   = null;
    state.isRunning = false;
    render();
  }

  function resetTimer() {
    clearInterval(state.timerId);
    state.timerId      = null;
    state.isRunning    = false;
    state.isWorkPhase  = true;
    state.currentTime  = WORK_DURATION;
    state.duration     = WORK_DURATION;
    state.currentCycle = 1;
    messageEl.textContent = '';
    render();
  }

  /** Skip the current phase and immediately begin the next one. */
  function skipPhase() {
    clearInterval(state.timerId);
    state.timerId   = null;
    state.isRunning = false;

    if (state.isWorkPhase) {
      if (state.currentCycle >= state.totalCycles) {
        state.currentTime = 0;
        render();
        upNextEl.textContent = 'All cycles complete!';
        phaseEl.textContent  = 'Done';
        return;
      }
      state.isWorkPhase = false;
      state.currentTime = BREAK_DURATION;
      state.duration    = BREAK_DURATION;
    } else {
      state.currentCycle++;
      state.isWorkPhase = true;
      state.currentTime = WORK_DURATION;
      state.duration    = WORK_DURATION;
    }

    showNextMessage();
    render();
    startTimer();
  }

  // --- Event listeners ---
  on(playBtn, 'click', () => {
    if (state.isRunning) {
      pauseTimer();
    } else if (state.currentTime > 0) {
      if (!messageEl.textContent) showNextMessage();
      startTimer();
    }
  });

  on(resetBtn, 'click', resetTimer);
  on(skipBtn,  'click', skipPhase);

  on(cyclesDownBtn, 'click', () => {
    if (state.isRunning || state.totalCycles <= 1) return;
    state.totalCycles--;
    // If current cycle now exceeds new total, clamp it
    if (state.currentCycle > state.totalCycles) state.currentCycle = state.totalCycles;
    render();
  });

  on(cyclesUpBtn, 'click', () => {
    if (state.isRunning || state.totalCycles >= 12) return;
    state.totalCycles++;
    render();
  });

  // --- Initialise ring and first render ---
  // Set dasharray via JS so the value is kept in one place (CIRCUMFERENCE constant)
  ringEl.style.strokeDasharray  = CIRCUMFERENCE;
  ringEl.style.strokeDashoffset = 0;

  render();
}


/* ============================================================
   4. SERVICE WORKER REGISTRATION
   Registers the PWA service worker for offline support.
   Only active over HTTPS or localhost — silently skips on file://.
   ============================================================ */

/**
 * Register the service worker if the browser supports it.
 * Fails silently so the app always works without SW support.
 */
function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker
    .register('./service-worker.js')
    .catch(err => console.warn('[SW] Registration failed:', err));
}


/* ============================================================
   2. INITIALISATION ENTRY POINT
   ============================================================ */

/**
 * Main initialisation function.
 * Called once the DOM is fully loaded.
 */
function init() {
  initServiceWorker();
  initPomodoroTimer();
}

/*
  Wait for the DOM to be fully parsed before running init().
  'DOMContentLoaded' fires after HTML is parsed but before
  images/stylesheets are loaded — ideal for JS initialisation.
*/
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM already ready (e.g. script loaded with defer/async)
  init();
}
