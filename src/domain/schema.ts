// Persisted document schema, validation and migrations (FR-DATA-1/4, NFR-TECH-3).
import { z } from 'zod';
import type { PlatefulData } from './types';

export const STORAGE_KEY = 'plateful:v1';
export const LEGAL_VERSION = '2026-11-01';

const slotId = z.enum(['breakfast', 'morning-snack', 'lunch', 'afternoon-snack', 'dinner', 'evening-snack']);
const day = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const personSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(40),
  sex: z.enum(['female', 'male']),
  age: z.number().int().min(18).max(100),
  weightKg: z.number().min(30).max(300),
  heightCm: z.number().int().min(120).max(230),
  activity: z.enum(['sedentary', 'moderate', 'high']),
  goal: z.enum(['lose', 'maintain', 'gain']),
});

const householdSchema = z.object({
  people: z.array(personSchema).max(12),
  diet: z.enum(['omnivore', 'flexitarian', 'pescatarian', 'vegetarian', 'vegan']),
  macroProfile: z.enum(['balanced', 'keto', 'low-carb', 'high-carb', 'high-protein', 'mediterranean', 'zone', 'low-fat']),
  excludedAllergens: z.array(z.enum(['gluten', 'dairy', 'eggs', 'tree-nuts', 'peanuts', 'soy', 'fish', 'shellfish', 'sesame'])),
});

const settingsSchema = z.object({
  mealsPerDay: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  leftoversEnabled: z.boolean(),
});

const mealSchema = z.object({
  day,
  slot: slotId,
  recipeId: z.string().max(80).nullable(),
  locked: z.boolean(),
  leftoverOf: z.object({ day, slot: slotId }).optional(),
});

const planSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(80),
  weekStart: isoDate,
  createdAt: z.string(),
  updatedAt: z.string(),
  household: householdSchema,
  settings: settingsSchema,
  meals: z.array(mealSchema).max(42),
  seed: z.number().int(),
});

export const dataSchema = z.object({
  app: z.literal('plateful'),
  schemaVersion: z.literal(1),
  exportedAt: z.string().optional(),
  legal: z.object({ acceptedVersion: z.string(), acceptedAt: z.string() }),
  onboarded: z.boolean(),
  household: householdSchema,
  defaultSettings: settingsSchema,
  plans: z.array(planSchema).max(500),
});

/** Upgrade older documents to the current schema version. Version 1 is the first. */
function migrate(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && !('schemaVersion' in raw)) return { ...raw, schemaVersion: 1 };
  return raw;
}

export type ParseResult = { ok: true; data: PlatefulData } | { ok: false; error: string };

export function parseData(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' };
  }
  if (!raw || typeof raw !== 'object' || (raw as { app?: unknown }).app !== 'plateful')
    return { ok: false, error: "This doesn't look like a Plateful export." };
  const v = (raw as { schemaVersion?: unknown }).schemaVersion;
  if (typeof v === 'number' && v > 1) return { ok: false, error: 'This file comes from a newer version of Plateful.' };
  const res = dataSchema.safeParse(migrate(raw));
  if (!res.success) {
    const issue = res.error.issues[0];
    return { ok: false, error: `The file is damaged or incomplete${issue ? ` (${issue.path.join('.') || 'root'}: ${issue.message})` : ''}.` };
  }
  return { ok: true, data: res.data as PlatefulData };
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ---- dates (plans run Monday to Sunday, FR-PS-2) --------------------------------------

export function toIsoDate(d: Date): string {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** The next Monday on or after `from`. */
export function nextMonday(from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const add = (8 - d.getDay()) % 7;
  d.setDate(d.getDate() + add);
  return toIsoDate(d);
}

export function addDays(iso: string, n: number): Date {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d;
}

export function shortDay(iso: string, n: number): { dow: string; date: number } {
  const d = addDays(iso, n);
  return { dow: d.toLocaleString('en-GB', { weekday: 'short' }), date: d.getDate() };
}

export function weekRange(iso: string): string {
  const a = addDays(iso, 0), b = addDays(iso, 6);
  const m = (d: Date) => d.toLocaleString('en-GB', { month: 'short' });
  return a.getMonth() === b.getMonth()
    ? `Mon ${a.getDate()} – Sun ${b.getDate()} ${m(b)}`
    : `Mon ${a.getDate()} ${m(a)} – Sun ${b.getDate()} ${m(b)}`;
}
