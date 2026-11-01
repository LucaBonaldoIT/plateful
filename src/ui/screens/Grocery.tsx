// 10 + D2 — grocery list with the exact clipboard format (§8).
import { useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { clipboardText, groceryList } from '../../domain/grocery';
import { weekRange } from '../../domain/schema';
import { database, useStore } from '../../state/store';
import { Icon } from '../components/Icon';
import { Button, Notice, Overline, Sheet, useToast } from '../components/ui';

export function Grocery() {
  const { id } = useParams();
  const plan = useStore((s) => s.data!.plans.find((p) => p.id === id));
  const toast = useToast();
  const [fallback, setFallback] = useState<string | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const list = useMemo(() => (plan ? groceryList(plan, database()) : null), [plan]);
  if (!plan || !list) return <Navigate to="/" replace />;
  const text = clipboardText(plan, list);
  const people = plan.household.people.length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard');
    } catch {
      setFallback(text); // FR-GL-5: clipboard unavailable (e.g. plain http on a phone)
    }
  };

  return (
    <main id="main" className="pf-page pf-page--wide">
      <nav className="pf-crumbs" aria-label="Breadcrumb">
        <Link to={`/plan/${plan.id}`}>{plan.name}</Link>
        <Icon name="chevron-right" size={14} />
        <span aria-current="page">Grocery list</span>
      </nav>
      <div className="pf-grocery">
        <aside className="pf-grocery__side pf-stack-md">
          <div className="pf-stack-xs">
            <Overline>{plan.name}</Overline>
            <h1 className="pf-h1">{list.count} items</h1>
            <p className="pf-soft">
              {weekRange(plan.weekStart)} · {list.mealCount} meals · {people} {people === 1 ? 'person' : 'people'}
            </p>
          </div>
          <Button variant="primary" size="lg" block icon="copy" disabled={list.count === 0} onClick={copy}>
            Copy list
          </Button>
          <details className="ds-panel pf-preview">
            <summary className="ds-overline pf-overline">Clipboard preview</summary>
            <pre>{text}</pre>
          </details>
          <Notice kind="warn" icon="alert">
            Always check product labels. Allergen data may be incomplete or wrong.
          </Notice>
        </aside>
        <div className="pf-grocery__list">
          {list.count === 0 && <p className="pf-soft">This plan has no meals yet, so there's nothing to buy.</p>}
          {list.groups.map((g) => (
            <section key={g.aisle} className="pf-aisle" aria-label={g.label}>
              <h2 className="pf-aisle__head">
                <span className="ds-overline ds-accent">{g.label}</span>
                <span className="pf-xs pf-soft">{g.items.length}</span>
              </h2>
              <ul>
                {g.items.map((it) => (
                  <li key={it.ingredient.id} className="pf-item">
                    <span>
                      <span className="pf-item__name">{it.ingredient.name}</span>
                      {it.packages && <span className="pf-xs pf-soft pf-block">{it.packages}</span>}
                    </span>
                    <span className="pf-strong pf-item__qty">{it.display}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
      <Sheet open={!!fallback} onClose={() => setFallback(null)} title="Copy the list">
        <p className="pf-soft pf-sm">Your browser blocked automatic copying. The text is selected below: copy it with your device's copy command.</p>
        <textarea ref={area} className="ds-input pf-copy-area" readOnly value={fallback ?? ''} rows={12} onFocus={(e) => e.currentTarget.select()} autoFocus />
      </Sheet>
    </main>
  );
}
