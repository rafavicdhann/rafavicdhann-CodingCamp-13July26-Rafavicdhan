/**
 * app.js — Personal Dashboard entry point
 *
 * This module bootstraps all four widgets on DOMContentLoaded:
 *   1. GreetingWidget  — live clock, date, and time-of-day greeting
 *   2. FocusTimer      — 25-minute countdown with Start / Stop / Reset controls
 *   3. TaskManager     — add, edit, complete, and delete tasks (persisted)
 *   4. LinkManager     — add and delete favourite website shortcuts (persisted)
 *
 * No external dependencies. No build step. Plain ES module.
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */

// =============================================================================
// Storage Helper
// Thin wrapper around window.localStorage for TaskManager and LinkManager.
// Requirements: 9.1, 9.2, 9.3, 12.1, 12.2, 12.3
// =============================================================================

const Storage = {
  /**
   * Serialise `value` to JSON and persist it under `key`.
   * Fails silently if localStorage is unavailable (e.g., private mode).
   *
   * @param {string} key
   * @param {*} value
   */
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_err) {
      // Storage unavailable — widget continues to function in-memory.
    }
  },

  /**
   * Retrieve and deserialise the value stored under `key`.
   * Returns `null` on cache miss or JSON parse failure so callers can
   * initialise with a safe default (e.g., empty array).
   *
   * @param {string} key
   * @returns {*|null}
   */
  load(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (_err) {
      // Corrupt / unreadable data — treat as if no data exists.
      return null;
    }
  },
};

// =============================================================================
// Greeting Helper
// Pure function — no side effects, no DOM access.
// Requirements: 2.1, 2.2, 2.3
// =============================================================================

/**
 * Return a time-of-day greeting string based on the given hour.
 *
 * @param {number} hour - Integer in the range [0, 23] (local hour).
 * @returns {"Good Morning"|"Good Afternoon"|"Good Evening"}
 */
function getGreeting(hour) {
  if (hour >= 0 && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 17) return 'Good Afternoon';
  return 'Good Evening'; // hour 18–23
}

// =============================================================================
// Clock & Date Formatters
// Pure functions — no side effects, no DOM access.
// Requirements: 1.1, 1.2
// =============================================================================

/** @type {string[]} Full weekday names indexed by Date.getDay() (0 = Sunday). */
const WEEKDAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

/** @type {string[]} Full month names indexed by Date.getMonth() (0 = January). */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Format a Date object as a 24-hour time string: HH:MM:SS.
 *
 * All three components are always zero-padded to two digits, so the string
 * length is always exactly 8 characters (e.g., "09:05:03", "00:00:00").
 *
 * @param {Date} date
 * @returns {string} e.g. "14:30:00"
 */
function formatClockTime(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/**
 * Format a Date object as a human-readable date string.
 *
 * Pattern: "Weekday, Month Day, Year"
 * — Full weekday name (Sunday … Saturday)
 * — Full month name (January … December)
 * — Numeric day (no leading zero)
 * — Four-digit year
 *
 * @param {Date} date
 * @returns {string} e.g. "Monday, July 14, 2025"
 */
function formatDate(date) {
  const weekday = WEEKDAY_NAMES[date.getDay()];
  const month   = MONTH_NAMES[date.getMonth()];
  const day     = date.getDate();
  const year    = date.getFullYear();
  return `${weekday}, ${month} ${day}, ${year}`;
}

// =============================================================================
// Focus Timer Helper
// Pure function — no side effects, no DOM access.
// Requirements: 3.2
// =============================================================================

/**
 * Format a seconds value as a zero-padded MM:SS string.
 *
 * Accepts any integer in [0, 1500] (covering the full 25-minute range).
 * Both the minutes and seconds components are always padded to two digits,
 * so the returned string is always exactly 5 characters (e.g. "25:00", "01:01").
 *
 * Examples:
 *   formatTime(1500) → "25:00"
 *   formatTime(0)    → "00:00"
 *   formatTime(61)   → "01:01"
 *
 * @param {number} seconds - Integer in the range [0, 1500].
 * @returns {string} e.g. "25:00"
 *
 * Property 4: For any remaining-seconds value r in [0, 1500], formatTime(r)
 * SHALL produce a string of the form MM:SS where the total seconds encoded
 * equals r.  Validates: Requirements 3.2
 */
function formatTime(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// =============================================================================
// Validation Helpers
// Pure functions — no side effects, no DOM access.
// Requirements: 6.3, 7.4
// =============================================================================

/**
 * Validate a task label string.
 *
 * Returns `true` when `str` is a non-empty string that contains at least one
 * non-whitespace character. Returns `false` for empty strings, whitespace-only
 * strings, and non-string values.
 *
 * Used by TaskManager to guard both the "add task" and "edit task" flows so
 * that blank or whitespace-only labels are never persisted.
 *
 * @param {string} str - Candidate label value from the user's input field.
 * @returns {boolean}
 *
 * Requirements: 6.3, 7.4
 */
function validateLabel(str) {
  return typeof str === 'string' && str.trim().length > 0;
}

/**
 * Validate a quick-link label and URL pair.
 *
 * Returns `true` only when both `label` and `url` are non-empty strings that
 * contain at least one non-whitespace character. Returns `false` if either
 * argument is empty or whitespace-only.
 *
 * Used by LinkManager to guard the "add link" flow so that blank labels or
 * blank URLs are never persisted.
 *
 * @param {string} label - Candidate display label from the user's input field.
 * @param {string} url   - Candidate URL from the user's input field.
 * @returns {boolean}
 *
 * Requirements: 10.3
 */
function validateLink(label, url) {
  return label.trim() !== '' && url.trim() !== '';
}

// =============================================================================
// GreetingWidget
// Manages the live clock, date display, and time-of-day greeting.
// Requirements: 1.1, 1.2, 1.3, 2.4
// =============================================================================

const GreetingWidget = {
  /** @type {HTMLTimeElement|null} */
  _elTime: null,

  /** @type {HTMLElement|null} */
  _elDate: null,

  /** @type {HTMLElement|null} */
  _elGreeting: null,

  /**
   * Grab DOM references, render immediately, then start the 1-second interval.
   * Calling _tick() before setInterval ensures the widget is populated right
   * away — no blank/stale display for the first second.
   *
   * Requirements: 1.3, 2.4
   */
  init() {
    this._elTime     = document.getElementById('clock-display');
    this._elDate     = document.getElementById('date-display');
    this._elGreeting = document.getElementById('greeting-text');

    // Render immediately so the widget shows correct values on load.
    this._tick();

    // Update every second; greeting re-evaluated on every tick (satisfies ≤1-min req).
    setInterval(() => this._tick(), 1000);
  },

  /**
   * Capture the current moment and dispatch to each render helper.
   * Called once immediately in init(), then every 1 000 ms by setInterval.
   */
  _tick() {
    const now = new Date();
    this._renderTime(now);
    this._renderDate(now);
    this._renderGreeting(now);
  },

  /**
   * Write the current time to #clock-display and keep its `datetime`
   * attribute in sync with a valid HH:MM:SS value.
   *
   * @param {Date} date
   * Requirements: 1.1, 1.3
   */
  _renderTime(date) {
    const timeStr = formatClockTime(date);
    this._elTime.textContent = timeStr;
    // datetime attribute holds the machine-readable time (HH:MM:SS).
    this._elTime.setAttribute('datetime', timeStr);
  },

  /**
   * Write the formatted date string to #date-display.
   *
   * @param {Date} date
   * Requirements: 1.2
   */
  _renderDate(date) {
    this._elDate.textContent = formatDate(date);
  },

  /**
   * Compute the appropriate greeting for the current hour and write it
   * to #greeting-text. Re-evaluated every tick so it updates automatically
   * when an hour boundary (e.g., 12:00, 18:00) is crossed.
   *
   * @param {Date} date
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  _renderGreeting(date) {
    this._elGreeting.textContent = getGreeting(date.getHours());
  },
};

// =============================================================================
// FocusTimer
// Manages the countdown with configurable duration and Start / Stop / Reset controls.
// Challenge: custom Pomodoro duration (persisted to localStorage).
// Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2
// =============================================================================

/** @type {string} Local Storage key for the custom timer duration (in seconds). */
const TIMER_DURATION_KEY = 'pd_timer_duration';

/** @type {number} Default timer duration in seconds (25 minutes). */
const TIMER_DEFAULT_SECONDS = 1500;

const FocusTimer = {
  /**
   * Total duration in seconds for the current session.
   * Loaded from storage or defaults to 1500 (25 min).
   * @type {number}
   */
  _duration: TIMER_DEFAULT_SECONDS,

  /** @type {number} Seconds remaining in the current session (0–_duration). */
  remaining: TIMER_DEFAULT_SECONDS,

  /** @type {number|null} Active setInterval handle; null when stopped. */
  intervalId: null,

  // DOM references — populated in init()
  /** @type {HTMLTimeElement|null} */   _elDisplay:       null,
  /** @type {HTMLButtonElement|null} */ _elStart:         null,
  /** @type {HTMLButtonElement|null} */ _elStop:          null,
  /** @type {HTMLButtonElement|null} */ _elReset:         null,
  /** @type {HTMLFormElement|null} */   _elDurationForm:  null,
  /** @type {HTMLInputElement|null} */  _elDurationInput: null,

  /**
   * Grab DOM references, attach button and form event listeners, restore
   * persisted duration, and render the initial display.
   *
   * Requirements: 3.1, 3.3
   */
  init() {
    this._elDisplay      = document.getElementById('timer-display');
    this._elStart        = document.getElementById('timer-start');
    this._elStop         = document.getElementById('timer-stop');
    this._elReset        = document.getElementById('timer-reset');
    this._elDurationForm  = document.getElementById('timer-duration-form');
    this._elDurationInput = document.getElementById('timer-duration-input');

    // Restore persisted duration (or keep default 1500 s / 25 min).
    const saved = Storage.load(TIMER_DURATION_KEY);
    if (typeof saved === 'number' && saved >= 60 && saved <= 5940) {
      this._duration = saved;
      this.remaining = saved;
      this._elDurationInput.value = Math.floor(saved / 60);
    }

    this._elStart.addEventListener('click', () => this._start());
    this._elStop.addEventListener('click',  () => this._stop());
    this._elReset.addEventListener('click', () => this._reset());

    // Custom duration form — validate 1–99 minutes, reset timer to new duration.
    this._elDurationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const mins = parseInt(this._elDurationInput.value, 10);
      if (!Number.isInteger(mins) || mins < 1 || mins > 99) return;
      this._setDuration(mins * 60);
    });

    this._render();
  },

  /**
   * Apply a new duration, stop any running countdown, and reset the display.
   * Persists the chosen duration so it survives page reloads.
   *
   * @param {number} seconds - New duration in seconds (60–5940).
   */
  _setDuration(seconds) {
    // Stop any active countdown before changing duration.
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this._duration = seconds;
    this.remaining = seconds;

    // Restore button states (timer is now stopped/reset).
    this._elStart.disabled = false;
    this._elStop.disabled  = true;

    // Persist the new duration.
    Storage.save(TIMER_DURATION_KEY, seconds);

    this._render();
  },

  /**
   * Begin counting down one second at a time.
   * Disables Start and enables Stop to prevent duplicate intervals.
   *
   * Requirements: 4.1, 4.4
   */
  _start() {
    if (this.intervalId !== null) return; // guard: already running

    this._elStart.disabled = true;
    this._elStop.disabled  = false;

    this.intervalId = setInterval(() => this._tick(), 1000);
  },

  /**
   * Pause the countdown and retain the remaining time.
   * Enables Start and disables Stop.
   *
   * Requirements: 4.2, 4.5
   */
  _stop() {
    clearInterval(this.intervalId);
    this.intervalId = null;

    this._elStart.disabled = false;
    this._elStop.disabled  = true;
  },

  /**
   * Stop any active countdown, restore remaining to _duration, re-render,
   * and restore button states (Start enabled, Stop disabled).
   *
   * Requirements: 4.3, 3.3
   */
  _reset() {
    clearInterval(this.intervalId);
    this.intervalId = null;

    this.remaining = this._duration;

    this._elStart.disabled = false;
    this._elStop.disabled  = true;

    this._render();
  },

  /**
   * Decrement remaining by one second and re-render.
   * Calls _onComplete when the countdown reaches zero.
   *
   * Requirements: 4.1, 5.1
   */
  _tick() {
    this.remaining -= 1;
    this._render();

    if (this.remaining <= 0) {
      this._onComplete();
    }
  },

  /**
   * Clear the interval (prevents any further ticks / double-fire) and notify
   * the user that the focus session has ended. Restore button states.
   *
   * Requirements: 5.1, 5.2
   */
  _onComplete() {
    clearInterval(this.intervalId);
    this.intervalId = null;

    this._elStart.disabled = false;
    this._elStop.disabled  = true;

    alert('Focus session complete! Time to take a break.');
  },

  /**
   * Format `this.remaining` as MM:SS and write it to the timer display
   * element, keeping the `datetime` attribute in sync.
   *
   * Requirements: 3.2
   */
  _render() {
    const timeStr = formatTime(this.remaining);
    this._elDisplay.textContent = timeStr;
    const mins = Math.floor(this.remaining / 60);
    const secs = this.remaining % 60;
    this._elDisplay.setAttribute('datetime', `PT${mins}M${secs}S`);
  },
};

// =============================================================================
// TaskManager
// Manages the in-memory task array and its DOM representation.
// Challenge: prevent duplicate tasks (case-insensitive) + sort tasks.
// Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5,
//               9.1, 9.2, 9.3
// =============================================================================

/** @type {string} Local Storage key for the task list. */
const TASKS_KEY = 'pd_tasks';

/** @type {string} Local Storage key for the task sort preference. */
const TASKS_SORT_KEY = 'pd_tasks_sort';

const TaskManager = {
  /** @type {Array<{id: string, label: string, completed: boolean}>} */
  _tasks: [],

  /**
   * Current sort mode. One of: 'default' | 'az' | 'completed-last'.
   * Only affects rendering — the stored array is always in insertion order.
   * @type {string}
   */
  _sortMode: 'default',

  // DOM references — populated in init()
  /** @type {HTMLFormElement|null} */   _form:       null,
  /** @type {HTMLInputElement|null} */  _input:      null,
  /** @type {HTMLUListElement|null} */  _list:       null,
  /** @type {HTMLParagraphElement|null} */ _errorEl: null,
  /** @type {HTMLSelectElement|null} */ _sortSelect: null,

  /** @type {number|null} setTimeout handle for clearing the error message. */
  _errorTimer: null,

  /**
   * Populate in-memory state from the provided tasks array, grab DOM
   * references, wire event listeners, and perform the initial render.
   *
   * @param {Array<{id: string, label: string, completed: boolean}>} tasks
   * Requirements: 9.2, 9.3
   */
  init(tasks) {
    this._tasks = Array.isArray(tasks) ? tasks : [];

    this._form       = document.getElementById('task-form');
    this._input      = document.getElementById('task-input');
    this._list       = document.getElementById('task-list');
    this._errorEl    = document.getElementById('task-error');
    this._sortSelect = document.getElementById('task-sort');

    // Restore persisted sort preference.
    const savedSort = Storage.load(TASKS_SORT_KEY);
    if (['default', 'az', 'completed-last'].includes(savedSort)) {
      this._sortMode = savedSort;
      this._sortSelect.value = savedSort;
    }

    this._form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._addTask(this._input.value);
    });

    // Sort select change handler — persist and re-render.
    this._sortSelect.addEventListener('change', () => {
      this._sortMode = this._sortSelect.value;
      Storage.save(TASKS_SORT_KEY, this._sortMode);
      this._render();
    });

    this._render();
  },

  /**
   * Show a temporary inline error message for ~3 seconds.
   * @param {string} message
   */
  _showError(message) {
    if (this._errorTimer !== null) clearTimeout(this._errorTimer);
    this._errorEl.textContent = message;
    this._errorTimer = setTimeout(() => {
      this._errorEl.textContent = '';
      this._errorTimer = null;
    }, 3000);
  },

  /**
   * Validate the label, check for duplicates, create a new task object,
   * push it onto the task array, persist, re-render, and clear the input
   * field on success. Silently rejects empty/whitespace; shows an inline
   * error for duplicates (case-insensitive).
   *
   * @param {string} label
   * Requirements: 6.2, 6.3
   */
  _addTask(label) {
    if (!validateLabel(label)) return; // reject empty / whitespace-only

    const trimmed = label.trim();

    // Challenge: prevent duplicate tasks (case-insensitive comparison).
    const duplicate = this._tasks.some(
      (t) => t.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      this._showError(`"${trimmed}" is already in your list.`);
      return;
    }

    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Date.now().toString() + Math.random();

    this._tasks.push({ id, label: trimmed, completed: false });
    this._save();
    this._render();
    this._input.value = ''; // clear input field on success
    // Clear any lingering error on successful add.
    if (this._errorEl) this._errorEl.textContent = '';
    if (this._errorTimer !== null) {
      clearTimeout(this._errorTimer);
      this._errorTimer = null;
    }
  },

  /**
   * Validate the new label; if valid, mutate the matching task and
   * persist + re-render. Silently rejects whitespace-only edits.
   *
   * @param {string} id
   * @param {string} label
   * Requirements: 7.3, 7.4
   */
  _editTask(id, label) {
    if (!validateLabel(label)) return; // reject whitespace-only edits silently

    const task = this._tasks.find((t) => t.id === id);
    if (!task) return;

    task.label = label.trim();
    this._save();
    this._render();
  },

  /**
   * Flip the completed flag on the matching task, persist, and re-render.
   *
   * @param {string} id
   * Requirements: 8.2, 8.3
   */
  _toggleTask(id) {
    const task = this._tasks.find((t) => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    this._save();
    this._render();
  },

  /**
   * Remove the task with the given id from the array, persist, and re-render.
   *
   * @param {string} id
   * Requirements: 8.5
   */
  _deleteTask(id) {
    this._tasks = this._tasks.filter((t) => t.id !== id);
    this._save();
    this._render();
  },

  /**
   * Serialise the current task array to Local Storage.
   *
   * Requirements: 9.1
   */
  _save() {
    Storage.save(TASKS_KEY, this._tasks);
  },

  /**
   * Return a sorted copy of _tasks based on the current _sortMode.
   * The original array is never mutated — storage always retains
   * insertion order.
   *
   * Modes:
   *   'default'        — insertion order (no sort)
   *   'az'             — alphabetical by label, case-insensitive
   *   'completed-last' — incomplete tasks first, completed tasks last;
   *                      within each group, insertion order is preserved
   *
   * @returns {Array<{id: string, label: string, completed: boolean}>}
   */
  _getSortedTasks() {
    const copy = [...this._tasks];
    if (this._sortMode === 'az') {
      copy.sort((a, b) =>
        a.label.toLowerCase().localeCompare(b.label.toLowerCase())
      );
    } else if (this._sortMode === 'completed-last') {
      copy.sort((a, b) => Number(a.completed) - Number(b.completed));
    }
    return copy;
  },

  /**
   * Rebuild the entire task list DOM from the current in-memory state,
   * applying the active sort order.
   *
   * Each row contains:
   *   • A checkbox (completion toggle) — Requirements: 8.1
   *   • A label span (strikethrough when completed) — Requirements: 8.2, 8.3
   *   • An Edit button — Requirements: 7.1
   *   • A Delete button — Requirements: 8.4
   *
   * Requirements: 6.1, 7.2, 8.1
   */
  _render() {
    this._list.innerHTML = '';

    this._getSortedTasks().forEach((task) => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.completed ? ' task-item--completed' : '');
      li.dataset.id = task.id;

      // ── Completion checkbox ────────────────────────────────────────
      const checkbox = document.createElement('input');
      checkbox.type    = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.setAttribute('aria-label', `Mark "${task.label}" as ${task.completed ? 'incomplete' : 'complete'}`);
      checkbox.addEventListener('change', () => this._toggleTask(task.id));

      // ── Label span ─────────────────────────────────────────────────
      const labelSpan = document.createElement('span');
      labelSpan.className   = 'task-item__label';
      labelSpan.textContent = task.label;

      // ── Edit button ────────────────────────────────────────────────
      const editBtn = document.createElement('button');
      editBtn.type      = 'button';
      editBtn.className = 'btn btn--ghost';
      editBtn.textContent = 'Edit';
      editBtn.setAttribute('aria-label', `Edit task: ${task.label}`);
      editBtn.addEventListener('click', () => this._startInlineEdit(li, task));

      // ── Delete button ──────────────────────────────────────────────
      const deleteBtn = document.createElement('button');
      deleteBtn.type      = 'button';
      deleteBtn.className = 'btn btn--danger';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', `Delete task: ${task.label}`);
      deleteBtn.addEventListener('click', () => this._deleteTask(task.id));

      li.appendChild(checkbox);
      li.appendChild(labelSpan);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);

      this._list.appendChild(li);
    });
  },

  /**
   * Replace the label span and action buttons in a task row with an inline
   * edit input plus Confirm and Cancel buttons.
   *
   * @param {HTMLLIElement} li
   * @param {{id: string, label: string, completed: boolean}} task
   * Requirements: 7.2, 7.3, 7.4
   */
  _startInlineEdit(li, task) {
    while (li.children.length > 1) {
      li.removeChild(li.lastChild);
    }

    const editInput = document.createElement('input');
    editInput.type      = 'text';
    editInput.className = 'input task-item__label';
    editInput.value     = task.label;
    editInput.setAttribute('aria-label', 'Edit task label');

    const confirmBtn = document.createElement('button');
    confirmBtn.type      = 'button';
    confirmBtn.className = 'btn btn--primary';
    confirmBtn.textContent = 'Save';
    confirmBtn.setAttribute('aria-label', 'Save edit');

    const cancelBtn = document.createElement('button');
    cancelBtn.type      = 'button';
    cancelBtn.className = 'btn btn--ghost';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.setAttribute('aria-label', 'Cancel edit');

    const doConfirm = () => {
      this._editTask(task.id, editInput.value);
      if (!validateLabel(editInput.value)) {
        this._render();
      }
    };

    const doCancel = () => this._render();

    confirmBtn.addEventListener('click', doConfirm);
    cancelBtn.addEventListener('click', doCancel);
    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  { e.preventDefault(); doConfirm(); }
      if (e.key === 'Escape') { e.preventDefault(); doCancel(); }
    });

    li.appendChild(editInput);
    li.appendChild(confirmBtn);
    li.appendChild(cancelBtn);

    editInput.focus();
    editInput.select();
  },
};

// =============================================================================
// LinkManager
// Manages the in-memory links array and its DOM representation.
// Requirements: 10.1, 10.2, 10.3, 10.4, 11.1, 11.2, 12.1, 12.2, 12.3
// =============================================================================

/** @type {string} Local Storage key for the links list. */
const LINKS_KEY = 'pd_links';

const LinkManager = {
  /** @type {Array<{id: string, label: string, url: string}>} */
  _links: [],

  // DOM references — populated in init()
  /** @type {HTMLFormElement|null} */   _form:       null,
  /** @type {HTMLInputElement|null} */  _labelInput: null,
  /** @type {HTMLInputElement|null} */  _urlInput:   null,
  /** @type {HTMLUListElement|null} */  _list:       null,

  /**
   * Populate in-memory state from the provided links array, grab DOM
   * references, wire event listeners, and perform the initial render.
   *
   * @param {Array<{id: string, label: string, url: string}>} links
   * Requirements: 12.2, 12.3
   */
  init(links) {
    this._links = Array.isArray(links) ? links : [];

    this._form       = document.getElementById('link-form');
    this._labelInput = document.getElementById('link-label-input');
    this._urlInput   = document.getElementById('link-url-input');
    this._list       = document.getElementById('link-list');

    // Submit via the Add button (type="submit") or pressing Enter in either input.
    this._form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._addLink(this._labelInput.value, this._urlInput.value);
    });

    this._render();
  },

  /**
   * Validate the label and URL, create a new link object, push it onto the
   * links array, persist, re-render, and clear the input fields on success.
   * Silently rejects empty / whitespace-only label or URL.
   *
   * @param {string} label - Display name for the link.
   * @param {string} url   - URL for the link.
   * Requirements: 10.2, 10.3
   */
  _addLink(label, url) {
    if (!validateLink(label, url)) return; // reject empty / whitespace-only fields

    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Date.now().toString() + Math.random();

    this._links.push({ id, label: label.trim(), url: url.trim() });
    this._save();
    this._render();

    // Clear input fields on success
    this._labelInput.value = '';
    this._urlInput.value   = '';
  },

  /**
   * Remove the link with the given id from the array, persist, and re-render.
   *
   * @param {string} id
   * Requirements: 11.2
   */
  _deleteLink(id) {
    this._links = this._links.filter((l) => l.id !== id);
    this._save();
    this._render();
  },

  /**
   * Serialise the current links array to Local Storage.
   *
   * Requirements: 12.1
   */
  _save() {
    Storage.save(LINKS_KEY, this._links);
  },

  /**
   * Rebuild the entire link list DOM from the current in-memory state.
   *
   * Each row contains:
   *   • A link button that opens the URL in a new tab — Requirements: 10.4
   *   • A Delete button — Requirements: 11.1
   *
   * Requirements: 10.1, 10.4, 11.1
   */
  _render() {
    // Clear existing content
    this._list.innerHTML = '';

    this._links.forEach((link) => {
      const li = document.createElement('li');
      li.className = 'link-item';
      li.dataset.id = link.id;

      // ── Link button — opens in a new tab ───────────────────────────
      const linkBtn = document.createElement('a');
      linkBtn.href      = link.url;
      linkBtn.target    = '_blank';
      linkBtn.rel       = 'noopener noreferrer'; // security best practice
      linkBtn.className = 'btn btn--primary link-item__link';
      linkBtn.textContent = link.label;
      linkBtn.setAttribute('aria-label', `Open ${link.label} in a new tab`);

      // ── Delete button ──────────────────────────────────────────────
      const deleteBtn = document.createElement('button');
      deleteBtn.type        = 'button';
      deleteBtn.className   = 'btn btn--danger';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', `Delete link: ${link.label}`);
      deleteBtn.addEventListener('click', () => this._deleteLink(link.id));

      li.appendChild(linkBtn);
      li.appendChild(deleteBtn);

      this._list.appendChild(li);
    });
  },
};

// =============================================================================
// DOMContentLoaded bootstrap
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  GreetingWidget.init();
  FocusTimer.init();

  // Load persisted tasks (or default to empty array) and init TaskManager.
  const savedTasks = Storage.load(TASKS_KEY);
  TaskManager.init(savedTasks);

  // Load persisted links (or default to empty array) and init LinkManager.
  const savedLinks = Storage.load(LINKS_KEY);
  LinkManager.init(savedLinks);
});
