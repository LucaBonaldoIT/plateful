// App state: one PlatefulData document persisted to localStorage (FR-DATA-1/2, NFR-REL-1).
import { create } from 'zustand';
import { ensureGrid, generate, key, leftoverTarget, newSeed } from '../domain/generator';
import { LEGAL_VERSION, STORAGE_KEY, newId, nextMonday, parseData } from '../domain/schema';
import { weekLabel } from '../domain/grocery';
import type { Database, Day, Household, Meal, MealRef, Person, Plan, PlanSettings, PlatefulData } from '../domain/types';

let DB: Database | null = null;
export function setDatabase(db: Database) {
  DB = db;
}
export const database = (): Database => {
  if (!DB) throw new Error('Database not loaded');
  return DB;
};

export const emptyHousehold = (): Household => ({ people: [], diet: 'omnivore', macroProfile: 'balanced', excludedAllergens: [] });
export const defaultSettings = (): PlanSettings => ({ mealsPerDay: 3, leftoversEnabled: true });

type Status = 'new' | 'ready' | 'corrupt';

interface State {
  status: Status;
  data: PlatefulData | null;
  corruptRaw: string | null;
  storageError: boolean;
  lastWarnings: string[];

  acceptLegal(): void;
  setHousehold(fn: (h: Household) => Household): void;
  upsertPerson(p: Person): void;
  removePerson(id: string): void;
  setDefaultSettings(s: PlanSettings): void;
  completeOnboarding(): void;

  createPlan(weekStart: string, settings: PlanSettings): string;
  regenerate(planId: string, day?: Day): void;
  swapMeal(planId: string, ref: MealRef, recipeId: string): void;
  toggleLock(planId: string, ref: MealRef): void;
  clearMeal(planId: string, ref: MealRef): void;
  unlinkLeftover(planId: string, ref: MealRef): void;
  makeLeftovers(planId: string, ref: MealRef): void;
  renamePlan(planId: string, name: string): void;
  duplicatePlan(planId: string, weekStart: string): string;
  deletePlan(planId: string): void;
  updateFromHousehold(planId: string): void;

  importData(data: PlatefulData): void;
  deleteAll(): void;
  resetCorrupt(): void;
}

function load(): Pick<State, 'status' | 'data' | 'corruptRaw'> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return { status: 'new', data: null, corruptRaw: null };
  }
  if (!raw) return { status: 'new', data: null, corruptRaw: null };
  const res = parseData(raw);
  return res.ok ? { status: 'ready', data: res.data, corruptRaw: null } : { status: 'corrupt', data: null, corruptRaw: raw };
}

const now = () => new Date().toISOString();

function uniqueName(plans: Plan[], base: string): string {
  if (!plans.some((p) => p.name === base)) return base;
  let n = 2;
  while (plans.some((p) => p.name === `${base} (${n})`)) n++;
  return `${base} (${n})`;
}

export const useStore = create<State>((set, get) => {
  const update = (fn: (d: PlatefulData) => PlatefulData) => {
    const d = get().data;
    if (d) set({ data: fn(d) });
  };
  const updatePlan = (planId: string, fn: (p: Plan) => Plan) =>
    update((d) => ({ ...d, plans: d.plans.map((p) => (p.id === planId ? { ...fn(p), updatedAt: now() } : p)) }));
  const mapMeal = (p: Plan, ref: MealRef, fn: (m: Meal) => Meal): Plan => ({
    ...p,
    meals: p.meals.map((m) => (key(m) === key(ref) ? fn(m) : m)),
  });
  /** Meals that eat leftovers of `ref`. */
  const followersOf = (p: Plan, ref: MealRef) => p.meals.filter((m) => m.leftoverOf && key(m.leftoverOf) === key(ref));

  return {
    ...load(),
    storageError: false,
    lastWarnings: [],

    acceptLegal() {
      const legal = { acceptedVersion: LEGAL_VERSION, acceptedAt: now() };
      const d = get().data;
      set({
        status: 'ready',
        data: d
          ? { ...d, legal }
          : { app: 'plateful', schemaVersion: 1, legal, onboarded: false, household: emptyHousehold(), defaultSettings: defaultSettings(), plans: [] },
      });
    },
    setHousehold: (fn) => update((d) => ({ ...d, household: fn(d.household) })),
    upsertPerson(p) {
      get().setHousehold((h) => ({
        ...h,
        people: h.people.some((x) => x.id === p.id) ? h.people.map((x) => (x.id === p.id ? p : x)) : [...h.people, p],
      }));
    },
    removePerson: (id) => get().setHousehold((h) => ({ ...h, people: h.people.filter((p) => p.id !== id) })),
    setDefaultSettings: (s) => update((d) => ({ ...d, defaultSettings: s })),
    completeOnboarding: () => update((d) => ({ ...d, onboarded: true })),

    createPlan(weekStart, settings) {
      const d = get().data!;
      const seed = newSeed();
      const household = structuredClone(d.household);
      const res = generate({ household, settings, meals: [], seed, db: database() });
      const plan: Plan = {
        id: newId(),
        name: uniqueName(d.plans, weekLabel(weekStart)),
        weekStart,
        createdAt: now(),
        updatedAt: now(),
        household,
        settings,
        meals: res.meals,
        seed,
      };
      set({ data: { ...d, plans: [plan, ...d.plans] }, lastWarnings: res.warnings });
      return plan.id;
    },
    regenerate(planId, day) {
      const p = get().data?.plans.find((x) => x.id === planId);
      if (!p) return;
      const seed = newSeed();
      const res = generate({ household: p.household, settings: p.settings, meals: p.meals, seed, db: database(), day });
      updatePlan(planId, (x) => ({ ...x, meals: res.meals, seed }));
      set({ lastWarnings: res.warnings });
    },
    swapMeal(planId, ref, recipeId) {
      updatePlan(planId, (p) => {
        let next = mapMeal(p, ref, (m) => ({ day: m.day, slot: m.slot, recipeId, locked: true }));
        for (const f of followersOf(p, ref)) next = mapMeal(next, f, (m) => ({ day: m.day, slot: m.slot, recipeId: null, locked: false }));
        return next;
      });
    },
    toggleLock: (planId, ref) => updatePlan(planId, (p) => mapMeal(p, ref, (m) => ({ ...m, locked: !m.locked }))),
    clearMeal(planId, ref) {
      updatePlan(planId, (p) => {
        let next = mapMeal(p, ref, (m) => ({ day: m.day, slot: m.slot, recipeId: null, locked: m.locked }));
        for (const f of followersOf(p, ref)) next = mapMeal(next, f, (m) => ({ day: m.day, slot: m.slot, recipeId: null, locked: false }));
        return next;
      });
    },
    unlinkLeftover: (planId, ref) =>
      updatePlan(planId, (p) => mapMeal(p, ref, (m) => ({ day: m.day, slot: m.slot, recipeId: m.recipeId, locked: m.locked }))),
    makeLeftovers(planId, ref) {
      updatePlan(planId, (p) => {
        const src = p.meals.find((m) => key(m) === key(ref));
        const target = leftoverTarget(ref, p.settings);
        if (!src?.recipeId || !target) return p;
        let next = p;
        for (const f of followersOf(p, target)) next = mapMeal(next, f, (m) => ({ day: m.day, slot: m.slot, recipeId: null, locked: false }));
        return mapMeal(next, target, () => ({ ...target, recipeId: src.recipeId, locked: false, leftoverOf: { day: src.day, slot: src.slot } }));
      });
    },
    renamePlan: (planId, name) => updatePlan(planId, (p) => ({ ...p, name: name.trim().slice(0, 80) || p.name })),
    duplicatePlan(planId, weekStart) {
      const d = get().data!;
      const src = d.plans.find((p) => p.id === planId)!;
      const copy: Plan = {
        ...structuredClone(src),
        id: newId(),
        name: uniqueName(d.plans, weekLabel(weekStart)),
        weekStart,
        createdAt: now(),
        updatedAt: now(),
      };
      set({ data: { ...d, plans: [copy, ...d.plans] } });
      return copy.id;
    },
    deletePlan: (planId) => update((d) => ({ ...d, plans: d.plans.filter((p) => p.id !== planId) })),
    updateFromHousehold(planId) {
      const h = get().data!.household;
      updatePlan(planId, (p) => ({ ...p, household: structuredClone(h) }));
    },

    importData: (data) => set({ status: 'ready', data: { ...data, exportedAt: undefined }, corruptRaw: null }),
    deleteAll() {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* storage unavailable: nothing to remove */
      }
      set({ status: 'new', data: null, corruptRaw: null });
    },
    resetCorrupt: () => get().deleteAll(),
  };
});

// ---- persistence (debounced, FR-DATA-2) ---------------------------------------------

let timer: ReturnType<typeof setTimeout> | undefined;
useStore.subscribe((state, prev) => {
  if (state.data === prev.data || !state.data) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(useStore.getState().data));
      if (useStore.getState().storageError) useStore.setState({ storageError: false });
    } catch {
      useStore.setState({ storageError: true });
    }
  }, 300);
});

export function exportJson(): string {
  const d = useStore.getState().data;
  return JSON.stringify({ ...d, exportedAt: now() }, null, 2);
}

export function download(filename: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const needsLegal = (d: PlatefulData | null) => !d || d.legal.acceptedVersion !== LEGAL_VERSION;
export { ensureGrid, nextMonday };
