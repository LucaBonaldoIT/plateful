import '@lucabonaldo/design/fonts.css';
import '@lucabonaldo/design/index.css';
import './ui/app.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initTheme } from './state/prefs';
import { setDatabase } from './state/store';

initTheme();

// The recipe database is its own chunk (FR-DB-6); the app renders once it has loaded.
Promise.all([import('./data'), import('./ui/App')]).then(([{ db }, { App }]) => {
  setDatabase(db);
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
