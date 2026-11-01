// Recipe database (REQUIREMENTS §11.2–11.3), split by category. One line per recipe:
//   id | name | slots (B breakfast, L lunch, D dinner, S snack) | primary ingredient |
//   flags (m = mediterranean, b = batchable) | minutes |
//   ingredients "id qty, …" for ONE base serving, as-purchased | steps "… / …"
// Diet compatibility and allergens are derived from ingredients, never declared here (FR-HH-7).
import type { Recipe, SlotType } from '../../domain/types';
import { BASE } from './base';
import { BREAKFAST } from './breakfast';
import { FISH } from './fish';
import { FLEXITARIAN } from './flexitarian';
import { MEAT } from './meat';
import { SNACKS } from './snacks';
import { VEGAN } from './vegan';
import { VEGAN_KETO } from './vegan-keto';
import { VEGETARIAN } from './vegetarian';

const SLOT: Record<string, SlotType> = { B: 'breakfast', L: 'lunch', D: 'dinner', S: 'snack' };

function parse(source: string): Recipe[] {
  return source
    .trim()
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .map((line) => {
      const [id, name, slots, primary, flags, minutes, ingredients, steps] = line.split('|').map((s) => s.trim());
      const f = (flags ?? '').split(',').filter(Boolean);
      return {
        id: id!,
        name: name!,
        slots: slots!.split(',').map((s) => SLOT[s]!),
        primaryIngredient: primary!,
        tags: f.includes('m') ? ['mediterranean' as const] : [],
        batchable: f.includes('b'),
        prepMinutes: Number(minutes),
        ingredients: ingredients!.split(',').map((pair) => {
          const [ingredientId, qty] = pair.trim().split(' ');
          return { ingredientId: ingredientId!, quantity: Number(qty) };
        }),
        steps: (steps ?? '').split(' / ').map((s) => s.trim()).filter(Boolean),
      };
    });
}

export const RECIPES: Recipe[] = [BASE, BREAKFAST, SNACKS, VEGAN, VEGAN_KETO, VEGETARIAN, FLEXITARIAN, FISH, MEAT].flatMap(parse);
