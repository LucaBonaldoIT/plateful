// 11–12 — plan defaults, export / import / delete (§10), about.
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { parseData } from '../../domain/schema';
import type { PlatefulData } from '../../domain/types';
import { download, exportJson, useStore } from '../../state/store';
import { Icon, type IconName } from '../components/Icon';
import { Section } from '../components/household';
import { Button, Confirm, Notice, Overline, Stepper, Toggle, useToast } from '../components/ui';
import type { MealsPerDay } from '../../domain/types';

const today = () => new Date().toISOString().slice(0, 10);

function DataRow({ icon, title, sub, danger, onClick }: { icon: IconName; title: string; sub: string; danger?: boolean; onClick: () => void }) {
  return (
    <button type="button" className="pf-data-row" onClick={onClick}>
      <Icon name={icon} size={20} className={danger ? 'pf-text--err' : 'ds-accent'} />
      <span className="pf-stack-xs pf-grow">
        <span className={`pf-strong ${danger ? 'pf-text--err' : ''}`}>{title}</span>
        <span className="pf-xs pf-soft">{sub}</span>
      </span>
      <Icon name="chevron-right" size={16} className="pf-soft" />
    </button>
  );
}

export function Settings() {
  const data = useStore((s) => s.data!);
  const storageError = useStore((s) => s.storageError);
  const toast = useToast();
  const navigate = useNavigate();
  const file = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PlatefulData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const s = data.defaultSettings;
  const set = useStore.getState().setDefaultSettings;
  const doExport = () => download(`plateful-${today()}.json`, exportJson());

  return (
    <main id="main" className="pf-page pf-page--narrow">
      <div className="pf-stack-xs pf-mb-24">
        <Overline>Preferences & data</Overline>
        <h1 className="pf-h1">Settings</h1>
      </div>
      <div className="pf-stack-lg">
        <Section title="New plan defaults">
          <div className="ds-panel pf-stack-sm">
            <div className="pf-row pf-between pf-gap-12">
              <span>Meals per day</span>
              <Stepper label="Meals per day" value={s.mealsPerDay} min={1} max={6} onChange={(v) => set({ ...s, mealsPerDay: v as MealsPerDay })} />
            </div>
            <hr className="ds-rule" />
            <div className="pf-row pf-between pf-gap-12">
              <span>Leftovers & batch cooking</span>
              <Toggle label="Leftovers & batch cooking" on={s.leftoversEnabled} onChange={(v) => set({ ...s, leftoversEnabled: v })} />
            </div>
          </div>
        </Section>

        <Section title="Your data" sub="Everything is stored in this browser only. Export a backup to keep it safe or move it to another device.">
          <div className="ds-panel pf-data">
            <DataRow icon="download" title="Export data" sub={`plateful-${today()}.json · ${data.household.people.length} people, ${data.plans.length} plans`} onClick={doExport} />
            <hr className="ds-rule" />
            <DataRow icon="upload" title="Import data" sub="Replaces everything currently saved" onClick={() => file.current?.click()} />
            <hr className="ds-rule" />
            <DataRow icon="trash" title="Delete all data" sub="Removes your household and plans from this browser" danger onClick={() => setDeleting(true)} />
          </div>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              if (f.size > 5_000_000) return setImportError('This file is too large to be a Plateful export.');
              const res = parseData(await f.text());
              if (res.ok) { setImportError(null); setPending(res.data); } else setImportError(res.error);
            }}
          />
          {importError && <Notice kind="err" icon="alert" title="Import failed">{importError} Your current data is unchanged.</Notice>}
          {storageError ? (
            <Notice kind="err" icon="alert" title="Saving failed">This browser refused to save. Export your data now so you don't lose it.</Notice>
          ) : (
            <Notice kind="ok" icon="check">Saved automatically in this browser.</Notice>
          )}
        </Section>

        <Section title="About">
          <div className="ds-panel pf-stack-sm">
            <dl className="pf-kv">
              <div><dt>Version</dt><dd>{__APP_VERSION__}</dd></div>
              <div><dt>License</dt><dd>MIT</dd></div>
              <div><dt>Design system</dt><dd>Paper & ink (MIT)</dd></div>
              <div><dt>Fonts</dt><dd>Fraunces, Inter (SIL OFL)</dd></div>
              <div><dt>Nutrition data</dt><dd>USDA FoodData Central</dd></div>
            </dl>
            <hr className="ds-rule" />
            <p className="pf-row pf-wrap pf-gap-16 pf-sm">
              <Link to="/legal/disclaimer">Disclaimer</Link>
              <Link to="/legal/terms">Terms</Link>
              <Link to="/legal/privacy">Privacy</Link>
              <a href="https://github.com/LucaBonaldoIT/plateful" target="_blank" rel="noreferrer">Source</a>
            </p>
          </div>
        </Section>
      </div>

      <Confirm
        open={!!pending}
        title="Replace your data?"
        confirmLabel="Import"
        danger
        onCancel={() => setPending(null)}
        onConfirm={() => {
          useStore.getState().importData(pending!);
          setPending(null);
          toast('Data imported');
          navigate('/');
        }}
      >
        <p>
          The file has {pending?.household.people.length} {pending?.household.people.length === 1 ? 'person' : 'people'} and {pending?.plans.length} plan{pending?.plans.length === 1 ? '' : 's'}. Everything currently saved here is replaced. There is no merge.
        </p>
      </Confirm>
      <Confirm
        open={deleting}
        title="Delete all data?"
        confirmLabel="Delete everything"
        danger
        onCancel={() => setDeleting(false)}
        onConfirm={() => { useStore.getState().deleteAll(); navigate('/welcome', { replace: true }); }}
        extra={<Button icon="download" onClick={doExport}>Export first</Button>}
      >
        <p>This removes your household, {data.plans.length} saved plan{data.plans.length === 1 ? '' : 's'} and your settings from this browser. It can't be undone.</p>
      </Confirm>
    </main>
  );
}
