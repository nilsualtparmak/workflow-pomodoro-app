/**
 * FocusFlow – Görev Yöneticisi
 */

const PRIORITY_LABELS = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek'
};

const TaskManager = {
  filter: 'all',
  editingId: null,
  dragId: null,

  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    document.getElementById('add-task-btn')?.addEventListener('click', () => this.openModal());
    document.getElementById('task-modal-close')?.addEventListener('click', () => this.closeModal());
    document.getElementById('task-modal-cancel')?.addEventListener('click', () => this.closeModal());
    document.querySelector('#task-modal .modal__backdrop')?.addEventListener('click', () => this.closeModal());
    document.getElementById('task-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveTask();
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filter = btn.dataset.filter;
        document.querySelectorAll('.filter-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.filter === this.filter)
        );
        this.render();
      });
    });
  },

  generateId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  },

  getFilteredTasks() {
    const tasks = [...App.state.tasks].sort((a, b) => a.order - b.order);
    switch (this.filter) {
      case 'active': return tasks.filter(t => !t.completed);
      case 'completed': return tasks.filter(t => t.completed);
      default: return tasks;
    }
  },

  getNextTask() {
    return App.state.tasks
      .filter(t => !t.completed)
      .sort((a, b) => a.order - b.order)[0] || null;
  },

  openModal(taskId = null) {
    this.editingId = taskId;
    const modal = document.getElementById('task-modal');
    const title = document.getElementById('task-modal-title');
    const form = document.getElementById('task-form');

    if (taskId) {
      const task = App.state.tasks.find(t => t.id === taskId);
      if (!task) return;
      title.textContent = 'Görevi Düzenle';
      form.title.value = task.title;
      form.priority.value = task.priority;
      form.pomodoros.value = task.estimatedPomodoros || 1;
      form.notes.value = task.notes || '';
    } else {
      title.textContent = 'Yeni Görev';
      form.reset();
      form.pomodoros.value = 1;
      form.priority.value = 'medium';
    }

    modal.hidden = false;
    form.title.focus();
  },

  closeModal() {
    document.getElementById('task-modal').hidden = true;
    this.editingId = null;
  },

  saveTask() {
    const form = document.getElementById('task-form');
    const title = form.title.value.trim();
    if (!title) return;

    const taskData = {
      title,
      priority: form.priority.value,
      estimatedPomodoros: Math.max(1, parseInt(form.pomodoros.value) || 1),
      notes: form.notes.value.trim()
    };

    if (this.editingId) {
      const task = App.state.tasks.find(t => t.id === this.editingId);
      if (task) Object.assign(task, taskData);
      showToast('Görev güncellendi.', 'success');
    } else {
      const maxOrder = App.state.tasks.reduce((max, t) => Math.max(max, t.order), -1);
      App.state.tasks.push({
        id: this.generateId(),
        ...taskData,
        completed: false,
        order: maxOrder + 1,
        createdAt: Date.now()
      });
      showToast('Görev eklendi.', 'success');
    }

    saveAppState(App.state);
    this.closeModal();
    this.render();
    App.updateDashboard();
  },

  toggleComplete(id) {
    const task = App.state.tasks.find(t => t.id === id);
    if (!task) return;

    const wasCompleted = task.completed;
    task.completed = !task.completed;

    if (task.completed && !wasCompleted) {
      App.state.stats.todayCompletedTasks++;
      App.state.stats.lastActiveDate = getTodayKey();
    } else if (!task.completed && wasCompleted) {
      App.state.stats.todayCompletedTasks = Math.max(0, App.state.stats.todayCompletedTasks - 1);
    }

    saveAppState(App.state);
    this.render();
    App.updateDashboard();
    Stats.render();

    const el = document.querySelector(`[data-task-id="${id}"]`);
    if (el && task.completed) {
      el.classList.add('just-completed');
      setTimeout(() => el.classList.remove('just-completed'), 400);
    }
  },

  deleteTask(id) {
    App.state.tasks = App.state.tasks.filter(t => t.id !== id);
    saveAppState(App.state);
    this.render();
    App.updateDashboard();
    showToast('Görev silindi.', 'info');
  },

  render() {
    const list = document.getElementById('task-list');
    const empty = document.getElementById('tasks-empty');
    if (!list) return;

    const tasks = this.getFilteredTasks();

    if (tasks.length === 0) {
      list.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }

    if (empty) empty.hidden = true;

    list.innerHTML = tasks.map(task => this.renderTaskItem(task)).join('');
    this.bindTaskEvents(list);
    this.updateNextTaskDashboard();
  },

  renderTaskItem(task) {
    return `
      <li
        class="task-item${task.completed ? ' completed' : ''}"
        data-task-id="${task.id}"
        draggable="true"
        role="listitem"
      >
        <span class="task-item__drag" aria-label="Sürükleyerek sırala" title="Sürükle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
          </svg>
        </span>
        <button
          class="task-item__check"
          aria-label="${task.completed ? 'Tamamlanmadı olarak işaretle' : 'Tamamlandı olarak işaretle'}"
          data-action="toggle"
        >
          ${task.completed ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
        </button>
        <div class="task-item__body">
          <div class="task-item__title">${this.escapeHtml(task.title)}</div>
          <div class="task-item__meta">
            <span class="task-item__priority task-item__priority--${task.priority}">${PRIORITY_LABELS[task.priority]}</span>
            <span class="task-item__pomodoros">🍅 ${task.estimatedPomodoros}</span>
          </div>
          ${task.notes ? `<p class="task-item__notes">${this.escapeHtml(task.notes)}</p>` : ''}
        </div>
        <div class="task-item__actions">
          <button class="btn btn--icon btn--ghost" data-action="edit" aria-label="Düzenle" title="Düzenle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn--icon btn--ghost btn--danger" data-action="delete" aria-label="Sil" title="Sil">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </li>
    `;
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  bindTaskEvents(list) {
    list.querySelectorAll('.task-item').forEach(item => {
      const id = item.dataset.taskId;

      item.querySelector('[data-action="toggle"]')?.addEventListener('click', () => this.toggleComplete(id));
      item.querySelector('[data-action="edit"]')?.addEventListener('click', () => this.openModal(id));
      item.querySelector('[data-action="delete"]')?.addEventListener('click', () => this.deleteTask(id));

      item.addEventListener('dragstart', (e) => {
        this.dragId = id;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        list.querySelectorAll('.task-item').forEach(el => el.classList.remove('drag-over'));
        this.dragId = null;
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (this.dragId && this.dragId !== id) {
          item.classList.add('drag-over');
        }
      });

      item.addEventListener('dragleave', () => item.classList.remove('drag-over'));

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        if (this.dragId && this.dragId !== id) {
          this.reorder(this.dragId, id);
        }
      });
    });
  },

  reorder(fromId, toId) {
    const tasks = [...App.state.tasks].sort((a, b) => a.order - b.order);
    const fromIndex = tasks.findIndex(t => t.id === fromId);
    const toIndex = tasks.findIndex(t => t.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = tasks.splice(fromIndex, 1);
    tasks.splice(toIndex, 0, moved);
    tasks.forEach((t, i) => { t.order = i; });

    App.state.tasks = tasks;
    saveAppState(App.state);
    this.render();
  },

  updateNextTaskDashboard() {
    const container = document.getElementById('dashboard-next-task');
    if (!container) return;

    const next = this.getNextTask();
    if (!next) {
      container.innerHTML = `
        <span class="empty-state__icon">📋</span>
        <p>Henüz görev yok. İlk görevinizi ekleyin!</p>
      `;
      container.className = 'empty-state';
      return;
    }

    container.className = 'next-task-card';
    container.innerHTML = `
      <span class="next-task-card__priority task-item__priority task-item__priority--${next.priority}">${PRIORITY_LABELS[next.priority]}</span>
      <div class="next-task-card__info">
        <h3>${this.escapeHtml(next.title)}</h3>
        <p>🍅 ${next.estimatedPomodoros} pomodoro tahmini</p>
      </div>
    `;
  }
};
