/**
 * FocusFlow – İstatistikler
 */

const Stats = {
  init() {
    this.render();
  },

  render() {
    const { stats, dailyGoal } = App.state;
    const remaining = Math.max(0, dailyGoal - stats.todayPomodoros);
    const percent = dailyGoal > 0 ? Math.min(100, Math.round((stats.todayPomodoros / dailyGoal) * 100)) : 0;

    this.set('stat-today-pomodoros', stats.todayPomodoros);
    this.set('stat-focus-time', `${stats.todayFocusMinutes} dk`);
    this.set('stat-completed-tasks', stats.todayCompletedTasks);
    this.set('stat-streak', `${stats.streak} gün`);
    this.set('stat-total-pomodoros', stats.totalPomodoros);
    this.set('stat-remaining-goal', remaining);
    this.set('stat-goal-percent', `%${percent}`);

    const bar = document.getElementById('stat-goal-bar');
    if (bar) bar.style.width = `${percent}%`;

    const goalText = document.getElementById('stat-goal-text');
    if (goalText) goalText.textContent = `${stats.todayPomodoros} / ${dailyGoal} Pomodoro`;

    const goalCard = document.getElementById('stats-goal-card');
    if (goalCard) {
      goalCard.classList.toggle('goal-completed', stats.todayPomodoros >= dailyGoal && dailyGoal > 0);
    }
  },

  set(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }
};
