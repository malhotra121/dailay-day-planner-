(() => {
  // DOM Elements
  const planner = document.getElementById('planner');
  const currentDateEl = document.getElementById('currentDate');
  const clearAllBtn = document.getElementById('clearAllBtn');

  // Configuration constants
  const startHour = 8;  // 8 AM
  const endHour = 20;   // 8 PM
  const tasksStorageKey = 'dayPlannerTasks';
  const lastDateKey = 'dayPlannerLastDate';

  // Load saved tasks or create empty object
  let tasks = JSON.parse(localStorage.getItem(tasksStorageKey)) || {};

  /**
   * Format hour (24h) to 12h AM/PM
   * @param {number} h 
   * @returns {string}
   */
  function formatHour(h) {
    const period = h >= 12 ? 'PM' : 'AM';
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12} ${period}`;
  }

  /**
   * Get the current hour in 24h format
   * @returns {number}
   */
  function currentHour() {
    return new Date().getHours();
  }

  /**
   * Format date as a full human-readable string
   * @param {Date} d 
   * @returns {string}
   */
  function formatFullDate(d) {
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Save tasks object to localStorage
   */
  function saveTasks() {
    localStorage.setItem(tasksStorageKey, JSON.stringify(tasks));
  }

  /**
   * Save current date string to localStorage
   * @param {string} dateStr 
   */
  function saveDate(dateStr) {
    localStorage.setItem(lastDateKey, dateStr);
  }

  /**
   * Get saved date string from localStorage
   * @returns {string|null}
   */
  function getSavedDate() {
    return localStorage.getItem(lastDateKey);
  }

  /**
   * Check if the day has changed since last load; reset tasks if so
   */
  function checkDateReset() {
    const todayStr = new Date().toDateString();
    const savedStr = getSavedDate();
    if (savedStr !== todayStr) {
      tasks = {};
      saveTasks();
      saveDate(todayStr);
      buildPlanner();
    }
  }

  /**
   * Create a time block element for a given hour
   * @param {number} hour 
   * @returns {HTMLElement}
   */
  function createTimeBlock(hour) {
    const timeBlock = document.createElement('div');
    timeBlock.classList.add('time-block');

    // Assign past, present, or future class
    const currHour = currentHour();
    if (hour < currHour) timeBlock.classList.add('past');
    else if (hour === currHour) timeBlock.classList.add('present');
    else timeBlock.classList.add('future');

    // Hour label
    const hourLabel = document.createElement('div');
    hourLabel.className = 'hour';
    hourLabel.textContent = formatHour(hour);
    timeBlock.appendChild(hourLabel);

    // Container for tasks and buttons
    const taskContainer = document.createElement('div');
    taskContainer.className = 'task-container';

    // Task input
    const taskInput = document.createElement('input');
    taskInput.type = 'text';
    taskInput.className = 'task-text';
    taskInput.placeholder = 'Add task...';
    taskInput.value = tasks[hour]?.text || '';
    taskInput.readOnly = true;

    // Apply completed style if task is marked completed
    if (tasks[hour]?.completed) {
      taskInput.classList.add('completed');
    }

    // Add/Edit button
    const btnAddEdit = document.createElement('button');
    btnAddEdit.className = 'btn add-task';
    btnAddEdit.title = 'Add or Edit Task';
    btnAddEdit.textContent = taskInput.value.trim() ? 'Edit' : 'Add Task';

    // Save button
    const btnSave = document.createElement('button');
    btnSave.className = 'btn btn-icon save';
    btnSave.title = 'Save Task';
    btnSave.innerHTML = '&#128190;'; // floppy disk icon
    btnSave.style.display = 'none';

    // Delete button
    const btnDelete = document.createElement('button');
    btnDelete.className = 'btn btn-icon delete';
    btnDelete.title = 'Delete Task';
    btnDelete.innerHTML = '&#10006;'; // cross icon

    // Complete toggle button
    const btnComplete = document.createElement('button');
    btnComplete.className = 'btn btn-icon complete';
    btnComplete.title = tasks[hour]?.completed ? 'Mark Incomplete' : 'Mark Complete';
    btnComplete.innerHTML = tasks[hour]?.completed ? '&#9746;' : '&#9744;'; // checked or unchecked box

    // Append to container
    taskContainer.appendChild(taskInput);
    taskContainer.appendChild(btnAddEdit);
    taskContainer.appendChild(btnSave);
    taskContainer.appendChild(btnComplete);
    taskContainer.appendChild(btnDelete);
    timeBlock.appendChild(taskContainer);

    // Event listeners

    // Show input editable on Add/Edit click
    btnAddEdit.addEventListener('click', () => {
      taskInput.readOnly = false;
      taskInput.focus();
      btnAddEdit.style.display = 'none';
      btnSave.style.display = 'inline';
    });

    // Save task on Save button click
    btnSave.addEventListener('click', () => {
      const val = taskInput.value.trim();
      if (val.length > 0) {
        tasks[hour] = tasks[hour] || {};
        tasks[hour].text = val;
      } else {
        if (tasks[hour]) delete tasks[hour];
      }
      taskInput.readOnly = true;
      btnAddEdit.style.display = 'inline';
      btnSave.style.display = 'none';
      btnAddEdit.textContent = val.length > 0 ? 'Edit' : 'Add Task';
      saveTasks();
    });

    // Delete task on Delete button click
    btnDelete.addEventListener('click', () => {
      if (tasks[hour]) {
        delete tasks[hour];
        saveTasks();
      }
      taskInput.value = '';
      taskInput.readOnly = true;
      btnAddEdit.style.display = 'inline';
      btnSave.style.display = 'none';
      btnAddEdit.textContent = 'Add Task';
      taskInput.classList.remove('completed');
      btnComplete.innerHTML = '&#9744;';
      btnComplete.title = 'Mark Complete';
    });

    // Toggle task completion status
    btnComplete.addEventListener('click', () => {
      if (!tasks[hour]) return; // No task to toggle
      tasks[hour].completed = !tasks[hour].completed;
      if (tasks[hour].completed) {
        taskInput.classList.add('completed');
        btnComplete.innerHTML = '&#9746;';
        btnComplete.title = 'Mark Incomplete';
      } else {
        taskInput.classList.remove('completed');
        btnComplete.innerHTML = '&#9744;';
        btnComplete.title = 'Mark Complete';
      }
      saveTasks();
    });

    return timeBlock;
  }

  /**
   * Build the planner's time blocks and add to DOM
   */
  function buildPlanner() {
    // Remove any existing time blocks
    planner.querySelectorAll('.time-block').forEach(el => el.remove());
    // Add hourly time blocks for the defined day period
    for (let h = startHour; h <= endHour; h++) {
      planner.appendChild(createTimeBlock(h));
    }
  }

  /**
   * Refresh the time-block style classes based on current time
   */
  function refreshTimeBlocksClass() {
    const currHour = currentHour();
    planner.querySelectorAll('.time-block').forEach((block, index) => {
      const hour = startHour + index;
      block.classList.remove('past', 'present', 'future');
      if (hour < currHour) block.classList.add('past');
      else if (hour === currHour) block.classList.add('present');
      else block.classList.add('future');
    });
  }

  // Clear All Tasks button event handler
  clearAllBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all tasks?')) {
      tasks = {};
      saveTasks();
      buildPlanner();
    }
  });

  /**
   * Initialize the planner app on page load
   */
  function init() {
    checkDateReset(); // Reset tasks if day changed
    currentDateEl.textContent = formatFullDate(new Date());
    buildPlanner();
    // Refresh every minute
    setInterval(() => {
      refreshTimeBlocksClass();
      checkDateReset();
    }, 60000);
  }

  // Start app
  init();
})();
