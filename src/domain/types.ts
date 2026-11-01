// Domain types. User data mirrors REQUIREMENTS §11.1, the bundled database §11.2.

export type Sex = 'female' | 'male';
export type Activity = 'sedentary' | 'moderate' | 'high';
export type Goal = 'lose' | 'maintain' | 'gain';
export type Diet = 'omnivore' | 'flexitarian' | 'pescatarian' | 'vegetarian' | 'vegan';
export type MacroProfile =
  | 'balanced'
  | 'keto'
  | 'low-carb'
  | 'high-carb'
  | 'high-protein'
  | 'mediterranean'
  | 'zone'
  | 'low-fat';
export type Allergen =
  | 'gluten'
  | 'dairy'
  | 'eggs'
  | 'tree-nuts'
  | 'peanuts'
  | 'soy'
  | 'fish'
  | 'shellfish'
  | 'sesame';
export type SlotId =
  | 'breakfast'
  | 'morning-snack'
  | 'lunch'
  | 'afternoon-snack'
  | 'dinner'
  | 'evening-snack';
export type SlotType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealsPerDay = 1 | 2 | 3 | 4 | 5 | 6;
export type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Person {
  id: string;
  name: string;
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activity: Activity;
  goal: Goal;
}

export interface Household {
  people: Person[];
  diet: Diet;
  macroProfile: MacroProfile;
  excludedAllergens: Allergen[];
}

export interface PlanSettings {
  mealsPerDay: MealsPerDay;
  leftoversEnabled: boolean;
}

export interface MealRef {
  day: Day;
  slot: SlotId;
}

export interface Meal extends MealRef {
  recipeId: string | null;
  locked: boolean;
  leftoverOf?: MealRef;
}

export interface Plan {
  id: string;
  name: string;
  weekStart: string;
  createdAt: string;
  updatedAt: string;
  household: Household;
  settings: PlanSettings;
  meals: Meal[];
  seed: number;
}

export interface PlatefulData {
  app: 'plateful';
  schemaVersion: 1;
  exportedAt?: string;
  legal: { acceptedVersion: string; acceptedAt: string };
  onboarded: boolean;
  household: Household;
  defaultSettings: PlanSettings;
  plans: Plan[];
}

// ---- bundled database ------------------------------------------------------

export type AnimalCategory = 'none' | 'dairy' | 'egg' | 'honey' | 'fish' | 'seafood' | 'meat';
export type Aisle =
  | 'produce'
  | 'bakery'
  | 'meat'
  | 'fish'
  | 'dairy-eggs'
  | 'plant-protein'
  | 'grains'
  | 'legumes'
  | 'canned'
  | 'nuts-seeds'
  | 'oils-condiments'
  | 'spices-herbs'
  | 'frozen'
  | 'other';

export interface Nutrients {
  kcal: number;
  protein: number;
  carbs: number;
  fiber: number;
  fat: number;
}

export interface Ingredient {
  id: string;
  name: string;
  aisle: Aisle;
  unit: 'g' | 'ml' | 'piece';
  gramsPerPiece?: number;
  ediblePortion: number;
  per100: Nutrients;
  animal: AnimalCategory;
  allergens: Allergen[];
  packages?: { size: number; label: string }[];
  source: string;
}

export interface Recipe {
  id: string;
  name: string;
  slots: SlotType[];
  primaryIngredient: string;
  tags: 'mediterranean'[];
  batchable: boolean;
  prepMinutes: number;
  ingredients: { ingredientId: string; quantity: number }[];
  steps: string[];
}

export interface Database {
  ingredients: Map<string, Ingredient>;
  recipes: Recipe[];
  recipeById: Map<string, Recipe>;
}
