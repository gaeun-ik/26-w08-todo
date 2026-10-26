const STORAGE_KEY = "today-todo-items-v1";
const IMPORTANCE_LABELS = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const importanceSelect = document.querySelector("#importance-select");
const inputCounter = document.querySelector("#input-counter");
const activeList = document.querySelector("#active-list");
const completedList = document.querySelector("#completed-list");
const activeGroup = document.querySelector("#active-group");
const completedGroup = document.querySelector("#completed-group");
const activeCount = document.querySelector("#active-count");
const completedCount = document.querySelector("#completed-count");
const emptyState = document.querySelector("#empty-state");
const noResults = document.querySelector("#no-results");
const progressValue = document.querySelector("#progress-value");
const progressCaption = document.querySelector("#progress-caption");
const progressBar = document.querySelector("#progress-bar");
const progressTrack = document.querySelector(".progress-track");
const statusMessage = document.querySelector("#status-message");
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const taskLists = [activeList, completedList];

let todos = loadTodos();
let activeFilter = "all";

function loadTodos() {
  try {
    const savedTodos = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(savedTodos)) return [];

    return savedTodos
      .filter((todo) => todo && typeof todo.id === "string" && typeof todo.text === "string")
      .map((todo) => ({
        id: todo.id,
        text: todo.text.slice(0, 50),
        completed: todo.completed === true,
        importance: Object.hasOwn(IMPORTANCE_LABELS, todo.importance) ? todo.importance : "medium",
      }));
  } catch {
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    return true;
  } catch {
    announce("브라우저 저장 공간에 저장하지 못했어요.");
    return false;
  }
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function announce(message) {
  statusMessage.textContent = message;
}

function createTaskElement(todo) {
  const item = document.createElement("li");
  item.className = `task-item${todo.completed ? " is-completed" : ""}`;

  const checkbox = document.createElement("input");
  checkbox.className = "form-check-input task-check";
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.dataset.action = "toggle";
  checkbox.dataset.id = todo.id;
  checkbox.setAttribute("aria-label", `${todo.text} 완료 여부`);

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = todo.text;

  const importance = document.createElement("span");
  importance.className = `importance-badge importance-${todo.importance}`;
  importance.textContent = IMPORTANCE_LABELS[todo.importance];

  const deleteButton = document.createElement("button");
  deleteButton.className = "btn delete-button";
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";
  deleteButton.dataset.id = todo.id;
  deleteButton.textContent = "삭제";
  deleteButton.setAttribute("aria-label", `${todo.text} 삭제`);

  item.append(checkbox, text, importance, deleteButton);
  return item;
}

function updateProgress() {
  const completed = todos.filter((todo) => todo.completed).length;
  const total = todos.length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  progressValue.textContent = `${percentage}%`;
  progressCaption.textContent = `${total}개 중 ${completed}개 완료`;
  progressBar.style.width = `${percentage}%`;
  progressTrack.setAttribute("aria-valuenow", String(percentage));
}

function render() {
  const visibleTodos = todos.filter((todo) => {
    if (activeFilter === "active") return !todo.completed;
    if (activeFilter === "completed") return todo.completed;
    return true;
  });
  const activeTodos = visibleTodos.filter((todo) => !todo.completed);
  const completedTodos = visibleTodos.filter((todo) => todo.completed);

  activeList.replaceChildren(...activeTodos.map(createTaskElement));
  completedList.replaceChildren(...completedTodos.map(createTaskElement));
  activeCount.textContent = String(activeTodos.length);
  completedCount.textContent = String(completedTodos.length);

  const isCompletelyEmpty = todos.length === 0;
  emptyState.hidden = !isCompletelyEmpty;
  noResults.hidden = isCompletelyEmpty || visibleTodos.length > 0;
  activeGroup.hidden = isCompletelyEmpty || activeTodos.length === 0;
  completedGroup.hidden = isCompletelyEmpty || completedTodos.length === 0;

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === activeFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  updateProgress();
}

function handleSubmit(event) {
  event.preventDefault();
  const text = todoInput.value.trim();
  if (!text) {
    todoInput.focus();
    return;
  }

  todos.unshift({
    id: createId(),
    text: text.slice(0, 50),
    completed: false,
    importance: importanceSelect.value,
  });

  todoInput.value = "";
  inputCounter.textContent = "0 / 50";
  activeFilter = "all";
  saveTodos();
  render();
  todoInput.focus();
  announce("할 일을 추가했어요.");
}

function handleTaskChange(event) {
  const checkbox = event.target.closest('[data-action="toggle"]');
  if (!checkbox) return;

  const todo = todos.find((item) => item.id === checkbox.dataset.id);
  if (!todo) return;

  todo.completed = checkbox.checked;
  saveTodos();
  render();
  announce(todo.completed ? "할 일을 완료했어요." : "할 일을 진행 중으로 바꿨어요.");
}

function handleTaskClick(event) {
  const deleteButton = event.target.closest('[data-action="delete"]');
  if (!deleteButton) return;

  todos = todos.filter((todo) => todo.id !== deleteButton.dataset.id);
  saveTodos();
  render();
  announce("할 일을 삭제했어요.");
}

function setTodayDate() {
  const date = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());
  document.querySelector("#today-date").textContent = date;
}

todoForm.addEventListener("submit", handleSubmit);
todoInput.addEventListener("input", () => {
  inputCounter.textContent = `${todoInput.value.length} / 50`;
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    render();
  });
});

taskLists.forEach((list) => {
  list.addEventListener("change", handleTaskChange);
  list.addEventListener("click", handleTaskClick);
});

setTodayDate();
render();