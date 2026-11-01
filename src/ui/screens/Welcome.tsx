// 01 — key points and legal acceptance (FR-LEGAL-2/3/7).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../state/store';
import { Icon, type IconName } from '../components/Icon';
import { Button, Check } from '../components/ui';

const POINTS: [IconName, string, string][] = [
  ['wifioff', 'Works offline', 'No account, no server. Nothing is sent anywhere.'],
  ['shield', 'Your data stays here', 'Saved in this browser only. Export it any time.'],
  ['info', 'Estimates, not advice', 'Not a substitute for a doctor or dietitian.'],
  ['alert', 'Check the labels', 'Allergen data may be incomplete or wrong.'],
];

export function Welcome() {
  const returning = useStore((s) => !!s.data);
  const acceptLegal = useStore((s) => s.acceptLegal);
  const navigate = useNavigate();
  const [terms, setTerms] = useState(false);
  const [adult, setAdult] = useState(false);
  const [tried, setTried] = useState(false);
  const ok = terms && adult;

  return (
    <main id="main" className="pf-page pf-page--narrow pf-welcome">
      <span className="pf-logo" aria-hidden="true">
        <Icon name="leaf" size={24} />
      </span>
      <h1 className="pf-display">
        Plan the week.
        <br />
        Shop once.
      </h1>
      <p className="pf-lead">Tell Plateful who's eating. It plans shared meals with portions sized for each person, then adds up everything you need to buy.</p>
      {returning && <p className="ds-notice">Our Disclaimer, Terms or Privacy Policy changed. Please review and accept them to continue; your data is kept.</p>}
      <ul className="pf-points">
        {POINTS.map(([icon, t, d]) => (
          <li key={t}>
            <Icon name={icon} size={20} className="ds-accent" />
            <div>
              <p className="pf-strong">{t}</p>
              <p className="pf-soft pf-sm">{d}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="pf-stack-sm">
        <Check checked={terms} onChange={setTerms}>
          I have read and accept the <Link to="/legal/disclaimer">Disclaimer</Link>, <Link to="/legal/terms">Terms of Service</Link> and <Link to="/legal/privacy">Privacy Policy</Link>.
        </Check>
        <Check checked={adult} onChange={setAdult}>
          I am 18 or older.
        </Check>
      </div>
      {tried && !ok && (
        <p className="pf-sm pf-text--err" role="alert">
          Plateful can't be used without accepting the terms and confirming you are 18 or older.
        </p>
      )}
      <Button
        variant="primary"
        size="lg"
        block
        trail="chevron-right"
        onClick={() => {
          setTried(true);
          if (!ok) return;
          acceptLegal();
          navigate('/', { replace: true });
        }}
      >
        {returning ? 'Accept and continue' : 'Get started'}
      </Button>
    </main>
  );
}
