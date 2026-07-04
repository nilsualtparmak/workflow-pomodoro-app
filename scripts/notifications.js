/**
 * FocusFlow – Bildirim yardımcıları
 */

const NotificationHelper = {
  notify(title, body) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      new Notification(title, {
        body,
        icon: '🍅',
        tag: 'focusflow-timer'
      });
    } catch (e) {
      console.warn('Bildirim gösterilemedi:', e);
    }
  }
};

/**
 * Web Audio API ile bildirim sesi
 */
const SoundHelper = {
  ctx: null,

  getContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.ctx;
  },

  playComplete() {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') ctx.resume();

      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = ctx.currentTime + i * 0.15;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.3, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
        osc.start(start);
        osc.stop(start + 0.4);
      });
    } catch (e) {
      console.warn('Ses çalınamadı:', e);
    }
  }
};
