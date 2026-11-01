// 08 + D3 — household (§4).
import { HouseholdEditor } from '../components/household';
import { Overline } from '../components/ui';

export function HouseholdScreen() {
  return (
    <main id="main" className="pf-page pf-page--wide">
      <div className="pf-stack-xs pf-mb-24">
        <Overline>Who's eating</Overline>
        <h1 className="pf-h1">Household</h1>
      </div>
      <HouseholdEditor layout="columns" />
    </main>
  );
}
