// App chrome: header, bottom navigation, footer and the cookie notice.
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { cookieNoticeDismissed, dismissCookieNotice, toggleTheme, useTheme } from '../../state/prefs';
import { Icon } from './Icon';
import { Button } from './ui';

const NAV = [
  { to: '/', label: 'Plans', icon: 'calendar' as const, end: true },
  { to: '/household', label: 'Household', icon: 'users' as const },
  { to: '/settings', label: 'Settings', icon: 'settings' as const },
];

export function Wordmark() {
  return (
    <Link to="/" className="ds-wordmark pf-wordmark" aria-label="Plateful home">
      Plateful<span className="ds-wordmark__dot">.</span>
    </Link>
  );
}

export function ThemeToggle() {
  const theme = useTheme();
  return (
    <Button
      variant="quiet"
      icon={theme === 'dark' ? 'sun' : 'moon'}
      label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggleTheme}
      className="pf-theme-toggle"
    />
  );
}

export function Header({ nav = true }: { nav?: boolean }) {
  return (
    <header className="ds-header ds-header--wide">
      <div className="ds-header__inner">
        <Wordmark />
        <nav className="ds-nav pf-topnav" aria-label="Main">
          {nav &&
            NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `pf-topnav__link ${isActive ? 'is-active' : ''}`}>
                {n.label}
              </NavLink>
            ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

export function BottomNav() {
  return (
    <nav className="pf-bottomnav" aria-label="Main">
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `pf-bottomnav__item ${isActive ? 'is-active' : ''}`}>
          <Icon name={n.icon} size={21} />
          <span>{n.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="pf-footer">
      <nav aria-label="Legal" className="pf-footer__links">
        <Link to="/legal/disclaimer">Disclaimer</Link> · <Link to="/legal/terms">Terms</Link> · <Link to="/legal/privacy">Privacy</Link> ·{' '}
        <a href="https://github.com/LucaBonaldoIT/plateful" target="_blank" rel="noreferrer">
          Source (MIT)
        </a>
      </nav>
      <p>Estimates only — not medical advice. Your data never leaves this device.</p>
    </footer>
  );
}

/** FR-LEGAL-6a: informational, one OK button, remembered under its own key. */
export function CookieNotice() {
  const [open, setOpen] = useState(() => !cookieNoticeDismissed());
  if (!open) return null;
  return (
    <section className="ds-panel ds-panel--raised pf-cookie" role="region" aria-label="Cookie notice">
      <div className="pf-cookie__body">
        <Icon name="cookie" size={20} className="ds-accent" />
        <div>
          <strong>No cookies here.</strong>
          <p>Plateful uses no cookies and no tracking. Your data is saved only in this browser's local storage.</p>
        </div>
      </div>
      <div className="pf-cookie__actions">
        <Link to="/legal/privacy" className="pf-link">
          Privacy Policy
        </Link>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            dismissCookieNotice();
            setOpen(false);
          }}
        >
          OK
        </Button>
      </div>
    </section>
  );
}
