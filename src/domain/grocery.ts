// Grocery list (REQUIREMENTS §8): aggregate, round, suggest packages, format for the clipboard.
import { portions } from './compat';
import type { Aisle, Database, Ingredient, Plan } from './types';

export const AISLES: { id: Aisle; label: string }[] = [
  { id: 'produce', label: 'Produce' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'meat', label: 'Meat' },
  { id: 'fish', label: 'Fish & seafood' },
  { id: 'dairy-eggs', label: 'Dairy & eggs' },
  { id: 'plant-protein', label: 'Plant proteins' },
  { id: 'grains', label: 'Grains, pasta & rice' },
  { id: 'legumes', label: 'Legumes' },
  { id: 'canned', label: 'Canned & jarred' },
  { id: 'nuts-seeds', label: 'Nuts & seeds' },
  { id: 'oils-condiments', label: 'Oils, vinegars & condiments' },
  { id: 'spices-herbs', label: 'Spices & herbs' },
  { id: 'frozen', label: 'Frozen' },
  { id: 'other', label: 'Other' },
];

export interface GroceryItem {
  ingredient: Ingredient;
  /** exact household amount in the ingredient's unit */
  amount: number;
  /** rounded display amount, e.g. "1.25 kg", "600 g", "14" */
  display: string;
  /** suggested packages, e.g. "3 × 200 g bag"; empty when the ingredient has no package data */
  packages: string;
}

export interface GroceryGroup {
  aisle: Aisle;
  label: string;
  items: GroceryItem[];
}

export interface GroceryList {
  groups: GroceryGroup[];
  count: number;
  mealCount: number;
}

/** Sum every non-empty meal, leftovers included (FR-GL-1, FR-GEN-6). */
export function aggregate(plan: Plan, db: Database): Map<string, number> {
  const totals = new Map<string, number>();
  for (const meal of plan.meals) {
    const recipe = meal.recipeId ? db.recipeById.get(meal.recipeId) : undefined;
    if (!recipe) continue;
    const factor = portions(recipe, plan.household, plan.settings.mealsPerDay, meal.slot, db).reduce((s, p) => s + p.factor, 0);
    for (const { ingredientId, quantity } of recipe.ingredients)
      totals.set(ingredientId, (totals.get(ingredientId) ?? 0) + quantity * factor);
  }
  return totals;
}

/** Display rounding (FR-GL-2). Pieces always round up. */
export function roundAmount(amount: number, unit: Ingredient['unit']): number {
  if (unit === 'piece') return Math.ceil(amount - 1e-9);
  if (amount < 100) return Math.max(5, Math.round(amount / 5) * 5);
  if (amount < 1000) return Math.round(amount / 10) * 10;
  return Math.round(amount / 50) * 50;
}

export function formatQuantity(amount: number, unit: Ingredient['unit']): string {
  if (unit === 'piece') return String(amount);
  if (amount >= 1000) return `${(amount / 1000).toFixed(2)} ${unit === 'g' ? 'kg' : 'L'}`;
  return `${amount} ${unit}`;
}

function formatSize(size: number, unit: Ingredient['unit']): string {
  if (unit === 'piece') return String(size);
  if (size >= 1000) return `${+(size / 1000).toFixed(2)} ${unit === 'g' ? 'kg' : 'L'}`;
  return `${size} ${unit}`;
}

/**
 * Cheapest cover of `need`: least overage, then fewest packages (FR-GL-3).
 * Returns counts per package index, largest first.
 */
export function choosePackages(need: number, sizes: number[]): number[] {
  const unit = Math.max(1, gcdAll(sizes));
  const target = Math.ceil(need / unit - 1e-9);
  const steps = sizes.map((s) => Math.round(s / unit));
  const limit = target + Math.max(...steps);
  // dp[v] = fewest packages that sum exactly to v units
  const dp = new Array<number>(limit + 1).fill(Infinity);
  const from = new Array<number>(limit + 1).fill(-1);
  dp[0] = 0;
  for (let v = 1; v <= limit; v++)
    steps.forEach((s, i) => {
      if (s <= v && dp[v - s]! + 1 < dp[v]!) { dp[v] = dp[v - s]! + 1; from[v] = i; }
    });
  let best = -1;
  for (let v = target; v <= limit; v++) if (dp[v]! < Infinity) { best = v; break; }
  const counts = sizes.map(() => 0);
  for (let v = best; v > 0; v -= steps[from[v]!]!) counts[from[v]!]!++;
  return counts;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
function gcdAll(xs: number[]): number {
  return xs.map((x) => Math.round(x)).reduce((a, b) => gcd(a, b));
}

export function packagesLabel(ing: Ingredient, amount: number): string {
  const pk = ing.packages;
  if (!pk || pk.length === 0) return '';
  const sorted = [...pk].sort((a, b) => b.size - a.size);
  const counts = choosePackages(amount, sorted.map((p) => p.size));
  return sorted
    .map((p, i) => ({ p, n: counts[i]! }))
    .filter((x) => x.n > 0)
    .map(({ p, n }) => `${n} × ${formatSize(p.size, ing.unit)}${p.label ? ' ' + p.label : ''}`)
    .join(' + ');
}

export function groceryList(plan: Plan, db: Database): GroceryList {
  const totals = aggregate(plan, db);
  const groups: GroceryGroup[] = [];
  for (const aisle of AISLES) {
    const items: GroceryItem[] = [];
    for (const [id, amount] of totals) {
      const ing = db.ingredients.get(id);
      if (!ing || ing.aisle !== aisle.id || amount <= 0) continue;
      const rounded = roundAmount(amount, ing.unit);
      items.push({ ingredient: ing, amount, display: formatQuantity(rounded, ing.unit), packages: packagesLabel(ing, amount) });
    }
    items.sort((a, b) => a.ingredient.name.localeCompare(b.ingredient.name));
    if (items.length) groups.push({ aisle: aisle.id, label: aisle.label, items });
  }
  return {
    groups,
    count: groups.reduce((n, g) => n + g.items.length, 0),
    mealCount: plan.meals.filter((m) => m.recipeId && db.recipeById.has(m.recipeId)).length,
  };
}

export function weekLabel(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00');
  return `Week of ${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })} ${d.getFullYear()}`;
}

/** The exact clipboard format of FR-GL-5. */
export function clipboardText(plan: Plan, list: GroceryList): string {
  const lines = [`Plateful — ${weekLabel(plan.weekStart)}`];
  for (const g of list.groups) {
    lines.push('', g.label.toUpperCase());
    for (const it of g.items) lines.push(`- [ ] ${it.ingredient.name} — ${it.display}${it.packages ? ` (${it.packages})` : ''}`);
  }
  return lines.join('\n') + '\n';
}
