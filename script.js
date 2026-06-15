// DOM Elements
const todoInput = document.getElementById('todoInput');
const todoDate = document.getElementById('todoDate');
const todoPriority = document.getElementById('todoPriority');
const todoCategory = document.getElementById('todoCategory');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const filterBtns = document.querySelectorAll('.filter-btn');
const priorityFilters = document.querySelectorAll('.priority-filter');
const searchInput = document.getElementById('searchInput');
const sortBy = document.getElementById('sortBy');
const darkModeToggle = document.getElementById('darkModeToggle');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const clearAllBtn = document.getElementById('clearAllBtn');

// Stats Elements
const totalStats = document.getElementById('totalStats');
const completedStats = document.getElementById('completedStats');
const pendingStats = document.getElementById('pendingStats');
const percentStats = document.getElementById('percentStats');

// Initialize
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let currentFilter = 'all';
let currentPriorityFilter = 'all';
let searchTerm = '';
let currentSort = 'date-added';
let darkMode = JSON.parse(localStorage.getItem('darkMode')) || false;

// Initialize Dark Mode
if (darkMode) {
    document.body.classList.add('dark-mode');
    darkModeToggle.textContent = '☀️ Light Mode';
}

// Event Listeners
addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => e.key === 'Enter' && addTodo());
darkModeToggle.addEventListener('click', toggleDarkMode);
searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase();
    renderTodos();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTodos();
    });
});

priorityFilters.forEach(btn => {
    btn.addEventListener('click', () => {
        priorityFilters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPriorityFilter = btn.dataset.priority;
        renderTodos();
    });
});

sortBy.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderTodos();
});

exportBtn.addEventListener('click', exportTodos);
importBtn.addEventListener('click', () => document.getElementById('fileInput')?.click());
clearAllBtn.addEventListener('click', () => {
    if (confirm('Delete all todos? This cannot be undone!')) {
        todos = [];
        saveTodos();
        renderTodos();
    }
});

// Add Todo
function addTodo() {
    const text = todoInput.value.trim();
    if (!text) {
        alert('Please enter a todo!');
        return;
    }

    const todo = {
        id: Date.now(),
        text: text,
        dueDate: todoDate.value,
        priority: todoPriority.value,
        category: todoCategory.value || 'General',
        completed: false,
        createdAt: new Date().toISOString()
    };

    todos.push(todo);
    todoInput.value = '';
    todoDate.value = '';
    todoPriority.value = 'medium';
    todoCategory.value = '';
    
    saveTodos();
    renderTodos();
}

// Delete Todo
function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
}

// Toggle Todo Complete
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
    }
}

// Edit Todo
function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const newText = prompt('Edit todo:', todo.text);
    if (newText === null) return;

    if (newText.trim()) {
        todo.text = newText.trim();
        saveTodos();
        renderTodos();
    }
}

// Render Todos
function renderTodos() {
    todoList.innerHTML = '';

    let filteredTodos = todos.filter(todo => {
        // Status Filter
        if (currentFilter === 'active' && todo.completed) return false;
        if (currentFilter === 'completed' && !todo.completed) return false;

        // Priority Filter
        if (currentPriorityFilter !== 'all' && todo.priority !== currentPriorityFilter) return false;

        // Search Filter
        if (searchTerm && !todo.text.toLowerCase().includes(searchTerm)) return false;

        return true;
    });

    // Sorting
    filteredTodos.sort((a, b) => {
        switch (currentSort) {
            case 'priority':
                const priorityOrder = { high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            case 'due-date':
                return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
            case 'alphabetical':
                return a.text.localeCompare(b.text);
            case 'date-added':
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });

    if (filteredTodos.length === 0) {
        todoList.innerHTML = '<li class="todo-item"><p style="color: #999; margin: auto;">No todos found! 🎉</p></li>';
        updateStats();
        return;
    }

    filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;
        
        li.className = `todo-item ${todo.completed ? 'completed' : ''} ${todo.priority}`;
        
        const dueDateDisplay = todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : 'No date';
        
        li.innerHTML = `
            <input 
                type="checkbox" 
                class="todo-checkbox" 
                ${todo.completed ? 'checked' : ''}
                onchange="toggleTodo(${todo.id})"
            >
            <div class="todo-content">
                <div class="todo-text">${escapeHtml(todo.text)}</div>
                <div class="todo-meta">
                    <span class="todo-date-display ${isOverdue ? 'overdue' : ''}">
                        📅 ${dueDateDisplay} ${isOverdue ? '⚠️ OVERDUE' : ''}
                    </span>
                    <span class="todo-category-tag">${escapeHtml(todo.category)}</span>
                    <span class="todo-priority-badge priority-badge-${todo.priority}">${todo.priority.toUpperCase()}</span>
                </div>
            </div>
            <div class="todo-actions">
                <button class="edit-btn" onclick="editTodo(${todo.id})">✏️ Edit</button>
                <button class="delete-btn" onclick="deleteTodo(${todo.id})">🗑️ Delete</button>
            </div>
        `;
        
        todoList.appendChild(li);
    });

    updateStats();
}

// Update Statistics
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    totalStats.textContent = total;
    completedStats.textContent = completed;
    pendingStats.textContent = pending;
    percentStats.textContent = percent + '%';
}

// Dark Mode Toggle
function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    darkModeToggle.textContent = darkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
}

// Export Todos
function exportTodos() {
    const dataStr = JSON.stringify(todos, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Import Todos
function importTodos(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedTodos = JSON.parse(e.target.result);
            if (Array.isArray(importedTodos)) {
                todos = importedTodos;
                saveTodos();
                renderTodos();
                alert('Todos imported successfully!');
            }
        } catch (error) {
            alert('Error importing file!');
        }
    };
    reader.readAsText(file);
}

// Create hidden file input for import
const fileInput = document.createElement('input');
fileInput.id = 'fileInput';
fileInput.type = 'file';
fileInput.accept = '.json';
fileInput.style.display = 'none';
fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        importTodos(e.target.files[0]);
    }
});
document.body.appendChild(fileInput);

// Save Todos to LocalStorage
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Escape HTML
function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Initial render
renderTodos();
