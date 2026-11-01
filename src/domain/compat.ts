// Which recipes a household may eat (FR-HH-6/7/8/12) and how portions scale (FR-WP-5/6/7).
import { MACRO_PROFILES, energyTarget, netCarbs, recipeNutrients, slotOf } from './nutrition';
import type { AnimalCategory, Database, Diet, Household, MealsPerDay, Recipe, SlotId, SlotType } from './types';

const ALLOWED: Record<Diet, AnimalCategory[]> = {
  omnivore: ['none', 'dairy', 'egg', 'honey', 'fish', 'seafood', 'meat'],
  flexitarian: ['none', 'dairy', 'egg', 'honey', 'fish', 'seafood', 'meat'],
  pescatarian: ['none', 'dairy', 'egg', 'honey', 'fish', 'seafood'],
  vegetarian: ['none', 'dairy', 'egg', 'honey'],
  vegan: ['none'],
};

export const DIET_LABEL: Record<Diet, string> = {
  omnivore: 'Omnivore',
  flexitarian: 'Flexitarian',
  pescatarian: 'Pescatarian',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
};

export const DIET_HINT: Record<Diet, string> = {
  omnivore: 'No restrictions.',
  flexitarian: 'Mostly vegetarian: meat or fish in at most 3 meals a week.',
  pescatarian: 'Vegetarian plus fish and seafood.',
  vegetarian: 'Lacto-ovo: dairy, eggs and honey are allowed.',
  vegan: 'No animal products, including honey.',
};

export function animalCategories(recipe: Recipe, db: Database): Set<AnimalCategory> {
  const out = new Set<AnimalCategory>();
  for (const { ingredientId } of recipe.ingredients) out.add(db.ingredients.get(ingredientId)?.animal ?? 'none');
  return out;
}

/** Meat, fish or seafood: counted by the flexitarian weekly limit. */
export function hasFleshFood(recipe: Recipe, db: Database): boolean {
  const a = animalCategories(recipe, db);
  return a.has('meat') || a.has('fish') || a.has('seafood');
}

export function fitsDiet(recipe: Recipe, diet: Diet, db: Database): boolean {
  const allowed = ALLOWED[diet];
  return [...animalCategories(recipe, db)].every((a) => allowed.includes(a));
}

export function allergensOf(recipe: Recipe, db: Database): Set<string> {
  const out = new Set<string>();
  for (const { ingredientId } of recipe.ingredients) for (const a of db.ingredients.get(ingredientId)?.allergens ?? []) out.add(a);
  return out;
}

export function fitsProfile(recipe: Recipe, household: Household, db: Database): boolean {
  const p = MACRO_PROFILES[household.macroProfile];
  if (p.mediterraneanOnly && !recipe.tags.includes('mediterranean')) return false;
  if (p.maxNetCarbShare !== undefined) {
    const n = recipeNutrients(recipe, db);
    if (n.kcal <= 0 || (netCarbs(n) * 4) / n.kcal > p.maxNetCarbShare) return false;
  }
  return true;
}

/** Every hard constraint except the flexitarian weekly count (FR-GEN-2). */
export function isCompatible(recipe: Recipe, household: Household, slotType: SlotType, db: Database): boolean {
  if (!recipe.slots.includes(slotType)) return false;
  if (!fitsDiet(recipe, household.diet, db)) return false;
  const allergens = allergensOf(recipe, db);
  if (household.excludedAllergens.some((a) => allergens.has(a))) return false;
  return fitsProfile(recipe, household, db);
}

export function compatibleRecipes(household: Household, slotType: SlotType, db: Database): Recipe[] {
  return db.recipes.filter((r) => isCompatible(r, household, slotType, db));
}

/** Why a meal has no candidates, for FR-GEN-7. */
export function describeConstraints(household: Household, slotType: SlotType): string {
  const parts = [DIET_LABEL[household.diet].toLowerCase()];
  if (household.macroProfile === 'keto' || household.macroProfile === 'low-carb' || household.macroProfile === 'mediterranean')
    parts.push(MACRO_PROFILES[household.macroProfile].label.toLowerCase());
  for (const a of household.excludedAllergens) parts.push(a === 'gluten' ? 'gluten-free' : `no ${a.replace('-', ' ')}`);
  return `No ${parts.join(' + ')} ${slotType} in the database`;
}

// ---- portions -----------------------------------------------------------------

export const MIN_FACTOR = 0.5;
export const MAX_FACTOR = 2;

export interface Portion {
  personId: string;
  factor: number;
  clamped: boolean;
}

export function portions(recipe: Recipe, household: Household, mealsPerDay: MealsPerDay, slot: SlotId, db: Database): Portion[] {
  const kcal = recipeNutrients(recipe, db).kcal;
  const share = slotOf(mealsPerDay, slot).share;
  return household.people.map((person) => {
    const raw = kcal > 0 ? (energyTarget(person).target * share) / kcal : 1;
    const rounded = Math.round(raw * 20) / 20;
    const factor = Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, rounded));
    return { personId: person.id, factor, clamped: factor !== rounded };
  });
}
