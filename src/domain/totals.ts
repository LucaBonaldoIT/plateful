// Per-person planned intake vs target (FR-WP-3) and meal status flags.
import { isCompatible, portions } from './compat';
import { energyTarget, macroGrams, recipeNutrients, slotOf } from './nutrition';
import type { Database, Day, Meal, Plan } from './types';

export interface PersonTotals {
  personId: string;
  name: string;
  kcal: number;
  target: number;
  carbs: number;
  protein: number;
  fat: number;
  targetGrams: { carbs: number; protein: number; fat: number };
}

export function totalsFor(plan: Plan, days: Day[], db: Database): PersonTotals[] {
  return plan.household.people.map((person, i) => {
    const t = { personId: person.id, name: person.name, kcal: 0, carbs: 0, protein: 0, fat: 0 };
    let share = 0;
    for (const m of plan.meals) {
      if (!days.includes(m.day)) continue;
      share += slotOf(plan.settings.mealsPerDay, m.slot).share;
      const recipe = m.recipeId ? db.recipeById.get(m.recipeId) : undefined;
      if (!recipe) continue;
      const f = portions(recipe, plan.household, plan.settings.mealsPerDay, m.slot, db)[i]!.factor;
      const n = recipeNutrients(recipe, db);
      t.kcal += n.kcal * f;
      t.carbs += n.carbs * f;
      t.protein += n.protein * f;
      t.fat += n.fat * f;
    }
    const target = energyTarget(person).target * (share / days.length) * days.length;
    const perDay = days.length;
    return {
      ...t,
      kcal: t.kcal / perDay,
      carbs: t.carbs / perDay,
      protein: t.protein / perDay,
      fat: t.fat / perDay,
      target: target / perDay,
      targetGrams: macroGrams(energyTarget(person).target, plan.household.macroProfile),
    };
  });
}

export type MealStatus = 'ok' | 'empty' | 'missing' | 'incompatible';

export function mealStatus(plan: Plan, meal: Meal, db: Database): MealStatus {
  if (!meal.recipeId) return 'empty';
  const recipe = db.recipeById.get(meal.recipeId);
  if (!recipe) return 'missing';
  const type = slotOf(plan.settings.mealsPerDay, meal.slot).type;
  return isCompatible(recipe, plan.household, type, db) ? 'ok' : 'incompatible';
}
