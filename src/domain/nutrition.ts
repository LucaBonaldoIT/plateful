// Energy and macro targets (REQUIREMENTS §6) and meal slots (FR-PS-1).
import type {
  Activity,
  Database,
  Goal,
  MacroProfile,
  MealsPerDay,
  Nutrients,
  Person,
  Recipe,
  SlotId,
  SlotType,
} from './types';

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  moderate: 1.55,
  high: 1.725,
};

export const GOAL_DELTA: Record<Goal, number> = { lose: -500, maintain: 0, gain: 300 };

/** Carbs / protein / fat as shares of daily kcal, plus an optional hard recipe filter. */
export const MACRO_PROFILES: Record<
  MacroProfile,
  { label: string; description: string; carbs: number; protein: number; fat: number; maxNetCarbShare?: number; mediterraneanOnly?: boolean }
> = {
  balanced: { label: 'Balanced', description: 'A standard everyday split', carbs: 50, protein: 20, fat: 30 },
  'high-protein': { label: 'High-protein', description: 'More protein for training and satiety', carbs: 35, protein: 35, fat: 30 },
  mediterranean: { label: 'Mediterranean', description: 'Olive oil, legumes, vegetables; tagged recipes only', carbs: 45, protein: 18, fat: 37, mediterraneanOnly: true },
  'low-carb': { label: 'Low-carb', description: 'Recipes ≤ 30% net carbs', carbs: 20, protein: 30, fat: 50, maxNetCarbShare: 0.3 },
  keto: { label: 'Keto', description: 'Recipes ≤ 10% net carbs', carbs: 5, protein: 20, fat: 75, maxNetCarbShare: 0.1 },
  'high-carb': { label: 'High-carb', description: 'For endurance and active days', carbs: 60, protein: 15, fat: 25 },
  zone: { label: 'Zone', description: 'Even 40/30/30 split', carbs: 40, protein: 30, fat: 30 },
  'low-fat': { label: 'Low-fat', description: 'Fat around 20%', carbs: 60, protein: 20, fat: 20 },
};

export const MACRO_PROFILE_ORDER: MacroProfile[] = [
  'balanced',
  'high-protein',
  'mediterranean',
  'low-carb',
  'keto',
  'high-carb',
  'zone',
  'low-fat',
];

export interface Slot {
  id: SlotId;
  type: SlotType;
  label: string;
  share: number;
}

const S = (id: SlotId, type: SlotType, label: string, share: number): Slot => ({ id, type, label, share });

export const SLOTS: Record<MealsPerDay, Slot[]> = {
  1: [S('dinner', 'dinner', 'Dinner', 1)],
  2: [S('lunch', 'lunch', 'Lunch', 0.5), S('dinner', 'dinner', 'Dinner', 0.5)],
  3: [S('breakfast', 'breakfast', 'Breakfast', 0.25), S('lunch', 'lunch', 'Lunch', 0.4), S('dinner', 'dinner', 'Dinner', 0.35)],
  4: [
    S('breakfast', 'breakfast', 'Breakfast', 0.25),
    S('lunch', 'lunch', 'Lunch', 0.35),
    S('afternoon-snack', 'snack', 'Afternoon snack', 0.1),
    S('dinner', 'dinner', 'Dinner', 0.3),
  ],
  5: [
    S('breakfast', 'breakfast', 'Breakfast', 0.2),
    S('morning-snack', 'snack', 'Morning snack', 0.1),
    S('lunch', 'lunch', 'Lunch', 0.3),
    S('afternoon-snack', 'snack', 'Afternoon snack', 0.1),
    S('dinner', 'dinner', 'Dinner', 0.3),
  ],
  6: [
    S('breakfast', 'breakfast', 'Breakfast', 0.2),
    S('morning-snack', 'snack', 'Morning snack', 0.1),
    S('lunch', 'lunch', 'Lunch', 0.25),
    S('afternoon-snack', 'snack', 'Afternoon snack', 0.1),
    S('dinner', 'dinner', 'Dinner', 0.25),
    S('evening-snack', 'snack', 'Evening snack', 0.1),
  ],
};

export function slotOf(mealsPerDay: MealsPerDay, id: SlotId): Slot {
  const slot = SLOTS[mealsPerDay].find((s) => s.id === id);
  if (!slot) throw new Error(`Slot ${id} does not exist with ${mealsPerDay} meals per day`);
  return slot;
}

// ---- people -----------------------------------------------------------------

export function bmr(p: Pick<Person, 'sex' | 'weightKg' | 'heightCm' | 'age'>): number {
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161);
}

export function tdee(p: Person): number {
  return bmr(p) * ACTIVITY_FACTOR[p.activity];
}

export interface EnergyTarget {
  bmr: number;
  tdee: number;
  target: number;
  floorApplied: boolean;
}

export function energyTarget(p: Person): EnergyTarget {
  const b = bmr(p);
  const t = b * ACTIVITY_FACTOR[p.activity];
  const raw = t + GOAL_DELTA[p.goal];
  const floor = Math.max(p.sex === 'female' ? 1200 : 1500, b);
  return {
    bmr: Math.round(b),
    tdee: Math.round(t),
    target: Math.round(Math.max(raw, floor)),
    floorApplied: raw < floor,
  };
}

export interface MacroGrams {
  carbs: number;
  protein: number;
  fat: number;
}

export function macroGrams(kcal: number, profile: MacroProfile): MacroGrams {
  const m = MACRO_PROFILES[profile];
  return {
    carbs: Math.round((kcal * m.carbs) / 100 / 4),
    protein: Math.round((kcal * m.protein) / 100 / 4),
    fat: Math.round((kcal * m.fat) / 100 / 9),
  };
}

// ---- recipes ----------------------------------------------------------------

const cache = new WeakMap<Recipe, Nutrients>();

/** Nutrition of one base serving, computed from as-purchased quantities (FR-NUT-7). */
export function recipeNutrients(recipe: Recipe, db: Database): Nutrients {
  const hit = cache.get(recipe);
  if (hit) return hit;
  const total: Nutrients = { kcal: 0, protein: 0, carbs: 0, fiber: 0, fat: 0 };
  for (const { ingredientId, quantity } of recipe.ingredients) {
    const ing = db.ingredients.get(ingredientId);
    if (!ing) continue;
    const grams = (ing.unit === 'piece' ? quantity * (ing.gramsPerPiece ?? 0) : quantity) * ing.ediblePortion;
    const k = grams / 100;
    total.kcal += ing.per100.kcal * k;
    total.protein += ing.per100.protein * k;
    total.carbs += ing.per100.carbs * k;
    total.fiber += ing.per100.fiber * k;
    total.fat += ing.per100.fat * k;
  }
  cache.set(recipe, total);
  return total;
}

export function netCarbs(n: Nutrients): number {
  return Math.max(0, n.carbs - n.fiber);
}

/** Share of kcal from carbs / protein / fat, 0–100, using 4/4/9 kcal per gram. */
export function macroSplit(n: Pick<Nutrients, 'carbs' | 'protein' | 'fat'>): MacroGrams {
  const kcal = n.carbs * 4 + n.protein * 4 + n.fat * 9;
  if (kcal === 0) return { carbs: 0, protein: 0, fat: 0 };
  return {
    carbs: (n.carbs * 400) / kcal,
    protein: (n.protein * 400) / kcal,
    fat: (n.fat * 900) / kcal,
  };
}
