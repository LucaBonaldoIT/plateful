// The bundled, read-only database. Imported lazily so it lands in its own chunk (FR-DB-6).
import type { Database } from '../domain/types';
import { INGREDIENTS } from './ingredients';
import { RECIPES } from './recipes';

export const db: Database = {
  ingredients: new Map(INGREDIENTS.map((i) => [i.id, i])),
  recipes: RECIPES,
  recipeById: new Map(RECIPES.map((r) => [r.id, r])),
};
