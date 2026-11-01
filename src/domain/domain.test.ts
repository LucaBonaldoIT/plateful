import { describe, expect, it } from 'vitest';
import { db } from '../data';
import { allergensOf, fitsDiet, hasFleshFood, isCompatible, portions } from './compat';
import { generate, key, leftoverTarget, VARIETY_WINDOW } from './generator';
import { choosePackages, clipboardText, formatQuantity, groceryList, roundAmount } from './grocery';
import { SLOTS, bmr, energyTarget, macroGrams } from './nutrition';
import { LEGAL_VERSION, nextMonday, parseData } from './schema';
import type { Household, Person, Plan, PlanSettings, PlatefulData } from './types';

const giulia: Person = { id: 'g', name: 'Giulia', sex: 'female', age: 34, weightKg: 62, heightCm: 168, activity: 'moderate', goal: 'maintain' };
const marco: Person = { id: 'm', name: 'Marco', sex: 'male', age: 36, weightKg: 82, heightCm: 181, activity: 'high', goal: 'lose' };
const household: Household = { people: [giulia, marco], diet: 'vegetarian', macroProfile: 'high-protein', excludedAllergens: ['gluten'] };
const settings: PlanSettings = { mealsPerDay: 3, leftoversEnabled: true };

function plan(h = household, s = settings, seed = 1): Plan {
  const res = generate({ household: h, settings: s, meals: [], seed, db });
  return { id: 'p', name: 'Week', weekStart: '2026-11-02', createdAt: '', updatedAt: '', household: h, settings: s, meals: res.meals, seed };
}

describe('nutrition (§6)', () => {
  it('computes Mifflin-St Jeor, TDEE and goal targets', () => {
    expect(Math.round(bmr(giulia))).toBe(1339);
    expect(energyTarget(giulia)).toMatchObject({ tdee: 2075, target: 2075, floorApplied: false });
    expect(energyTarget(marco)).toMatchObject({ bmr: 1776, tdee: 3064, target: 2564 });
  });

  it('applies the safety floor', () => {
    const small: Person = { ...giulia, weightKg: 45, heightCm: 150, age: 70, activity: 'sedentary', goal: 'lose' };
    const t = energyTarget(small);
    expect(t.floorApplied).toBe(true);
    expect(t.target).toBeGreaterThanOrEqual(1200);
    expect(t.target).toBeGreaterThanOrEqual(t.bmr);
  });

  it('converts profile shares to grams', () => {
    expect(macroGrams(2075, 'high-protein')).toEqual({ carbs: 182, protein: 182, fat: 69 });
  });

  it('defines slot shares that sum to 100%', () => {
    for (const slots of Object.values(SLOTS)) expect(slots.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1);
  });
});

describe('compatibility (FR-HH-6/7/12)', () => {
  const r = (id: string) => db.recipeById.get(id)!;
  it('derives diet and allergens from ingredients', () => {
    expect(fitsDiet(r('red-lentil-dal'), 'vegan', db)).toBe(true);
    expect(fitsDiet(r('greek-yogurt-bowl'), 'vegan', db)).toBe(false); // dairy + honey
    expect(fitsDiet(r('salmon-poke'), 'vegetarian', db)).toBe(false);
    expect(fitsDiet(r('salmon-poke'), 'pescatarian', db)).toBe(true);
    expect(hasFleshFood(r('chili-con-carne'), db)).toBe(true);
    expect(allergensOf(r('lentil-bolognese'), db).has('gluten')).toBe(true);
    expect(isCompatible(r('lentil-bolognese'), household, 'dinner', db)).toBe(false);
  });

  it('clamps portion factors to 0.5–2.0 in 0.05 steps', () => {
    for (const p of portions(r('boiled-eggs'), household, 4, 'afternoon-snack', db)) {
      expect(p.factor).toBeGreaterThanOrEqual(0.5);
      expect(p.factor).toBeLessThanOrEqual(2);
      expect(Math.round(p.factor * 20)).toBeCloseTo(p.factor * 20);
    }
  });
});

describe('generator (§7.3)', () => {
  it('never breaks hard constraints across many seeds', () => {
    const cases: Household[] = [
      household,
      { ...household, diet: 'vegan', excludedAllergens: [] },
      { ...household, diet: 'flexitarian', macroProfile: 'balanced', excludedAllergens: [] },
      { ...household, diet: 'omnivore', macroProfile: 'keto', excludedAllergens: [] },
    ];
    for (const h of cases)
      for (let seed = 1; seed <= 40; seed++) {
        const res = generate({ household: h, settings: { mealsPerDay: 4, leftoversEnabled: true }, meals: [], seed, db });
        let flesh = 0;
        for (const m of res.meals) {
          if (!m.recipeId) continue;
          const recipe = db.recipeById.get(m.recipeId)!;
          const type = SLOTS[4].find((s) => s.id === m.slot)!.type;
          expect(isCompatible(recipe, h, type, db)).toBe(true);
          if (hasFleshFood(recipe, db)) flesh++;
        }
        if (h.diet === 'flexitarian') expect(flesh).toBeLessThanOrEqual(3);
      }
  });

  it('is deterministic for a seed', () => {
    expect(plan(household, settings, 7).meals).toEqual(plan(household, settings, 7).meals);
  });

  it('keeps locked meals and links leftovers to the next lunch or dinner', () => {
    const first = plan();
    const locked = first.meals.map((m) => (m.day === 2 && m.slot === 'lunch' ? { ...m, locked: true } : m));
    const again = generate({ household, settings, meals: locked, seed: 99, db });
    expect(again.meals.find((m) => m.day === 2 && m.slot === 'lunch')!.recipeId).toBe(locked.find((m) => m.day === 2 && m.slot === 'lunch')!.recipeId);
    expect(leftoverTarget({ day: 0, slot: 'dinner' }, settings)).toEqual({ day: 1, slot: 'lunch' });
    expect(leftoverTarget({ day: 6, slot: 'dinner' }, settings)).toBeNull();
    for (const m of again.meals.filter((x) => x.leftoverOf)) {
      const src = again.meals.find((x) => key(x) === key(m.leftoverOf!))!;
      expect(src.recipeId).toBe(m.recipeId);
      expect(db.recipeById.get(src.recipeId!)!.batchable).toBe(true);
    }
    expect(again.meals.filter((x) => x.leftoverOf).length).toBeLessThanOrEqual(3);
  });

  it('mostly avoids repeats within the variety window', () => {
    const p = plan({ ...household, excludedAllergens: [] }, settings, 3);
    const cooked = p.meals.filter((m) => m.recipeId && !m.leftoverOf);
    let close = 0;
    for (const a of cooked) for (const b of cooked) if (a !== b && a.recipeId === b.recipeId && Math.abs(a.day - b.day) < VARIETY_WINDOW) close++;
    expect(close).toBe(0);
  });

  it('runs fast enough (NFR-PERF-1)', () => {
    const big: Household = { ...household, people: Array.from({ length: 12 }, (_, i) => ({ ...giulia, id: String(i) })) };
    const t = performance.now();
    generate({ household: big, settings: { mealsPerDay: 6, leftoversEnabled: true }, meals: [], seed: 1, db });
    expect(performance.now() - t).toBeLessThan(1500); // generous for CI; typically far less
  });
});

describe('grocery list (§8)', () => {
  it('rounds amounts', () => {
    expect(roundAmount(42, 'g')).toBe(40);
    expect(roundAmount(456, 'g')).toBe(460);
    expect(roundAmount(1234, 'g')).toBe(1250);
    expect(roundAmount(13.2, 'piece')).toBe(14);
    expect(formatQuantity(1250, 'g')).toBe('1.25 kg');
    expect(formatQuantity(800, 'ml')).toBe('800 ml');
  });

  it('chooses packages with least overage, then fewest packages', () => {
    expect(choosePackages(600, [200])).toEqual([3]);
    expect(choosePackages(1050, [750, 500, 300])).toEqual([1, 0, 1]);
    expect(choosePackages(14, [10, 6])).toEqual([1, 1]);
    expect(choosePackages(1300, [1000, 500])).toEqual([1, 1]);
  });

  it('produces the exact clipboard format (FR-GL-5)', () => {
    const p = plan();
    const list = groceryList(p, db);
    const text = clipboardText(p, list);
    expect(text.startsWith('Plateful — Week of 2 Nov 2026\n\n')).toBe(true);
    expect(text).toMatch(/\n[A-Z ,&]+\n- \[ \] .+ — .+/);
    for (const line of text.split('\n').filter((l) => l.startsWith('- '))) expect(line).toMatch(/^- \[ \] .+ — [\d.]+( (g|kg|ml|L))?( \(.+\))?$/);
    expect(list.count).toBeGreaterThan(10);
  });
});

describe('data (§10)', () => {
  it('round-trips an export and rejects bad files', () => {
    const data: PlatefulData = {
      app: 'plateful', schemaVersion: 1, legal: { acceptedVersion: LEGAL_VERSION, acceptedAt: new Date().toISOString() },
      onboarded: true, household, defaultSettings: settings, plans: [plan()],
    };
    const res = parseData(JSON.stringify(data));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data).toEqual(data);
    expect(parseData('{').ok).toBe(false);
    expect(parseData('{"app":"other"}').ok).toBe(false);
    expect(parseData(JSON.stringify({ ...data, schemaVersion: 2 })).ok).toBe(false);
    expect(parseData(JSON.stringify({ ...data, household: { ...household, people: [{ ...giulia, age: 12 }] } })).ok).toBe(false);
  });

  it('starts plans on Monday', () => {
    expect(nextMonday(new Date(2026, 10, 1))).toBe('2026-11-02'); // Sunday → Monday
    expect(nextMonday(new Date(2026, 10, 2))).toBe('2026-11-02'); // Monday stays
  });
});
