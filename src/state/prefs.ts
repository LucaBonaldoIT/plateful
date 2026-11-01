// Per-device preferences outside the exported document: theme and the cookie notice.
// Both use localStorage only (no cookies, FR-LEGAL-6) and fail quietly when storage is blocked.
import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
const THEME_KEY = 'plateful:theme';
const COOKIE_KEY = 'plateful:cookie-notice';
const THEME_COLOR: Record<Theme, string> = { light: '#f5f2ea', dark: '#1c1915' };

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the choice lasts for this visit only */
  }
}

export const currentTheme = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  document.dispatchEvent(new CustomEvent('plateful:theme', { detail: theme }));
}

export function toggleTheme() {
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
  write(THEME_KEY, next);
  applyTheme(next);
}

/** Follow system changes until the user picks a theme. */
export function initTheme() {
  applyTheme(currentTheme());
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!read(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light');
  });
}

export function useTheme(): Theme {
  const [theme, setTheme] = useState(currentTheme);
  useEffect(() => {
    const on = () => setTheme(currentTheme());
    document.addEventListener('plateful:theme', on);
    return () => document.removeEventListener('plateful:theme', on);
  }, []);
  return theme;
}

export const cookieNoticeDismissed = () => read(COOKIE_KEY) === 'dismissed';
export const dismissCookieNotice = () => write(COOKIE_KEY, 'dismissed');
