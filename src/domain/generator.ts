// Weekly plan generation (REQUIREMENTS §7.3): hard constraints, variety, leftovers and
// macro targeting, as a seeded randomized greedy pass followed by bounded local search.
import { compatibleRecipes, describeConstraints, hasFleshFood, portions } from './compat';
import { MACRO_PROFILES, SLOTS, energyTarget, macroSplit, recipeNutrients } from './nutrition';
import type { Database, Day, Household, Meal, MealRef, PlanSettings, Recipe, SlotId, SlotType } from './types';

export const VARIETY_WINDOW = 3;
export const MAX_COOKS_PER_RECIPE = 2;
export const MAX_PER_PRIMARY = 3;
export const MAX_LEFTOVER_PAIRS = 3;
export const FLEXITARIAN_LIMIT = 3;
const SEARCH_ITERATIONS = 600;

export const DAYS: Day[] = [0, 1, 2, 3, 4, 5, 6];
export const key = (r: MealRef) => `${r.day}:${r.slot}`;

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

/** Every day × slot cell, keeping existing meals that still fit the slot layout. */
export function ensureGrid(meals: Meal[], settings: PlanSettings): Meal[] {
  const byKey = new Map(meals.map((m) => [key(m), m]));
  const out: Meal[] = [];
  for (const day of DAYS)
    for (const slot of SLOTS[settings.mealsPerDay]) {
      const existing = byKey.get(key({ day, slot: slot.id }));
      out.push(existing ? { ...existing } : { day, slot: slot.id, recipeId: null, locked: false });
    }
  // drop leftover links that point at cells that no longer exist
  const keys = new Set(out.map(key));
  for (const m of out) if (m.leftoverOf && !keys.has(key(m.leftoverOf))) delete m.leftoverOf;
  return out;
}

/** The slot a batchable meal's leftovers go to: the next lunch or dinner within 24 h (FR-GEN-6). */
export function leftoverTarget(ref: MealRef, settings: PlanSettings): MealRef | null {
  const slots = SLOTS[settings.mealsPerDay];
  const type = slots.find((s) => s.id === ref.slot)?.type;
  if (type !== 'dinner' && type !== 'lunch') return null;
  const ordered: MealRef[] = [];
  for (const day of DAYS) for (const s of slots) if (s.type === 'lunch' || s.type === 'dinner') ordered.push({ day, slot: s.id });
  const i = ordered.findIndex((r) => r.day === ref.day && r.slot === ref.slot);
  const next = ordered[i + 1];
  if (!next) return null;
  // within 24 h: same day, or the next day at an earlier-or-equal slot
  const order = (id: SlotId) => slots.findIndex((s) => s.id === id);
  if (next.day === ref.day) return next;
  if (next.day === ref.day + 1 && order(next.slot) <= order(ref.slot)) return next;
  return null;
}

// ---- scoring --------------------------------------------------------------------

interface Ctx {
  household: Household;
  settings: PlanSettings;
  db: Database;
  slotType: Map<SlotId, SlotType>;
  targets: { id: string; kcal: number }[];
  macroTarget: { carbs: number; protein: number; fat: number };
  factors: Map<string, number[]>;
  clamps: Map<string, number>;
  flesh: Map<string, boolean>;
}

function makeCtx(household: Household, settings: PlanSettings, db: Database): Ctx {
  const p = MACRO_PROFILES[household.macroProfile];
  return {
    household,
    settings,
    db,
    slotType: new Map(SLOTS[settings.mealsPerDay].map((s) => [s.id, s.type])),
    targets: household.people.map((x) => ({ id: x.id, kcal: energyTarget(x).target })),
    macroTarget: { carbs: p.carbs, protein: p.protein, fat: p.fat },
    factors: new Map(),
    clamps: new Map(),
    flesh: new Map(),
  };
}

function factorsFor(ctx: Ctx, recipe: Recipe, slot: SlotId): number[] {
  const k = recipe.id + '@' + slot;
  let f = ctx.factors.get(k);
  if (!f) {
    const ps = portions(recipe, ctx.household, ctx.settings.mealsPerDay, slot, ctx.db);
    f = ps.map((p) => p.factor);
    ctx.factors.set(k, f);
    ctx.clamps.set(k, ps.filter((p) => p.clamped).length);
  }
  return f;
}

function isFlesh(ctx: Ctx, recipeId: string): boolean {
  let v = ctx.flesh.get(recipeId);
  if (v === undefined) {
    v = hasFleshFood(ctx.db.recipeById.get(recipeId)!, ctx.db);
    ctx.flesh.set(recipeId, v);
  }
  return v;
}

type Assign = Map<string, Meal>;

function dayCost(ctx: Ctx, assign: Assign, day: Day): number {
  if (ctx.targets.length === 0) return 0;
  let total = 0;
  const sums = ctx.targets.map(() => ({ kcal: 0, carbs: 0, protein: 0, fat: 0 }));
  let share = 0;
  let any = false;
  for (const slot of SLOTS[ctx.settings.mealsPerDay]) {
    const m = assign.get(key({ day, slot: slot.id }));
    if (!m?.recipeId) continue;
    const recipe = ctx.db.recipeById.get(m.recipeId);
    if (!recipe) continue;
    any = true;
    share += slot.share;
    const n = recipeNutrients(recipe, ctx.db);
    const f = factorsFor(ctx, recipe, slot.id);
    total += (ctx.clamps.get(recipe.id + '@' + slot.id) ?? 0) * 15;
    f.forEach((x, i) => {
      const s = sums[i]!;
      s.kcal += n.kcal * x;
      s.carbs += n.carbs * x;
      s.protein += n.protein * x;
      s.fat += n.fat * x;
    });
  }
  if (!any) return 0;
  sums.forEach((s, i) => {
    const split = macroSplit(s);
    const t = ctx.macroTarget;
    // macro fit counts double: calories are matched by portion scaling anyway (FR-WP-5)
    total += (2 * (Math.abs(split.carbs - t.carbs) + Math.abs(split.protein - t.protein) + Math.abs(split.fat - t.fat))) / ctx.targets.length;
    const kcalTarget = ctx.targets[i]!.kcal * share;
    total += (Math.abs(s.kcal - kcalTarget) / kcalTarget) * 50 / ctx.targets.length;
  });
  return total;
}

function varietyCost(ctx: Ctx, assign: Assign): { cost: number; violations: number } {
  const cooked: { recipe: Recipe; day: number }[] = [];
  for (const m of assign.values()) {
    if (!m.recipeId || m.leftoverOf) continue;
    const r = ctx.db.recipeById.get(m.recipeId);
    if (r) cooked.push({ recipe: r, day: m.day });
  }
  let cost = 0;
  let violations = 0;
  const perRecipe = new Map<string, number[]>();
  const perPrimary = new Map<string, number>();
  for (const c of cooked) {
    const days = perRecipe.get(c.recipe.id) ?? [];
    days.push(c.day);
    perRecipe.set(c.recipe.id, days);
    perPrimary.set(c.recipe.primaryIngredient, (perPrimary.get(c.recipe.primaryIngredient) ?? 0) + 1);
  }
  for (const days of perRecipe.values()) {
    if (days.length > MAX_COOKS_PER_RECIPE) { cost += (days.length - MAX_COOKS_PER_RECIPE) * 60; violations++; }
    for (let i = 0; i < days.length; i++)
      for (let j = i + 1; j < days.length; j++)
        if (Math.abs(days[i]! - days[j]!) < VARIETY_WINDOW) { cost += 40; violations++; }
  }
  for (const n of perPrimary.values()) if (n > MAX_PER_PRIMARY) { cost += (n - MAX_PER_PRIMARY) * 20; violations++; }
  return { cost, violations };
}

function totalCost(ctx: Ctx, assign: Assign): number {
  let c = varietyCost(ctx, assign).cost;
  for (const d of DAYS) c += dayCost(ctx, assign, d);
  return c;
}

function fleshCount(ctx: Ctx, assign: Assign): number {
  let n = 0;
  for (const m of assign.values()) if (m.recipeId && ctx.db.recipeById.has(m.recipeId) && isFlesh(ctx, m.recipeId)) n++;
  return n;
}

// ---- generation -------------------------------------------------------------------

export interface GenerateInput {
  household: Household;
  settings: PlanSettings;
  meals: Meal[];
  seed: number;
  db: Database;
  /** Only regenerate this day (FR-GEN-1 "Regenerate day"). */
  day?: Day;
}

export interface GenerateResult {
  meals: Meal[];
  warnings: string[];
  empty: { ref: MealRef; reason: string }[];
}

export function generate(input: GenerateInput): GenerateResult {
  const { household, settings, db, seed } = input;
  const rand = mulberry32(seed);
  const ctx = makeCtx(household, settings, db);
  const grid = ensureGrid(input.meals, settings);

  // fixed: locked meals, meals outside the regenerated day, and their leftover partners
  const fixed = new Set<string>();
  for (const m of grid) if (m.locked || (input.day !== undefined && m.day !== input.day)) fixed.add(key(m));
  let grew = true;
  while (grew) {
    grew = false;
    for (const m of grid) {
      if (!m.leftoverOf) continue;
      const a = key(m), b = key(m.leftoverOf);
      if (fixed.has(a) !== fixed.has(b)) { fixed.add(a); fixed.add(b); grew = true; }
    }
  }

  const assign: Assign = new Map();
  for (const m of grid) {
    if (fixed.has(key(m))) {
      // stale recipe ids (FR-DATA-6) stay as they are; the UI flags them
      assign.set(key(m), { ...m });
    } else assign.set(key(m), { day: m.day, slot: m.slot, recipeId: null, locked: false });
  }

  const candidates = new Map<SlotType, Recipe[]>();
  for (const t of new Set(ctx.slotType.values())) candidates.set(t, compatibleRecipes(household, t, db));
  const flexLimit = household.diet === 'flexitarian' ? FLEXITARIAN_LIMIT : Infinity;
  let pairs = [...assign.values()].filter((m) => m.leftoverOf && m.recipeId).length;
  const empty: GenerateResult['empty'] = [];

  const order = grid.filter((m) => !fixed.has(key(m)));
  for (const cell of order) {
    const k = key(cell);
    if (assign.get(k)!.recipeId) continue; // already filled as leftovers
    const type = ctx.slotType.get(cell.slot)!;
    const pool = (candidates.get(type) ?? []).filter((r) => !isFlesh(ctx, r.id) || fleshCount(ctx, assign) + 1 <= flexLimit);
    if (pool.length === 0) {
      empty.push({ ref: { day: cell.day, slot: cell.slot }, reason: describeConstraints(household, type) });
      continue;
    }
    const scored = pool.map((r) => {
      assign.set(k, { day: cell.day, slot: cell.slot, recipeId: r.id, locked: false });
      return { r, c: totalCost(ctx, assign) };
    });
    scored.sort((a, b) => a.c - b.c);
    const top = scored.slice(0, Math.min(4, scored.length));
    const pick = top[Math.floor(rand() * top.length)]!.r;
    assign.set(k, { day: cell.day, slot: cell.slot, recipeId: pick.id, locked: false });

    // leftovers: cook twice, eat again at the next lunch or dinner within 24 h
    if (settings.leftoversEnabled && pick.batchable && pairs < MAX_LEFTOVER_PAIRS && rand() < 0.6) {
      const target = leftoverTarget(cell, settings);
      if (target) {
        const tk = key(target);
        const t = assign.get(tk);
        const tType = ctx.slotType.get(target.slot)!;
        const fleshOk = !isFlesh(ctx, pick.id) || fleshCount(ctx, assign) + 1 <= flexLimit;
        if (t && !fixed.has(tk) && !t.recipeId && pick.slots.includes(tType) && fleshOk) {
          assign.set(tk, { ...target, recipeId: pick.id, locked: false, leftoverOf: { day: cell.day, slot: cell.slot } });
          pairs++;
        }
      }
    }
  }

  // local search: swap single cooked meals while the score improves
  const movable = order.map(key).filter((k) => assign.get(k)!.recipeId && !assign.get(k)!.leftoverOf);
  if (movable.length > 0) {
    let best = totalCost(ctx, assign);
    for (let i = 0; i < SEARCH_ITERATIONS; i++) {
      const k = movable[Math.floor(rand() * movable.length)]!;
      const cur = assign.get(k)!;
      const type = ctx.slotType.get(cur.slot)!;
      const pool = candidates.get(type) ?? [];
      const cand = pool[Math.floor(rand() * pool.length)];
      if (!cand || cand.id === cur.recipeId) continue;
      const follower = [...assign.entries()].find(([, m]) => m.leftoverOf && key(m.leftoverOf) === k);
      if (follower) {
        const fType = ctx.slotType.get(follower[1].slot)!;
        if (!cand.batchable || !cand.slots.includes(fType)) continue;
      }
      const prev = cur.recipeId;
      assign.set(k, { ...cur, recipeId: cand.id });
      if (follower) assign.set(follower[0], { ...follower[1], recipeId: cand.id });
      const c = totalCost(ctx, assign);
      if (c < best && fleshCount(ctx, assign) <= flexLimit) best = c;
      else {
        assign.set(k, { ...cur, recipeId: prev });
        if (follower) assign.set(follower[0], follower[1]);
      }
    }
  }

  const warnings: string[] = [];
  if (varietyCost(ctx, assign).violations > 0) warnings.push('Not enough compatible recipes for full variety, so some dishes repeat.');
  if (empty.length > 0) warnings.push(`${empty.length} meal${empty.length > 1 ? 's' : ''} could not be filled with these settings.`);
  return { meals: grid.map((m) => assign.get(key(m))!), warnings, empty };
}

// ---- manual editing helpers ---------------------------------------------------------

export interface Alternative {
  recipe: Recipe;
  fit: 'best' | 'good' | 'ok';
  cookedNearby?: Day;
}

/** Compatible recipes for one cell, best macro fit for that day first (FR-WP-8). */
export function rankAlternatives(household: Household, settings: PlanSettings, meals: Meal[], ref: MealRef, db: Database): Alternative[] {
  const ctx = makeCtx(household, settings, db);
  const type = ctx.slotType.get(ref.slot);
  if (!type) return [];
  const assign: Assign = new Map(ensureGrid(meals, settings).map((m) => [key(m), m]));
  const k = key(ref);
  const cur = assign.get(k)!;
  const flexLimit = household.diet === 'flexitarian' ? FLEXITARIAN_LIMIT : Infinity;
  const othersFlesh = fleshCount(ctx, assign) - (cur.recipeId && db.recipeById.has(cur.recipeId) && isFlesh(ctx, cur.recipeId) ? 1 : 0);
  const scored = compatibleRecipes(household, type, db)
    .filter((r) => !isFlesh(ctx, r.id) || othersFlesh + 1 <= flexLimit)
    .map((r) => {
      assign.set(k, { ...cur, recipeId: r.id, leftoverOf: undefined });
      return { r, c: dayCost(ctx, assign, ref.day) };
    })
    .sort((a, b) => a.c - b.c);
  assign.set(k, cur);
  const best = scored[0]?.c ?? 0;
  return scored.map(({ r, c }, i) => {
    let near: Day | undefined;
    for (const m of assign.values())
      if (m.recipeId === r.id && key(m) !== k && !m.leftoverOf && Math.abs(m.day - ref.day) < VARIETY_WINDOW) near = m.day;
    const fit: Alternative['fit'] = i === 0 ? 'best' : c - best < 8 ? 'good' : 'ok';
    return { recipe: r, fit, cookedNearby: near };
  });
}
