// Database lint (FR-DB-5): unique ids, references, piece weights, kcal ranges and the
// diet × slot coverage report of FR-DB-2. Exits non-zero on errors, not on coverage gaps.
import { db } from '../src/data';
import { compatibleRecipes } from '../src/domain/compat';
import { recipeNutrients } from '../src/domain/nutrition';
import type { Diet, Household, SlotType } from '../src/domain/types';

const errors: string[] = [];
const warnings: string[] = [];

const ids = new Set<string>();
for (const r of db.recipes) {
  if (ids.has(r.id)) errors.push(`duplicate recipe id ${r.id}`);
  ids.add(r.id);
  for (const { ingredientId, quantity } of r.ingredients) {
    if (!db.ingredients.has(ingredientId)) errors.push(`${r.id}: unknown ingredient ${ingredientId}`);
    if (!(quantity > 0)) errors.push(`${r.id}: bad quantity for ${ingredientId}`);
  }
  if (!db.ingredients.has(r.primaryIngredient)) errors.push(`${r.id}: unknown primary ingredient ${r.primaryIngredient}`);
  if (r.slots.some((s) => !s)) errors.push(`${r.id}: unknown slot letter`);
  const kcal = recipeNutrients(r, db).kcal;
  const main = r.slots.includes('lunch') || r.slots.includes('dinner');
  const [lo, hi] = main ? [350, 650] : r.slots.includes('breakfast') ? [250, 500] : [100, 300];
  if (kcal < lo || kcal > hi) warnings.push(`${r.id}: ${Math.round(kcal)} kcal outside ${lo}–${hi} (FR-DB-3)`);
}
for (const ing of db.ingredients.values())
  if (ing.unit === 'piece' && !ing.gramsPerPiece) errors.push(`${ing.id}: piece unit without gramsPerPiece`);

console.log(`${db.recipes.length} recipes, ${db.ingredients.size} ingredients\n`);
if (db.recipes.length < 300) warnings.push(`only ${db.recipes.length} recipes; FR-DB-1 asks for 300+`);

const diets: Diet[] = ['omnivore', 'flexitarian', 'pescatarian', 'vegetarian', 'vegan'];
const slots: SlotType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const min: Record<SlotType, number> = { breakfast: 10, lunch: 20, dinner: 20, snack: 10 };
const rows = diets.map((diet) => {
  const h: Household = { people: [], diet, macroProfile: 'balanced', excludedAllergens: [] };
  return [diet.padEnd(12), ...slots.map((s) => {
    const n = compatibleRecipes(h, s, db).length;
    if (n < min[s]) warnings.push(`coverage: ${diet} ${s} has ${n}, target ${min[s]} (FR-DB-2)`);
    return String(n).padStart(9);
  })].join('');
});
console.log('coverage    ' + slots.map((s) => s.padStart(9)).join(''));
console.log(rows.join('\n') + '\n');

for (const w of warnings) console.warn('warn  ' + w);
for (const e of errors) console.error('error ' + e);
if (errors.length) process.exit(1);
