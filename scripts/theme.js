/**
 * FocusFlow – Tema yönetimi
 */

const ThemeManager = {
  init() {
    const savedTheme = Storage.get('theme', 'light');
    this.setTheme(savedTheme);

    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', () => this.toggle());
    });
  },

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    Storage.set('theme', theme);

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.content = theme === 'dark' ? '#1e293b' : '#6366f1';
    }
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    this.setTheme(current === 'light' ? 'dark' : 'light');
  },

  getCurrent() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }
};
