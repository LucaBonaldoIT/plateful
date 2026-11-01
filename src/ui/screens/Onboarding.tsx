// 02–03 — first-run setup: household, then plan settings, then the first plan.
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { nextMonday } from '../../domain/schema';
import { useStore } from '../../state/store';
import { HouseholdEditor } from '../components/household';
import { PlanSettingsEditor } from '../components/planSettings';
import { Button, Overline } from '../components/ui';

function Steps({ step }: { step: 1 | 2 }) {
  return (
    <div className="pf-steps" aria-hidden="true">
      <span className="is-on" />
      <span className={step === 2 ? 'is-on' : ''} />
    </div>
  );
}

export function Onboarding() {
  const [step, setStep] = useState<1 | 2>(1);
  const people = useStore((s) => s.data!.household.people.length);
  const defaults = useStore((s) => s.data!.defaultSettings);
  const [settings, setSettings] = useState(defaults);
  const [week, setWeek] = useState(nextMonday());
  const navigate = useNavigate();
  // Only redirect people who open onboarding after finishing it; finishing it below must not
  // race the navigation to the new plan.
  const [alreadyDone] = useState(() => useStore.getState().data!.onboarded);
  if (alreadyDone) return <Navigate to="/" replace />;

  return (
    <main id="main" className="pf-page pf-page--narrow">
      <Steps step={step} />
      <Overline accent>Step {step} of 2</Overline>
      {step === 1 ? (
        <>
          <h1 className="pf-h1">Your household</h1>
          <p className="pf-lead">Who's eating, and how. You can change all of this later.</p>
          <HouseholdEditor />
          <div className="pf-actions">
            <Button variant="primary" size="lg" block trail="chevron-right" disabled={people === 0} onClick={() => { setStep(2); window.scrollTo(0, 0); }}>
              {people === 0 ? 'Add a person to continue' : 'Continue'}
            </Button>
          </div>
        </>
      ) : (
        <>
          <h1 className="pf-h1">Your week</h1>
          <p className="pf-lead">How many meals, and which week to plan first.</p>
          <PlanSettingsEditor value={settings} onChange={setSettings} week={week} onWeek={setWeek} />
          <div className="pf-actions pf-row pf-gap-8">
            <Button size="lg" icon="chevron-left" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              variant="primary"
              size="lg"
              icon="sparkles"
              className="pf-grow"
              onClick={() => {
                const s = useStore.getState();
                s.setDefaultSettings(settings);
                const id = s.createPlan(week, settings);
                navigate(`/plan/${id}`, { replace: true });
                s.completeOnboarding();
              }}
            >
              Create plan
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
