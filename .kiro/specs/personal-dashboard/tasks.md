# Implementation Plan: Personal Dashboard

## Overview

Implement a fully client-side single-page dashboard using plain HTML, CSS, and Vanilla JavaScript. The project requires no build tools, no frameworks, and no external dependencies. All four widgets (Greeting, Focus Timer, Task Manager, Link Manager) are wired together in `js/app.js` and bootstrapped on `DOMContentLoaded`. Persistence is handled exclusively through the Browser Local Storage API.

---

## Tasks

- [x] 1. Scaffold project file structure and HTML skeleton
  - Create `index.html` at the project root with semantic markup sections for all four widgets (greeting, focus-timer, task-manager, link-manager)
  - Create `css/style.css` with a CSS reset/base and responsive grid/flex layout that spans 320 px – 2560 px
  - Create `js/app.js` as an empty module; link both files from `index.html`
  - Confirm the page loads without console errors in Chrome, Firefox, Edge, and Safari
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 2. Implement the Storage helper
  - [x] 2.1 Write the `Storage` helper object in `js/app.js`
    - Implement `Storage.save(key, value)` using `JSON.stringify` + `localStorage.setItem`, wrapped in `try/catch`
    - Implement `Storage.load(key)` using `localStorage.getItem` + `JSON.parse`, returning `null` on miss or parse failure, wrapped in `try/catch`
    - _Requirements: 9.1, 9.2, 9.3, 12.1, 12.2, 12.3_

- [x] 3. Implement the Greeting Widget
  - [x] 3.1 Implement `getGreeting(hour)` pure helper function
    - Return `"Good Morning"` for hour ∈ [0, 11], `"Good Afternoon"` for hour ∈ [12, 17], `"Good Evening"` for hour ∈ [18, 23]
    - _Requirements: 2.1, 2.2, 2.3_


  - [x] 3.3 Implement `formatClockTime(date)` and `formatDate(date)` pure helper functions
    - `formatClockTime` outputs HH:MM:SS (24-hour or 12-hour with AM/PM)
    - `formatDate` outputs `"Weekday, Month Day, Year"` (e.g., "Monday, July 14, 2025")
    - _Requirements: 1.1, 1.2_



  - [x] 3.5 Implement `GreetingWidget.init()` and `GreetingWidget._tick()`
    - Wire `_renderTime()`, `_renderDate()`, and `_renderGreeting()` to the correct DOM elements
    - Start a `setInterval` every 1 000 ms; re-evaluate greeting on every tick
    - _Requirements: 1.1, 1.2, 1.3, 2.4_

- [x] 4. Implement the Focus Timer
  - [x] 4.1 Implement `formatTime(seconds)` pure helper function
    - Produce a `MM:SS` string for any integer seconds value in [0, 1500]
    - _Requirements: 3.2_

  - [x] 4.3 Implement `FocusTimer.init()`, `_start()`, `_stop()`, `_reset()`, `_tick()`, `_onComplete()`, and `_render()`
    - Initialise `remaining = 1500`; display "25:00" on load
    - Start: begin countdown via `setInterval(1000)`, disable Start button, enable Stop button
    - Stop: clear interval, retain `remaining`, disable Stop button, enable Start button
    - Reset: clear interval, restore `remaining = 1500`, re-render "25:00", restore button states
    - `_onComplete`: clear interval, show browser `alert` or in-page visual indicator exactly once
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2_

- [ ] 5. Checkpoint — Greeting and Timer
  - Ensure the live clock updates every second, the greeting displays correctly by hour, the timer counts down, and all three timer controls behave as specified. Ask the user if questions arise.

- [x] 6. Implement the Task Manager
  - [x] 6.1 Implement `validateLabel(str)` pure helper function
    - Return `false` for empty strings and whitespace-only strings (after `.trim()`); return `true` otherwise
    - _Requirements: 6.3, 7.4_



  - [x] 6.3 Implement `TaskManager.init()`, `_addTask()`, `_editTask()`, `_toggleTask()`, `_deleteTask()`, `_save()`, and `_render()`
    - `_addTask(label)`: validate, generate id via `crypto.randomUUID()` (fallback: `Date.now().toString() + Math.random()`), push to `tasks[]`, save, render; clear input field on success
    - `_editTask(id, label)`: validate non-empty trimmed label, mutate `tasks[]`, save, render; reject whitespace edits silently
    - `_toggleTask(id)`: flip `completed` flag, save, render; apply or remove visual distinction (strikethrough)
    - `_deleteTask(id)`: filter out the matching id, save, render
    - `_save()`: call `Storage.save("pd_tasks", tasks)`
    - `_render()`: rebuild task list DOM; each row shows label, completion checkbox, Edit button, Delete button; completed tasks have visual strikethrough
    - Handle Enter-key submission on the add-task input
    - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5_


  - [x] 6.8 Implement Task Manager persistence on load
    - In the `DOMContentLoaded` bootstrap, call `Storage.load("pd_tasks")`; initialise with empty array if `null`; pass result to `TaskManager.init()`
    - _Requirements: 9.2, 9.3_

- [ ] 7. Checkpoint — Task Manager
  - Verify adding, editing, completing, and deleting tasks all work; confirm tasks survive a full page reload. Ask the user if questions arise.

- [x] 8. Implement the Link Manager
  - [x] 8.1 Implement `validateLink(label, url)` pure helper function
    - Return `false` if either `label` or `url` is empty or whitespace-only; return `true` otherwise
    - _Requirements: 10.3_

  

  - [x] 8.3 Implement `LinkManager.init()`, `_addLink()`, `_deleteLink()`, `_save()`, and `_render()`
    - `_addLink(label, url)`: validate, generate id, push to `links[]`, save, render; clear input fields on success
    - `_deleteLink(id)`: filter out the matching id, save, render
    - `_save()`: call `Storage.save("pd_links", links)`
    - `_render()`: rebuild link list DOM; each link renders as a button that opens the URL in a new tab (`target="_blank"`); each row also has a Delete button
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 11.1, 11.2_

  
  - [x] 8.7 Implement Link Manager persistence on load
    - In the `DOMContentLoaded` bootstrap, call `Storage.load("pd_links")`; initialise with empty array if `null`; pass result to `LinkManager.init()`
    - _Requirements: 12.2, 12.3_

- [ ] 9. Checkpoint — Link Manager
  - Verify adding and deleting links work, links open in a new tab, and links survive a full page reload. Ask the user if questions arise.

- [x] 10. Apply responsive CSS and visual polish
  - [x] 10.1 Write responsive layout rules in `css/style.css`
    - Use CSS Grid or Flexbox to arrange the four widget sections
    - Add responsive breakpoints ensuring no horizontal scrolling or overlapping elements from 320 px to 2560 px
    - Apply strikethrough style to completed tasks (e.g., `text-decoration: line-through`)
    - _Requirements: 14.3_
  - [x] 10.2 Implement button enable/disable visual states for the Focus Timer
    - Disabled Start button while countdown is active; disabled Stop button while stopped/reset
    - _Requirements: 4.4, 4.5_

- [x] 11. Wire everything together in `js/app.js` bootstrap
  - [x] 11.1 Implement the `DOMContentLoaded` initialisation sequence
    - Load tasks from Storage → `TaskManager.init(tasks)`
    - Load links from Storage → `LinkManager.init(links)`
    - Call `GreetingWidget.init()`
    - Call `FocusTimer.init()`
    - All four widgets must attach their event listeners and render their initial state without errors
    - _Requirements: 9.2, 9.3, 12.2, 12.3, 13.4_

- [ ] 12. Final checkpoint — Full integration
  - Open the dashboard in Chrome, Firefox, Edge, and Safari. Confirm all four widgets render, the clock updates live, the timer counts to 00:00 and fires the notification, tasks and links persist across reloads, and the layout is correct at 320 px, 768 px, 1280 px, and 2560 px. Ensure no uncaught exceptions occur when `localStorage` is blocked. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP. No test framework is required by the project constraints; optional test tasks describe what to verify manually or what to automate if a runner (e.g., fast-check) is added later.
- Each task references specific requirements for traceability.
- The `Storage` helper must be defined before any widget that uses it (Tasks 2 before 6 and 8).
- Property tests (Properties 3–14) map directly to correctness properties defined in `design.md`.
- Checkpoints (Tasks 5, 7, 9, 12) are natural integration points for manual browser verification.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["3.1", "3.3", "4.1", "6.1", "8.1"] },
    { "id": 2, "tasks": ["3.2", "3.4", "4.2", "6.2", "8.2"] },
    { "id": 3, "tasks": ["3.5", "4.3", "6.3", "8.3"] },
    { "id": 4, "tasks": ["6.4", "6.5", "6.6", "6.7", "8.4", "8.5", "8.6", "10.1", "10.2"] },
    { "id": 5, "tasks": ["6.8", "8.7"] },
    { "id": 6, "tasks": ["11.1"] }
  ]
}
```
