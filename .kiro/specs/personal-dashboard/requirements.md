# Requirements Document

## Introduction

A personal browser dashboard delivered as a standalone web app (and optionally a browser new-tab extension) built with HTML, CSS, and Vanilla JavaScript only. All data is stored client-side using the Browser Local Storage API. The dashboard provides four core widgets: a time/date greeting, a focus (Pomodoro) timer, a to-do list, and a quick-links launcher. The interface is clean, minimal, and loads instantly with no backend dependency.

## Glossary

- **Dashboard**: The single-page web application that hosts all widgets.
- **Greeting_Widget**: The section of the Dashboard that displays the current time, date, and a time-of-day greeting.
- **Timer**: The focus countdown timer widget (default 25 minutes).
- **Task_Manager**: The to-do list widget responsible for creating, editing, completing, and deleting tasks.
- **Task**: A single to-do item containing a text label and a completion state.
- **Link_Manager**: The quick-links widget responsible for storing and displaying favourite website shortcuts.
- **Link**: A single quick-link item containing a display label and a URL.
- **Storage**: The Browser Local Storage API used for all client-side persistence.
- **User**: The person interacting with the Dashboard in a modern web browser.

---

## Requirements

### Requirement 1: Display Current Time and Date

**User Story:** As a User, I want to see the current time and date when I open the Dashboard, so that I always have an at-a-glance sense of the moment.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM:SS (24-hour or 12-hour with AM/PM) format.
2. THE Greeting_Widget SHALL display the current date including the full weekday name, month name, day, and four-digit year (e.g., "Monday, July 14, 2025").
3. WHILE the Dashboard is open, THE Greeting_Widget SHALL update the displayed time every second without requiring a page reload.

---

### Requirement 2: Time-of-Day Greeting

**User Story:** As a User, I want to see a personalised greeting based on the time of day, so that the Dashboard feels welcoming at any hour.

#### Acceptance Criteria

1. WHEN the local hour is between 00:00 and 11:59 (inclusive), THE Greeting_Widget SHALL display the message "Good Morning".
2. WHEN the local hour is between 12:00 and 17:59 (inclusive), THE Greeting_Widget SHALL display the message "Good Afternoon".
3. WHEN the local hour is between 18:00 and 23:59 (inclusive), THE Greeting_Widget SHALL display the message "Good Evening".
4. WHILE the Dashboard is open, THE Greeting_Widget SHALL re-evaluate the greeting every minute so that the greeting updates without a page reload when the time boundary is crossed.

---

### Requirement 3: Focus Timer — Default Duration and Display

**User Story:** As a User, I want a visible countdown timer defaulting to 25 minutes, so that I can track focused work sessions.

#### Acceptance Criteria

1. THE Timer SHALL initialise with a default countdown duration of 25 minutes (1500 seconds).
2. THE Timer SHALL display the remaining time in MM:SS format at all times.
3. WHILE the Timer is in the stopped or reset state, THE Timer SHALL display "25:00".

---

### Requirement 4: Focus Timer — Controls

**User Story:** As a User, I want Start, Stop, and Reset buttons for the timer, so that I can control my focus sessions without reloading the page.

#### Acceptance Criteria

1. WHEN the User activates the Start control, THE Timer SHALL begin counting down one second at a time.
2. WHEN the User activates the Stop control, THE Timer SHALL pause the countdown and retain the remaining time.
3. WHEN the User activates the Reset control, THE Timer SHALL stop any active countdown and restore the display to "25:00".
4. WHILE the Timer is counting down, THE Timer SHALL disable the Start control to prevent duplicate intervals.
5. WHILE the Timer is stopped or reset, THE Timer SHALL disable the Stop control.

---

### Requirement 5: Focus Timer — Completion

**User Story:** As a User, I want to be notified when my focus session ends, so that I know to take a break.

#### Acceptance Criteria

1. WHEN the Timer countdown reaches 00:00, THE Timer SHALL stop counting down automatically.
2. WHEN the Timer countdown reaches 00:00, THE Timer SHALL notify the User via a browser `alert` or an in-page visual indicator.

---

### Requirement 6: To-Do List — Adding Tasks

**User Story:** As a User, I want to add new tasks to my to-do list, so that I can track things I need to do.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a text input field and an Add button for creating new Tasks.
2. WHEN the User submits a non-empty task label via the Add button or the Enter key, THE Task_Manager SHALL append the new Task to the task list and clear the input field.
3. IF the User attempts to submit an empty or whitespace-only task label, THEN THE Task_Manager SHALL reject the submission and leave the task list unchanged.

---

### Requirement 7: To-Do List — Editing Tasks

**User Story:** As a User, I want to edit the label of an existing task, so that I can correct or update what I wrote.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide an Edit control for each Task in the list.
2. WHEN the User activates the Edit control for a Task, THE Task_Manager SHALL replace the Task label with an editable text field pre-populated with the current label.
3. WHEN the User confirms the edit with a non-empty label, THE Task_Manager SHALL update the Task label and return to the read-only display.
4. IF the User confirms the edit with an empty or whitespace-only label, THEN THE Task_Manager SHALL reject the update and retain the original Task label.

---

### Requirement 8: To-Do List — Completing and Deleting Tasks

**User Story:** As a User, I want to mark tasks as done and remove tasks I no longer need, so that I can maintain a clean and accurate list.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a completion toggle (checkbox or equivalent) for each Task.
2. WHEN the User toggles the completion control for an incomplete Task, THE Task_Manager SHALL mark the Task as complete and apply a visual distinction (e.g., strikethrough text).
3. WHEN the User toggles the completion control for a completed Task, THE Task_Manager SHALL mark the Task as incomplete and remove the visual distinction.
4. THE Task_Manager SHALL provide a Delete control for each Task.
5. WHEN the User activates the Delete control for a Task, THE Task_Manager SHALL remove that Task from the list permanently.

---

### Requirement 9: To-Do List — Persistence

**User Story:** As a User, I want my tasks to be saved automatically, so that they are still present when I reopen the Dashboard.

#### Acceptance Criteria

1. WHEN the task list is modified (task added, edited, completed, or deleted), THE Task_Manager SHALL serialise the current task list to Storage under a fixed key.
2. WHEN the Dashboard loads, THE Task_Manager SHALL read the task list from Storage and render all previously saved Tasks.
3. IF no task data exists in Storage, THEN THE Task_Manager SHALL initialise with an empty task list.

---

### Requirement 10: Quick Links — Adding Links

**User Story:** As a User, I want to add quick-access links to my favourite websites, so that I can open them with one click.

#### Acceptance Criteria

1. THE Link_Manager SHALL provide input fields for a display label and a URL, plus an Add button for creating new Links.
2. WHEN the User submits a Link with a non-empty label and a non-empty URL, THE Link_Manager SHALL append the new Link to the links list.
3. IF the User attempts to submit a Link with an empty label or an empty URL, THEN THE Link_Manager SHALL reject the submission and leave the links list unchanged.
4. WHEN the User activates a Link button, THE Link_Manager SHALL open the associated URL in a new browser tab.

---

### Requirement 11: Quick Links — Deleting Links

**User Story:** As a User, I want to remove quick links I no longer need, so that the links panel stays relevant.

#### Acceptance Criteria

1. THE Link_Manager SHALL provide a Delete control for each Link in the list.
2. WHEN the User activates the Delete control for a Link, THE Link_Manager SHALL remove that Link from the list permanently.

---

### Requirement 12: Quick Links — Persistence

**User Story:** As a User, I want my quick links to be saved automatically, so that they are present every time I open the Dashboard.

#### Acceptance Criteria

1. WHEN the links list is modified (link added or deleted), THE Link_Manager SHALL serialise the current links list to Storage under a fixed key.
2. WHEN the Dashboard loads, THE Link_Manager SHALL read the links list from Storage and render all previously saved Links.
3. IF no links data exists in Storage, THEN THE Link_Manager SHALL initialise with an empty links list.

---

### Requirement 13: Layout and File Structure

**User Story:** As a developer, I want the codebase to follow a defined file structure, so that the project remains maintainable and easy to understand.

#### Acceptance Criteria

1. THE Dashboard SHALL be delivered as a single `index.html` file at the project root.
2. THE Dashboard SHALL reference exactly one CSS file located at `css/style.css`.
3. THE Dashboard SHALL reference exactly one JavaScript file located at `js/app.js`.
4. THE Dashboard SHALL load and render all four widgets without errors in Chrome, Firefox, Edge, and Safari (current stable releases).

---

### Requirement 14: Performance and Responsiveness

**User Story:** As a User, I want the Dashboard to load instantly and respond to my interactions without noticeable delay, so that it doesn't slow me down.

#### Acceptance Criteria

1. THE Dashboard SHALL complete initial render within 1 second on a modern desktop machine under normal conditions (no external network requests).
2. WHEN the User interacts with any widget control, THE Dashboard SHALL reflect the change in the UI within 100 milliseconds.
3. THE Dashboard SHALL adapt its layout to viewport widths from 320 px to 2560 px without horizontal scrolling or overlapping elements.
