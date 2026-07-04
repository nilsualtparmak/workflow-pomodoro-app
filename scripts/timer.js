/**
 * FocusFlow – Pomodoro Zamanlayıcı
 */

const TIMER_DURATIONS = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60
};

const MODE_LABELS = {
  work: 'Çalışma',
  shortBreak: 'Kısa Mola',
  longBreak: 'Uzun Mola'
};

const CIRCUMFERENCE = 2 * Math.PI * 130;

const Timer = {
  intervalId: null,
  ringProgress: null,
  onUpdate: null,

  init(onUpdate) {
    this.onUpdate = onUpdate;
    this.ringProgress = document.getElementById('timer-ring-progress');
    this.bindEvents();
    this.restoreTimer();
    this.render();
  },

  bindEvents() {
    document.querySelectorAll('.timer-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (App.state.timer.isRunning) return;
        this.setMode(btn.dataset.mode);
      });
    });

    document.getElementById('timer-start-btn')?.addEventListener('click', () => this.toggle());
    document.getElementById('timer-reset-btn')?.addEventListener('click', () => this.reset());
    document.getElementById('timer-skip-btn')?.addEventListener('click', () => this.skip());
    document.getElementById('session-modal-btn')?.addEventListener('click', () => this.closeSessionModal());
    document.querySelector('.session-modal__backdrop')?.addEventListener('click', () => this.closeSessionModal());
  },

  restoreTimer() {
    const timer = App.state.timer;
    if (timer.isRunning && timer.startedAt) {
      const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000);
      timer.remaining = Math.max(0, timer.remaining - elapsed);
      if (timer.remaining <= 0) {
        this.completeSession(false);
      } else {
        this.startInterval();
      }
    }
  },

  getDuration(mode) {
    return TIMER_DURATIONS[mode] || TIMER_DURATIONS.work;
  },

  setMode(mode, resetTime = true) {
    const timer = App.state.timer;
    timer.mode = mode;
    if (resetTime) {
      timer.remaining = this.getDuration(mode);
      timer.isRunning = false;
      timer.startedAt = null;
      this.stopInterval();
    }
    this.updateModeButtons();
    this.save();
    this.render();
    this.onUpdate?.();
  },

  updateModeButtons() {
    document.querySelectorAll('.timer-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === App.state.timer.mode);
      btn.setAttribute('aria-pressed', btn.dataset.mode === App.state.timer.mode);
    });

    const wrapper = document.getElementById('timer-ring-wrapper');
    if (wrapper) wrapper.dataset.mode = App.state.timer.mode;
  },

  toggle() {
    const timer = App.state.timer;
    if (timer.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  },

  start() {
    const timer = App.state.timer;
    timer.isRunning = true;
    timer.startedAt = Date.now();
    this.startInterval();
    this.save();
    this.render();
    this.onUpdate?.();
  },

  pause() {
    const timer = App.state.timer;
    timer.isRunning = false;
    timer.startedAt = null;
    this.stopInterval();
    this.save();
    this.render();
    this.onUpdate?.();
  },

  reset() {
    const timer = App.state.timer;
    timer.remaining = this.getDuration(timer.mode);
    timer.isRunning = false;
    timer.startedAt = null;
    this.stopInterval();
    this.save();
    this.render();
    this.onUpdate?.();
    showToast('Zamanlayıcı sıfırlandı.', 'info');
  },

  skip() {
    this.stopInterval();
    App.state.timer.isRunning = false;
    App.state.timer.startedAt = null;
    this.completeSession(true);
  },

  startInterval() {
    this.stopInterval();
    this.intervalId = setInterval(() => this.tick(), 1000);
  },

  stopInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },

  tick() {
    const timer = App.state.timer;
    if (timer.remaining <= 0) {
      this.completeSession(false);
      return;
    }
    timer.remaining--;
    if (timer.remaining % 5 === 0) this.save();
    this.render();
    this.onUpdate?.();
  },

  completeSession(skipped) {
    this.stopInterval();
    const timer = App.state.timer;
    const wasWork = timer.mode === 'work';

    let goalReached = false;
    if (wasWork && !skipped) {
      goalReached = this.recordWorkSession();
    }

    const messages = {
      work: { icon: '🎉', title: 'Harika iş!', desc: 'Çalışma oturumu tamamlandı. Mola zamanı!' },
      shortBreak: { icon: '☕', title: 'Mola bitti!', desc: 'Yeni bir çalışma oturumuna hazırsın.' },
      longBreak: { icon: '🌟', title: 'Uzun mola bitti!', desc: 'Enerjin tazelendi, devam edelim!' }
    };

    if (skipped) {
      showToast('Oturum atlandı.', 'info');
    } else if (!goalReached) {
      const msg = messages[timer.mode];
      this.showSessionModal(msg.icon, msg.title, msg.desc);
      NotificationHelper.notify(msg.title, msg.desc);
      SoundHelper.playComplete();
    }

    this.switchToNextMode(wasWork && !skipped);
    this.save();
    this.render();
    this.onUpdate?.();
  },

  recordWorkSession() {
    const stats = App.state.stats;
    stats.todayPomodoros++;
    stats.todayFocusMinutes += 25;
    stats.totalPomodoros++;
    stats.lastActiveDate = getTodayKey();

    App.state.timer.completedWorkSessions =
      (App.state.timer.completedWorkSessions % 4) + 1;

    const { dailyGoal } = App.state;
    const justReachedGoal = stats.todayPomodoros === dailyGoal;

    if (justReachedGoal) {
      Confetti.fire();
      this.showSessionModal('🏆', 'Günlük Hedef Tamamlandı!', `${dailyGoal} pomodoro hedefine ulaştın. Tebrikler!`);
      NotificationHelper.notify('Günlük Hedef Tamamlandı!', `${dailyGoal} pomodoro hedefine ulaştın!`);
      SoundHelper.playComplete();
      showToast('Günlük hedefin tamamlandı! 🎉', 'success');
    }

    saveAppState(App.state);
    Stats.render();
    return justReachedGoal;
  },

  switchToNextMode(completedWork) {
    const timer = App.state.timer;
    if (timer.mode === 'work') {
      if (timer.completedWorkSessions >= 4) {
        timer.completedWorkSessions = 0;
        timer.mode = 'longBreak';
      } else {
        timer.mode = 'shortBreak';
      }
    } else {
      timer.mode = 'work';
    }
    timer.remaining = this.getDuration(timer.mode);
    timer.isRunning = false;
    timer.startedAt = null;
    this.updateModeButtons();
  },

  showSessionModal(icon, title, desc) {
    const modal = document.getElementById('session-modal');
    if (!modal) return;
    document.getElementById('session-modal-icon').textContent = icon;
    document.getElementById('session-modal-title').textContent = title;
    document.getElementById('session-modal-desc').textContent = desc;
    modal.hidden = false;
  },

  closeSessionModal() {
    const modal = document.getElementById('session-modal');
    if (modal) modal.hidden = true;
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  render() {
    const timer = App.state.timer;
    const duration = this.getDuration(timer.mode);
    const progress = duration > 0 ? timer.remaining / duration : 0;
    const offset = CIRCUMFERENCE * (1 - progress);

    if (this.ringProgress) {
      this.ringProgress.style.strokeDashoffset = offset;
    }

    const timeEl = document.getElementById('timer-time');
    if (timeEl) timeEl.textContent = this.formatTime(timer.remaining);

    const modeEl = document.getElementById('timer-mode-label');
    if (modeEl) modeEl.textContent = MODE_LABELS[timer.mode];

    const sessionEl = document.getElementById('timer-session-info');
    if (sessionEl) {
      sessionEl.textContent = `Oturum ${timer.completedWorkSessions || 0} / 4`;
    }

    const startBtn = document.getElementById('timer-start-btn');
    if (startBtn) {
      startBtn.textContent = timer.isRunning ? 'Duraklat' : (timer.remaining < duration ? 'Devam Et' : 'Başlat');
      startBtn.setAttribute('aria-label', timer.isRunning ? 'Zamanlayıcıyı duraklat' : 'Zamanlayıcıyı başlat');
    }

    const wrapper = document.getElementById('timer-ring-wrapper');
    if (wrapper) {
      wrapper.classList.toggle('is-running', timer.isRunning);
      wrapper.dataset.mode = timer.mode;
    }

    this.updateModeButtons();
    this.renderSessionDots();
    this.updateDashboardPreview();
  },

  renderSessionDots() {
    const container = document.getElementById('session-dots');
    if (!container) return;
    const completed = App.state.timer.completedWorkSessions;
    container.innerHTML = Array.from({ length: 4 }, (_, i) =>
      `<span class="session-dot${i < completed ? ' completed' : ''}" aria-hidden="true"></span>`
    ).join('');
  },

  updateDashboardPreview() {
    const timer = App.state.timer;
    const preview = document.getElementById('dashboard-timer-preview');
    if (!preview) return;

    preview.querySelector('.timer-preview__mode').textContent = MODE_LABELS[timer.mode];
    preview.querySelector('.timer-preview__time').textContent = this.formatTime(timer.remaining);
    preview.querySelector('.timer-preview__status').textContent =
      timer.isRunning ? 'Çalışıyor...' : 'Hazır';
  },

  save() {
    saveAppState(App.state);
  }
};
