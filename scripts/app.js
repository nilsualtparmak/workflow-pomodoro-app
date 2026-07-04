/**
 * FocusFlow – Ana uygulama başlatıcı
 */

const App = {
  state: null,
  goalCelebrated: false,

  init() {
    this.state = loadAppState();
    this.state.stats = checkDayReset(this.state.stats);
    saveAppState(this.state);

    ThemeManager.init();
    Navigation.init();
    Quotes.init();
    Confetti.init();

    this.setupGreeting();
    this.setupDailyGoal();
    this.setupNotifications();
    this.setupKeyboardShortcuts();

    Timer.init(() => {
      this.updateDashboard();
      Stats.render();
    });

    TaskManager.init();
    Stats.init();

    this.hideLoadingScreen();
  },

  setupGreeting() {
    const el = document.getElementById('dashboard-greeting');
    if (!el) return;

    const hour = new Date().getHours();
    let greeting = 'Merhaba!';
    if (hour < 12) greeting = 'Günaydın!';
    else if (hour < 18) greeting = 'İyi günler!';
    else greeting = 'İyi akşamlar!';

    el.textContent = `${greeting} Bugün harika bir gün.`;
  },

  setupDailyGoal() {
    const input = document.getElementById('daily-goal-input');
    if (!input) return;

    input.value = this.state.dailyGoal;

    input.addEventListener('change', () => {
      const value = Math.max(1, Math.min(50, parseInt(input.value) || 8));
      input.value = value;
      this.state.dailyGoal = value;
      this.goalCelebrated = false;
      saveAppState(this.state);
      this.updateDashboard();
      Stats.render();
    });
  },

  setupNotifications() {
    const btn = document.getElementById('enable-notifications');
    if (!btn) return;

    if ('Notification' in window && Notification.permission === 'granted') {
      btn.textContent = 'Bildirimler Etkin ✓';
      btn.disabled = true;
    }

    btn.addEventListener('click', async () => {
      if (!('Notification' in window)) {
        showToast('Tarayıcınız bildirimleri desteklemiyor.', 'info');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        btn.textContent = 'Bildirimler Etkin ✓';
        btn.disabled = true;
        showToast('Bildirimler etkinleştirildi!', 'success');
      }
    });
  },

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.getElementById('session-modal').hidden = true;
        document.getElementById('task-modal').hidden = true;
        TaskManager.editingId = null;
        return;
      }

      if (this.isTyping(e.target)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (Navigation.currentView === 'timer') {
          Timer.toggle();
        } else {
          Navigation.navigateTo('timer');
          Timer.toggle();
        }
      }

      if (e.key === 'r' || e.key === 'R') {
        if (Navigation.currentView === 'timer') {
          Timer.reset();
        }
      }

      if (e.key === 'n' || e.key === 'N') {
        Navigation.navigateTo('tasks');
        TaskManager.openModal();
      }
    });
  },

  isTyping(el) {
    const tag = el?.tagName?.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el?.isContentEditable;
  },

  updateDashboard() {
    const { stats, dailyGoal } = this.state;
    const remaining = Math.max(0, dailyGoal - stats.todayPomodoros);
    const percent = dailyGoal > 0 ? Math.min(100, Math.round((stats.todayPomodoros / dailyGoal) * 100)) : 0;

    this.setText('dash-focus-time', `${stats.todayFocusMinutes} dk`);
    this.setText('dash-pomodoros', stats.todayPomodoros);
    this.setText('dash-remaining-goal', remaining);
    this.setText('dash-completed-tasks', stats.todayCompletedTasks);
    this.setText('dash-goal-text', `${stats.todayPomodoros} / ${dailyGoal} Pomodoro`);
    this.setText('dash-goal-percent', `%${percent}`);

    const progressBar = document.getElementById('dash-goal-progress');
    if (progressBar) progressBar.style.width = `${percent}%`;

    const goalCard = document.querySelector('.daily-goal-card');
    if (goalCard) {
      goalCard.classList.toggle('goal-completed', stats.todayPomodoros >= dailyGoal && dailyGoal > 0);
    }

    TaskManager.updateNextTaskDashboard();
    Timer.updateDashboardPreview();
    Stats.render();
  },

  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  },

  hideLoadingScreen() {
    const loading = document.getElementById('loading-screen');
    const app = document.getElementById('app');

    setTimeout(() => {
      loading.classList.add('hidden');
      app.hidden = false;
      this.updateDashboard();
    }, 600);
  }
};

/** Toast bildirimi göster */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

document.addEventListener('DOMContentLoaded', () => App.init());

// Sayfa kapatılırken zamanlayıcı durumunu kaydet
window.addEventListener('beforeunload', () => {
  if (App.state) saveAppState(App.state);
});

// Sekme gizlendiğinde kaydet
document.addEventListener('visibilitychange', () => {
  if (document.hidden && App.state) saveAppState(App.state);
});
