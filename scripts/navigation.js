/**
 * FocusFlow – Görünüm navigasyonu
 */

const Navigation = {
  currentView: 'dashboard',

  init() {
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.navigateTo(view);
      });
    });

    const savedView = Storage.get('currentView', 'dashboard');
    this.navigateTo(savedView, false);
  },

  navigateTo(viewName, save = true) {
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
      const isActive = view.id === `view-${viewName}`;
      view.hidden = !isActive;
      view.classList.toggle('view--active', isActive);
    });

    document.querySelectorAll('[data-view]').forEach(btn => {
      const isActive = btn.dataset.view === viewName;
      btn.classList.toggle('active', isActive);
      if (btn.hasAttribute('aria-current')) {
        if (isActive) {
          btn.setAttribute('aria-current', 'page');
        } else {
          btn.removeAttribute('aria-current');
        }
      }
    });

    this.currentView = viewName;
    if (save) Storage.set('currentView', viewName);
  }
};
