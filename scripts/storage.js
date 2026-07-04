/**
 * FocusFlow – localStorage yardımcıları
 * Tüm uygulama verisi istemci tarafında saklanır.
 */

const Storage = {
  PREFIX: 'focusflow_',

  /**
   * Veriyi localStorage'a kaydet
   */
  set(key, value) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage yazma hatası:', e);
    }
  },

  /**
   * localStorage'dan veri oku
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      return item !== null ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn('localStorage okuma hatası:', e);
      return defaultValue;
    }
  },

  /**
   * Belirli bir anahtarı sil
   */
  remove(key) {
    localStorage.removeItem(this.PREFIX + key);
  },

  /**
   * Tüm FocusFlow verilerini sil
   */
  clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.PREFIX))
      .forEach(k => localStorage.removeItem(k));
  }
};

/** Varsayılan pomodoro süreleri (dakika) */
const DEFAULT_DURATIONS = {
  work: 25,
  shortBreak: 5,
  longBreak: 15
};

/** Varsayılan uygulama durumu */
const DEFAULT_STATE = {
  theme: 'light',
  dailyGoal: 8,
  durations: { ...DEFAULT_DURATIONS },
  tasks: [],
  stats: {
    todayPomodoros: 0,
    todayFocusMinutes: 0,
    todayCompletedTasks: 0,
    totalPomodoros: 0,
    streak: 0,
    lastActiveDate: null
  },
  timer: {
    mode: 'work',       // work | shortBreak | longBreak
    remaining: 25 * 60, // saniye
    isRunning: false,
    completedWorkSessions: 0,
    startedAt: null
  }
};

/**
 * Uygulama durumunu yükle veya varsayılanları döndür
 */
function loadAppState() {
  const saved = Storage.get('state', {});
  const durations = { ...DEFAULT_DURATIONS, ...saved.durations };

  return {
    ...DEFAULT_STATE,
    ...saved,
    durations,
    stats: { ...DEFAULT_STATE.stats, ...saved.stats },
    timer: { ...DEFAULT_STATE.timer, ...saved.timer }
  };
}

/**
 * Uygulama durumunu kaydet
 */
function saveAppState(state) {
  Storage.set('state', state);
}

/**
 * Bugünün tarihini YYYY-MM-DD formatında döndür
 */
function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Gün değişimini kontrol et, istatistikleri sıfırla
 */
function checkDayReset(stats) {
  const today = getTodayKey();
  if (stats.lastActiveDate !== today) {
    const yesterday = stats.lastActiveDate;
    const yesterdayDate = yesterday ? new Date(yesterday) : null;
    const todayDate = new Date(today);
    
    // Streak hesabı: dün aktifse +1, değilse sıfırla
    let streak = stats.streak || 0;
    if (yesterday) {
      const diffDays = Math.floor((todayDate - yesterdayDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1 && stats.todayPomodoros > 0) {
        streak += 1;
      } else if (diffDays > 1) {
        streak = 0;
      }
    }

    return {
      ...stats,
      todayPomodoros: 0,
      todayFocusMinutes: 0,
      todayCompletedTasks: 0,
      streak,
      lastActiveDate: today
    };
  }
  return stats;
}
