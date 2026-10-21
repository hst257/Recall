(() => {
  const key = 'recall.theme.v1';
  const root = document.documentElement;

  function applyTheme(value) {
    const theme = value === 'light' ? 'light' : 'dark';
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#101713' : '#f4f5f3';
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      const label = theme === 'dark' ? 'Light mode' : 'Dark mode';
      document.getElementById('theme-label').textContent = label;
      toggle.setAttribute('aria-label', `Switch to ${label.toLowerCase()}`);
      toggle.title = `Switch to ${label.toLowerCase()}`;
    }
  }

  let saved;
  try { saved = localStorage.getItem(key); } catch { /* Dark remains available without browser storage. */ }
  applyTheme(saved);

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(root.dataset.theme);
    document.getElementById('theme-toggle').addEventListener('click', () => {
      const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(theme);
      try { localStorage.setItem(key, theme); } catch { /* The current visit still uses the selected theme. */ }
    });
  });

  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) applyTheme(event.newValue);
  });
})();
