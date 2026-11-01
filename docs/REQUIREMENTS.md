# Plateful — Requirements

Plateful is a client-only web app that plans a week of meals for a household and turns it into
a grocery list of raw ingredients that can be copied to the clipboard.

- **Status:** draft v1, 2026-11-01
- **Platform:** Vite + React + TypeScript single-page app, no backend
- **Language:** English only, metric units only

Requirement IDs (`FR-*`, `NFR-*`) are stable so issues and commits can reference them. Every
choice is listed in [§12 Decision log](#12-decision-log): those made by the product owner, and
the defaults chosen during drafting that the product owner delegated.

---

## 1. Goals and non-goals

### Goals

1. Describe a household once: its diet, macro profile, allergens and people (body data,
   activity, goal).
2. Get a week of shared dishes whose portions are sized for each person's calorie target.
3. Generate the week automatically, then adjust it by hand (swap and lock meals).
4. Get an aggregated grocery list of raw ingredients with exact amounts and suggested
   packages, grouped by aisle, and copy it in one click.
5. Keep all data on the device. Export, import and delete it as a single JSON file.

### Non-goals (v1)

- No backend, accounts, sync or analytics. No network calls at runtime (fonts are self-hosted).
- No user-created or user-edited recipes or ingredients. The database is bundled and read-only.
- No AI or external recipe/nutrition APIs.
- No in-app shopping checklist (checkboxes exist only in the copied text), no pantry/"already
  have it" handling, no manual extra items.
- No per-person menus. Everyone eats the same dishes.
- No calorie or nutrition planning for minors (under 18).
- No imperial units, no translations, no PWA/offline install.
- No medical advice. The app shows estimates only (see FR-NUT-8 and §16).

---

## 2. Glossary

| Term             | Meaning                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Household        | The group of people eating together. It has one diet, one macro profile and one allergen set. |
| Person           | An adult in the household with body data, activity level and goal.                            |
| Diet type        | Which food categories are allowed (vegan, vegetarian, …).                                     |
| Macro profile    | Target split of daily calories between carbohydrates, protein and fat.                        |
| Slot             | A named meal position in the day (breakfast, lunch, dinner, snack).                           |
| Recipe / dish    | A bundled dish with raw ingredient quantities for **one base serving**.                       |
| Portion factor   | Multiplier on a recipe's base serving for one person in one slot.                             |
| Meal             | One cell of the plan: a day and slot with an assigned recipe.                                 |
| Leftover meal    | A meal that eats food cooked in an earlier meal (batch cooking), with no extra cooking.       |
| Plan             | A saved week (Monday–Sunday) of meals plus the settings snapshot it was built from.           |
| TDEE             | Total daily energy expenditure, i.e. maintenance calories.                                    |
| As-purchased     | Raw weight as bought, including inedible parts such as peel or bone.                          |

---

## 3. User flow

```
Household setup ──► Plan settings ──► Weekly plan ──► Grocery list ──► Copy to clipboard
 (people, diet,      (meals/day,       (generate,       (grouped,
  macros, allergens)  leftovers, week)  swap, lock)      exact + packages)
```

On first launch the app asks the user to accept the Disclaimer, Terms and Privacy Policy
(FR-LEGAL-2), then opens a short guided setup (household, then plan settings) and ends on
an empty weekly plan with a prominent **Generate week** button. Afterwards, the home screen is
the list of saved plans.

---

## 4. Functional requirements: household

### 4.1 People

- **FR-HH-1** A household has 1–12 people.
- **FR-HH-2** Each person has these fields, all required:

  | Field          | Type / values                         | Validation      |
  | -------------- | ------------------------------------- | --------------- |
  | Name           | text                                  | 1–40 characters |
  | Sex            | `female` \| `male`                    | used by the BMR formula, labelled as such |
  | Age            | integer, years                        | 18–100          |
  | Weight         | number, kg, one decimal               | 30–300          |
  | Height         | integer, cm                           | 120–230         |
  | Activity level | `sedentary` \| `moderate` \| `high`   |                 |
  | Goal           | `lose` \| `maintain` \| `gain`        |                 |

- **FR-HH-3** Ages under 18 are rejected with the message: "Plateful plans for adults only."
- **FR-HH-4** People can be added, edited, reordered and removed. Removing a person asks for
  confirmation.
- **FR-HH-5** Each person card shows that person's computed BMR, TDEE and daily calorie target
  and macro targets in grams, updating live (see §6).

### 4.2 Diet type (household-wide)

- **FR-HH-6** Exactly one diet type is selected for the household:

  | Diet         | Allowed animal categories                    | Extra rule                                    |
  | ------------ | -------------------------------------------- | --------------------------------------------- |
  | Omnivore     | all                                          | —                                             |
  | Flexitarian  | all                                          | ≤ 3 meals per week contain meat, fish or seafood |
  | Pescatarian  | dairy, eggs, honey, fish, seafood            | —                                             |
  | Vegetarian   | dairy, eggs, honey (lacto-ovo)               | —                                             |
  | Vegan        | none                                         | no honey, no other animal products            |

- **FR-HH-7** A recipe's diet compatibility is **derived from its ingredients'** animal
  categories, never tagged by hand, so a recipe cannot be mislabelled.

### 4.3 Macro profile (household-wide)

- **FR-HH-8** Exactly one macro profile is selected for the household. Percentages are shares of
  daily kcal (carbs / protein / fat):

  | Profile       | Carbs | Protein | Fat | Hard recipe filter                           |
  | ------------- | ----: | ------: | --: | -------------------------------------------- |
  | Balanced      |   50  |    20   |  30 | —                                            |
  | Keto          |    5  |    20   |  75 | recipe net carbs ≤ 10 % of its kcal          |
  | Low-carb      |   20  |    30   |  50 | recipe net carbs ≤ 30 % of its kcal          |
  | High-carb     |   60  |    15   |  25 | —                                            |
  | High-protein  |   35  |    35   |  30 | —                                            |
  | Mediterranean |   45  |    18   |  37 | recipe tagged `mediterranean`                |
  | Zone          |   40  |    30   |  30 | —                                            |
  | Low-fat       |   60  |    20   |  20 | —                                            |

- **FR-HH-9** Each profile shows a one-line description in the selector.
- **FR-HH-10** Carbohydrate figures use **net carbs** (carbs − fiber) for the keto and low-carb
  filters and scoring, and total carbs everywhere else.

### 4.4 Allergens (household-wide)

- **FR-HH-11** Zero or more allergens can be excluded: gluten, dairy/lactose, eggs, tree nuts,
  peanuts, soy, fish, shellfish (crustaceans and molluscs), sesame.
- **FR-HH-12** A recipe is excluded if any of its ingredients carries an excluded allergen.
  Allergens are attached to ingredients in the database, not to recipes.
- **FR-HH-13** The UI states that allergen data is informational and that labels on the actual
  products must be checked.

### 4.5 Compatibility feedback

- **FR-HH-14** When diet, macro profile and allergens are changed, the settings screen shows how
  many recipes remain available per slot (e.g. "Breakfast: 18 · Lunch: 41 · Dinner: 44 ·
  Snack: 22"). Any slot with fewer than 7 recipes shows a warning that the week will contain
  repeats.

---

## 5. Functional requirements: plan settings

- **FR-PS-1** **Meals per day**: 1–6. The count sets the slots and their calorie shares. The
  shares are fixed and cannot be edited:

  | Meals | Slots and share of daily kcal                                                             |
  | ----: | ----------------------------------------------------------------------------------------- |
  |   1   | Dinner 100 %                                                                              |
  |   2   | Lunch 50 % · Dinner 50 %                                                                  |
  |   3   | Breakfast 25 % · Lunch 40 % · Dinner 35 %                                                 |
  |   4   | Breakfast 25 % · Lunch 35 % · Afternoon snack 10 % · Dinner 30 %                          |
  |   5   | Breakfast 20 % · Morning snack 10 % · Lunch 30 % · Afternoon snack 10 % · Dinner 30 %     |
  |   6   | Breakfast 20 % · Morning snack 10 % · Lunch 25 % · Afternoon snack 10 % · Dinner 25 % · Evening snack 10 % |

- **FR-PS-2** **Week**: plans always run Monday–Sunday. The user picks the week by its Monday;
  the default is the next Monday on or after today.
- **FR-PS-3** **Leftovers / batch cooking**: on/off toggle, default on (see FR-GEN-6).
- **FR-PS-4** Plan settings are stored with the plan (see FR-PL-2).

---

## 6. Functional requirements: nutrition calculation

- **FR-NUT-1** BMR uses **Mifflin-St Jeor**:
  - male: `10·kg + 6.25·cm − 5·age + 5`
  - female: `10·kg + 6.25·cm − 5·age − 161`
- **FR-NUT-2** TDEE = BMR × activity multiplier: sedentary **1.2**, moderate **1.55**, high **1.725**.
  The selector explains each level in plain words (e.g. "moderate: exercise 3–5 days a week").
- **FR-NUT-3** Daily target = TDEE + goal delta: lose **−500 kcal**, maintain **0**, gain **+300 kcal**.
- **FR-NUT-4** Safety floor: the target is never below **1,200 kcal (female)** or **1,500 kcal
  (male)**, nor below BMR. When the floor applies, the person card says so.
- **FR-NUT-5** Macro gram targets = daily target × profile share ÷ (4 kcal/g for carbs and
  protein, 9 kcal/g for fat).
- **FR-NUT-6** Slot target per person = daily target × slot share (FR-PS-1).
- **FR-NUT-7** Recipe nutrition is computed from its ingredients (quantity × edible portion ×
  per-100 g values) and never stored separately.
- **FR-NUT-8** A visible disclaimer (on onboarding and in the footer) says the figures are
  estimates and not medical advice. The full text is in Appendix A (§16).

---

## 7. Functional requirements: weekly plan

### 7.1 Grid

- **FR-WP-1** The plan is a grid of 7 days × N slots. On mobile it shows one day at a time, with
  day tabs or a swipe; on wide screens it shows the full week.
- **FR-WP-2** Each meal cell shows: recipe name, kcal per base serving, slot fit, a
  lock state and, for leftover meals, a "Leftovers from Mon dinner" label.
- **FR-WP-3** Each day shows a summary per person: planned kcal and macros against their target,
  as a delta (e.g. "+4 % kcal, protein −6 g").
- **FR-WP-4** Tapping a meal opens its detail: ingredients for the whole household, each
  person's portion factor and kcal, macros, and a short method (the recipe steps).

### 7.2 Portion scaling

- **FR-WP-5** All people eat the same recipe in a meal. Person *p*'s portion factor =
  `slotTarget(p) ÷ recipeKcalPerServing`, rounded to 0.05.
- **FR-WP-6** Portion factors are clamped to **0.5–2.0**. If clamping applies, the cell shows a
  warning icon, and the generator avoids recipes that would need clamping for anyone.
- **FR-WP-7** Household amount for a meal = Σ portion factors × base-serving quantities.

### 7.3 Generation

- **FR-GEN-1** **Generate week** fills every unlocked meal. **Regenerate day** fills that day's
  unlocked meals. Each run uses a new random seed, so results differ, and the seed is stored for
  reproducibility.
- **FR-GEN-2** **Hard constraints**, never violated:
  1. the recipe matches the household diet (FR-HH-6/7) and the profile's hard filter (FR-HH-8);
  2. it contains no excluded allergen (FR-HH-12);
  3. it is tagged for that slot type (breakfast, lunch, dinner or snack; every snack slot uses
     `snack`);
  4. flexitarian: at most 3 meals per week contain meat, fish or seafood, counting leftover meals.
- **FR-GEN-3** **Variety rules**, soft and heavily penalized:
  1. the same recipe is not cooked twice within 3 consecutive days (planned leftovers don't count);
  2. the same recipe is cooked at most twice per week;
  3. the same primary ingredient (each recipe has one, e.g. `chickpeas`, `chicken-breast`)
     appears in at most 3 cooked meals per week.
- **FR-GEN-4** **Macro optimization**: for each day, the generator minimizes the household-average
  deviation from the macro profile (in % of kcal), plus the variety penalties. Calories are
  matched through portion scaling (FR-WP-5); the macro balance comes from which dishes are chosen.
- **FR-GEN-5** Algorithm: candidate filtering by hard constraints, then a seeded randomized greedy
  pass day by day, then a bounded local-search improvement (swap one meal at a time while the
  score improves, max 500 iterations). Generating a week must finish in < 300 ms on a mid-range
  phone (NFR-PERF-1).
- **FR-GEN-6** **Leftovers** (if enabled): a recipe flagged `batchable` cooked at lunch or dinner
  may also cover **the next slot of type lunch or dinner within 24 h** (e.g. Mon dinner →
  Tue lunch). At most 3 leftover pairings per week. A leftover meal adds no cooking, but its
  quantities are still added to the grocery list.
- **FR-GEN-7** If the hard constraints can't fill a meal (no candidates), the meal stays empty
  with an explanation ("No vegan + keto + gluten-free snack in the database") instead of breaking
  a constraint. If only the variety rules can't be met, they are relaxed and the user is warned.
- **FR-GEN-8** Locked meals are never changed by generation, and the variety and flexitarian
  counts take them into account.

### 7.4 Manual editing

- **FR-WP-8** **Swap**: a meal's menu lists compatible alternatives (hard constraints applied),
  ranked by how well they fit that day's macros, with a text search. Choosing one replaces the
  meal.
- **FR-WP-9** **Lock / unlock** per meal. Swapping a meal by hand locks it automatically.
- **FR-WP-10** **Clear** a meal (leave it empty).
- **FR-WP-11** Leftover links: swapping or clearing the source meal of a leftover pair also
  clears the leftover meal, after confirmation. A leftover meal can be turned into a normal meal
  (unlinked) and then swapped.
- **FR-WP-12** **Make leftovers**: on a batchable lunch or dinner, the user can turn the next
  eligible slot into its leftover meal (same rule as FR-GEN-6), replacing what's there after
  confirmation.

---

## 8. Functional requirements: grocery list

- **FR-GL-1** The list is computed from the plan every time; it is never stored. It sums every
  non-empty meal (FR-WP-7) per ingredient, using as-purchased raw quantities.
- **FR-GL-2** Exact amounts are rounded for display:
  - grams/ml: < 100 → nearest 5; 100–999 → nearest 10; ≥ 1000 → shown in kg/L to 2 decimals
    (nearest 0.05);
  - pieces (eggs, lemons, …): always rounded **up** to a whole number.
- **FR-GL-3** **Suggested packages**: each ingredient lists available package sizes. The app
  picks the combination that covers the exact amount with the least overage, then the fewest
  packages, and shows it beside the exact amount: `Spinach — 600 g (3 × 200 g bag)`,
  `Rice — 1.3 kg (1 × 1 kg + 1 × 500 g)`. Ingredients without package data show only the exact
  amount.
- **FR-GL-4** Items are grouped and sorted by aisle category, in this order: Produce, Bakery,
  Meat, Fish & seafood, Dairy & eggs, Plant proteins (tofu, tempeh, seitan), Grains, pasta &
  rice, Legumes, Canned & jarred, Nuts & seeds, Oils, vinegars & condiments, Spices & herbs,
  Frozen, Other. Within a category, items are alphabetical.
- **FR-GL-5** **Copy to clipboard** produces exactly this format (grouped, uppercase headers,
  Markdown checkboxes, em dash separators):

  ```
  Plateful — Week of 2 Nov 2026

  PRODUCE
  - [ ] Spinach — 600 g (3 × 200 g bag)
  - [ ] Tomatoes — 1.2 kg

  DAIRY & EGGS
  - [ ] Eggs — 14 (2 × 6 + 1 × 4)
  - [ ] Greek yogurt — 1 kg (2 × 500 g)
  ```

  Empty categories are left out. After copying, a confirmation toast appears. If the Clipboard
  API is unavailable or denied, the text is shown in a selectable text area with instructions.
- **FR-GL-6** The list screen shows the total item count and which days of the plan it covers.

---

## 9. Functional requirements: saved plans

- **FR-PL-1** The app keeps any number of plans. The home screen lists them newest week first,
  showing week (Mon date), name (default "Week of 2 Nov 2026"), meal count and last-edited date.
- **FR-PL-2** Each plan stores a **snapshot** of the household (people, diet, macro profile,
  allergens) and plan settings from when it was created. Later edits to the household don't
  change existing plans.
- **FR-PL-3** In a plan, **Update from household** replaces the snapshot with the current
  household, recalculates portion factors, and flags meals that no longer meet the hard
  constraints (it doesn't regenerate them automatically).
- **FR-PL-4** Actions: open, rename, duplicate (asks for the target week; copies meals and
  locks), delete (with confirmation).
- **FR-PL-5** Creating a plan for a week that already has one is allowed. The name gets a
  suffix (" (2)").

---

## 10. Functional requirements: data management

- **FR-DATA-1** All user data lives in one `localStorage` key, `plateful:v1`, as a single JSON
  document (§11). The bundled recipe and ingredient database is **not** user data and is never
  stored or exported.
- **FR-DATA-2** Changes are saved automatically (debounced ≤ 500 ms). If writing fails (quota or
  private mode), a persistent warning tells the user to export their data.
- **FR-DATA-3** **Export** downloads `plateful-YYYY-MM-DD.json` containing the whole document,
  pretty-printed.
- **FR-DATA-4** **Import** accepts a `.json` file, validates it against the schema (with
  migrations for older `schemaVersion`s), and shows a summary (people, plans). After
  confirmation it **replaces** all current data; there is no merge. Invalid files are rejected
  with a readable error and leave current data unchanged.
- **FR-DATA-5** **Delete all data** opens a confirmation dialog that offers "Export first". On
  confirm it clears the key and returns to first-launch onboarding.
- **FR-DATA-6** Imported or stored data that refers to a recipe ID missing from the current
  bundled database shows that meal as "Recipe no longer available" and leaves it out of the
  grocery list, without crashing.
- **FR-DATA-7** The theme preference is stored under its own `localStorage` key,
  `plateful:theme`, and is not part of the exported document. The design system's theme helpers
  are not used, because they store the choice in a `theme` cookie, which would break FR-LEGAL-6.

---

## 11. Data model

### 11.1 User data (persisted, exported)

```ts
type Sex = 'female' | 'male';
type Activity = 'sedentary' | 'moderate' | 'high';
type Goal = 'lose' | 'maintain' | 'gain';
type Diet = 'omnivore' | 'flexitarian' | 'pescatarian' | 'vegetarian' | 'vegan';
type MacroProfile =
  | 'balanced' | 'keto' | 'low-carb' | 'high-carb'
  | 'high-protein' | 'mediterranean' | 'zone' | 'low-fat';
type Allergen =
  | 'gluten' | 'dairy' | 'eggs' | 'tree-nuts' | 'peanuts'
  | 'soy' | 'fish' | 'shellfish' | 'sesame';
type SlotId =
  | 'breakfast' | 'morning-snack' | 'lunch'
  | 'afternoon-snack' | 'dinner' | 'evening-snack';

interface Person {
  id: string;            // uuid
  name: string;
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activity: Activity;
  goal: Goal;
}

interface Household {
  people: Person[];
  diet: Diet;
  macroProfile: MacroProfile;
  excludedAllergens: Allergen[];
}

interface PlanSettings {
  mealsPerDay: 1 | 2 | 3 | 4 | 5 | 6;
  leftoversEnabled: boolean;
}

interface Meal {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Monday
  slot: SlotId;
  recipeId: string | null;
  locked: boolean;
  leftoverOf?: { day: number; slot: SlotId }; // set on the leftover meal
}

interface Plan {
  id: string;
  name: string;
  weekStart: string;     // ISO date of the Monday, e.g. "2026-11-02"
  createdAt: string;     // ISO datetime
  updatedAt: string;
  household: Household;  // snapshot (FR-PL-2)
  settings: PlanSettings;
  meals: Meal[];
  seed: number;          // last generation seed
}

interface PlatefulData {
  app: 'plateful';
  schemaVersion: 1;
  exportedAt?: string;   // set on export only
  legal: {               // FR-LEGAL-2
    acceptedVersion: string; // e.g. "2026-11-01"
    acceptedAt: string;      // ISO datetime
  };
  onboarded: boolean;    // first-run setup finished (§3)
  household: Household;  // current household
  defaultSettings: PlanSettings;
  plans: Plan[];
}
```

### 11.2 Bundled database (static, read-only)

```ts
type AnimalCategory =
  | 'none' | 'dairy' | 'egg' | 'honey' | 'fish' | 'seafood' | 'meat';
type Aisle =
  | 'produce' | 'bakery' | 'meat' | 'fish' | 'dairy-eggs' | 'plant-protein'
  | 'grains' | 'legumes' | 'canned' | 'nuts-seeds' | 'oils-condiments'
  | 'spices-herbs' | 'frozen' | 'other';

interface Ingredient {
  id: string;                       // kebab-case, e.g. "chickpeas-dry"
  name: string;                     // display name for the grocery list
  aisle: Aisle;
  unit: 'g' | 'ml' | 'piece';       // how recipes and the list measure it
  gramsPerPiece?: number;           // required when unit = 'piece'
  ediblePortion: number;            // 0–1, as-purchased → edible (banana ≈ 0.65)
  per100: {                         // per 100 g (or 100 ml) of edible raw food
    kcal: number; protein: number; carbs: number; fiber: number; fat: number;
  };
  animal: AnimalCategory;
  allergens: Allergen[];
  packages?: { size: number; label: string }[]; // size in the ingredient's unit
  source: string;                   // nutrition source, e.g. "USDA FDC 173757"
}

interface Recipe {
  id: string;
  name: string;
  slots: ('breakfast' | 'lunch' | 'dinner' | 'snack')[];
  primaryIngredient: string;        // ingredient id, for variety rules
  tags: ('mediterranean')[];
  batchable: boolean;
  prepMinutes: number;
  ingredients: { ingredientId: string; quantity: number }[]; // one base serving, as-purchased
  steps: string[];
}
```

### 11.3 Database content requirements

- **FR-DB-1** At least **300 recipes** at launch.
- **FR-DB-2** Coverage targets, after the hard filters, for **each** diet × slot type:
  ≥ 10 breakfasts, ≥ 20 lunches, ≥ 20 dinners, ≥ 10 snacks. Restrictive combinations
  (vegan + keto) are allowed to fall short, but the shortfall is reported by a database lint
  script.
- **FR-DB-3** Base servings target **350–650 kcal** for lunch/dinner, **250–500** for
  breakfast, and **100–300** for snacks, so the portion factors in FR-WP-6 stay in range.
- **FR-DB-4** Nutrition values come from **USDA FoodData Central** (public domain); each
  ingredient records its source ID.
- **FR-DB-5** The database is stored as typed TypeScript/JSON in the repo and checked by a
  `db:lint` script: unique IDs, every referenced ingredient exists, piece units have
  `gramsPerPiece`, kcal ranges (FR-DB-3), coverage report (FR-DB-2).
- **FR-DB-6** The database is lazy-loaded (separate chunk) so the first render doesn't wait for it.

---

## 12. Decision log

### Decided by the product owner

| Topic                  | Decision                                                            |
| ---------------------- | ------------------------------------------------------------------- |
| Dish source            | Bundled recipe database only                                        |
| Nutrition source       | Bundled ingredient table                                            |
| Household meals        | Same dishes for everyone, portions scaled per person                |
| BMR inputs             | Add age and sex; Mifflin-St Jeor                                    |
| Diet / macro scope     | Once per household                                                  |
| Meals per day          | Count + named slots (fixed shares)                                  |
| Goal adjustment        | Fixed presets                                                       |
| Exclusions             | Common allergens only (no free ingredient blacklist)                |
| Generator              | Diet + allergen + slot fit, variety, batch/leftovers, macro optimization |
| Manual editing         | Generate, then swap/lock                                            |
| Quantities             | Exact metric amount + suggested packages                            |
| List organization      | Grouped by aisle (no in-app check-off, pantry or extras)            |
| Clipboard format       | Grouped with headers, Markdown checkboxes                           |
| Diets                  | Omnivore, flexitarian, pescatarian, vegetarian, vegan               |
| Macro profiles         | Keto, low-carb, high-carb, high-protein, Mediterranean, balanced, zone, low-fat |
| Language               | English only                                                        |
| Stack                  | React + TypeScript on Vite                                          |
| Platform               | Mobile-first responsive (no PWA)                                    |
| History                | Multiple saved weekly plans                                         |
| Primary color          | "Leaf" green                                                        |
| Success color          | Retinted to teal                                                    |
| Recipe database size   | 300+ recipes                                                        |
| Week start             | Monday                                                              |
| Age                    | Adults only (18+)                                                   |
| Legal pages            | Disclaimer, Terms of Service, Privacy Policy (offline only, no liability) |
| Operator               | Luca Bonaldo (individual), contact me@lucabonaldo.dev               |
| Governing law          | Italy; GDPR applies                                                 |
| Hosting                | Cloudflare Pages at https://plateful.lucabonaldo.dev                |
| Source code license    | MIT                                                                 |
| Cookie notice          | Informational "no cookies" box with a single OK button              |

### Defaults chosen during drafting (delegated by the product owner)

| Topic                    | Choice                                                    | Ref       |
| ------------------------ | --------------------------------------------------------- | --------- |
| Activity multipliers     | 1.2 / 1.55 / 1.725                                        | FR-NUT-2  |
| Goal deltas              | −500 / 0 / +300 kcal                                      | FR-NUT-3  |
| Calorie floor            | 1,200 F / 1,500 M, and never below BMR                    | FR-NUT-4  |
| Macro splits and filters | see table                                                 | FR-HH-8   |
| Vegetarian meaning       | Lacto-ovo; vegan also excludes honey                      | FR-HH-6   |
| Flexitarian limit        | ≤ 3 meat/fish/seafood meals per week                      | FR-HH-6   |
| Mediterranean            | Macro split + only `mediterranean`-tagged recipes         | FR-HH-8   |
| Slot calorie shares      | see table                                                 | FR-PS-1   |
| Portion factor range     | 0.5–2.0, step 0.05                                        | FR-WP-5/6 |
| Variety window           | 3 days; ≤ 2 cooks per recipe; ≤ 3 per primary ingredient  | FR-GEN-3  |
| Leftovers                | Lunch/dinner only, next slot within 24 h, ≤ 3 per week    | FR-GEN-6  |
| Validation ranges        | age 18–100, 30–300 kg, 120–230 cm, 1–12 people            | FR-HH-2   |
| Rounding                 | 5 / 10 g steps, kg/L at 2 decimals, pieces rounded up     | FR-GL-2   |
| Package choice           | least overage, then fewest packages                       | FR-GL-3   |
| Aisle order              | see list                                                  | FR-GL-4   |
| Plans vs household       | Plans snapshot the household; explicit "Update from household" | FR-PL-2/3 |
| Import mode              | Replace all (no merge), validated, with migrations        | FR-DATA-4 |
| Recipe quantities        | As-purchased raw weight; nutrition via edible portion     | §11.2     |
| Nutrition data source    | USDA FoodData Central                                     | FR-DB-4   |
| Libraries / tooling      | see §14                                                   | §14       |
| Legal acceptance         | Required once on first launch; asked again when the text version changes | FR-LEGAL-2/3 |
| Cookie notice storage    | Own key, not exported, kept after "Delete all data"       | FR-LEGAL-6a |

---

## 13. UI and design system

### 13.1 Design system

- **FR-UI-1** Use `@lucabonaldo/design` ("Paper & ink") pinned to
  `github:LucaBonaldoIT/design#v0.1.0`:
  - `fonts.css` (self-hosted Fraunces + Inter) and `index.css`;
  - a light / dark / system theme toggle in the header, resolved before first paint by an inline
    script in `index.html`. Plateful uses its own `localStorage`-based script instead of the
    `designSystem()` plugin and `initTheme()`, which store the choice in a cookie (FR-DATA-7).
- **FR-UI-2** Use the system's components wherever one fits: `.ds-header`, `.ds-wordmark`,
  `.ds-nav`, `.ds-button` (`--primary`, `--quiet`, `--small`, `--icon`), `.ds-field`,
  `.ds-label`, `.ds-input`, `.ds-check`, `.ds-hint`, `.ds-panel`, `.ds-dialog`, `.ds-notice`
  (`--ok`, `--warn`, `--err`), `.ds-tag`, `.ds-overline`, `.ds-rule`, `.ds-footer`. App CSS uses
  role tokens (`--ds-bg`, `--ds-text`, `--ds-accent`, …), never palette tokens or hard-coded
  colors.
- **FR-UI-3** App-specific components (meal cell, week grid, segmented control, stepper, toast)
  are built in unlayered app CSS on top of the role tokens, following the system's 2 px / 6 px
  radii, type scale and motion tokens.

### 13.2 Brand: Leaf green primary, teal success

The vermilion accent is replaced by overriding **role tokens** in unlayered app CSS, for light,
dark and the system-preference fallback, mirroring how `tokens.css` is structured:

| Role token              | Light     | Dark      | Notes                                         |
| ----------------------- | --------- | --------- | --------------------------------------------- |
| `--ds-accent`           | `#2e7d32` | `#7bcf6f` | 4.58:1 on paper, 9.17:1 on ink page           |
| `--ds-accent-fill`      | `#2e7d32` | `#2e7d32` | `--ds-on-accent` (#fff7f0) on it: 4.84:1      |
| `--ds-accent-fill-hover`| `#23622a` | `#256b2b` | 6.95:1 / 6.16:1 with `--ds-on-accent`         |
| `--ds-accent-soft`      | `#e9f3e6` | `#172a17` | accent text on it: 4.50:1 / 7.97:1            |
| `--ds-ok`               | `#0f6b5c` | `#5fc9b5` | teal; 5.73:1 on paper, 8.76:1 on ink page     |
| `--ds-ok-soft`          | `#dcefeb` | `#12302b` | ok text on it: 5.37:1 / 7.08:1                |

- **FR-UI-4** Every text/background pair in the table meets WCAG AA (≥ 4.5:1) and is checked by
  an automated contrast test.
- **FR-UI-5** The `.ds-inverse` accent (`--ds-accent` inside `.ds-inverse`) is overridden to
  `#7bcf6f`.
- **FR-UI-6** `<meta name="theme-color">` follows the theme: `#f5f2ea` light, `#1c1915` dark.
- **FR-UI-7** Wordmark "Plateful" in Fraunces. The favicon is built from the system's
  `brand/favicon-template.svg` with a Leaf-green plate mark (not the lucabonaldo.dev icon).

### 13.3 Screens

1. **Onboarding** (first launch): welcome → accept Disclaimer, Terms and Privacy Policy
   (FR-LEGAL-2) → household → plan settings → empty plan.
2. **Plans** (home): saved plans list, "New plan" button.
3. **Plan**: week grid (FR-WP-*), generate/regenerate actions, per-day per-person summaries,
   and a link to the grocery list.
4. **Meal detail / swap**: dialog or bottom sheet (FR-WP-4, FR-WP-8).
5. **Grocery list**: grouped list + Copy button (FR-GL-*).
6. **Household**: people, diet, macro profile, allergens, compatibility counts (FR-HH-*).
7. **Settings / Data**: default plan settings, export, import, delete all, about.
8. **Legal**: `#/legal/disclaimer`, `#/legal/terms`, `#/legal/privacy` (§16), always reachable
   from the footer, including before acceptance.

Navigation: header with the wordmark and theme toggle; primary navigation (Plans, Household,
Settings) as a bottom bar on mobile and `.ds-nav` in the header on wide screens.

---

## 14. Non-functional requirements

### Technology

- **NFR-TECH-1** Vite + React (latest stable) + TypeScript in `strict` mode.
- **NFR-TECH-2** State: Zustand store, persisted to `localStorage` through a custom storage
  adapter that writes the single `PlatefulData` document (FR-DATA-1).
- **NFR-TECH-3** Schema validation and migrations with Zod (import and app start).
- **NFR-TECH-4** Routing with React Router using hash routes, so the build deploys to any static
  host without server rewrites.
- **NFR-TECH-5** No UI component library; the design system plus one unlayered app stylesheet
  (`src/ui/app.css`, classes prefixed `pf-`) that uses role tokens only.
- **NFR-TECH-6** Domain logic (nutrition, generator, aggregation, packaging, clipboard formatting)
  lives in pure TypeScript modules with no React imports.
- **NFR-TECH-7** Tooling: ESLint, Prettier (matching the design system's config), Vitest +
  React Testing Library.

### Performance

- **NFR-PERF-1** Week generation < 300 ms on a mid-range phone (6 meals × 7 days × 12 people).
- **NFR-PERF-2** Initial JS (excluding the lazy-loaded database chunk) ≤ 200 KB gzipped.

### Accessibility

- **NFR-A11Y-1** WCAG 2.2 AA: keyboard operable, visible focus (design-system focus styles),
  labelled form fields, live-region announcement for "Copied" and generation results,
  `prefers-reduced-motion` respected.
- **NFR-A11Y-2** Touch targets ≥ 44 × 44 px. Layout works from 320 px wide with no horizontal
  scroll.

### Privacy and reliability

- **NFR-PRIV-1** No network requests after load, no analytics, no third-party scripts.
- **NFR-REL-1** A corrupted `localStorage` document never blanks the app. The app offers to
  download the raw content and reset.

### Browser support

- **NFR-DEPLOY-1** Production is served from **https://plateful.lucabonaldo.dev** (Cloudflare
  Pages, custom domain, HTTPS only). The build sets that canonical URL, and `robots.txt`,
  `sitemap.xml` and `site.webmanifest` live in `public/` (as in flaplab).

### SEO and sharing

- **NFR-SEO-1** `index.html` carries a descriptive title and meta description, canonical URL,
  `robots` (index, follow, large image previews), Open Graph and Twitter `summary_large_image`
  tags, and `WebApplication` JSON-LD. A `<noscript>` block describes the app for crawlers that
  don't run JavaScript.
- **NFR-SEO-2** The social image `public/og-image.png` is 1200 × 630, shows the brand, tagline and
  a screenshot of the week view, and is regenerated with `scripts/og-image.sh` from
  `scripts/og-image/og.html`.
- **NFR-SEO-3** Icons: SVG favicon, 32 px PNG favicon, 180 px `apple-touch-icon`, and 192/512 px
  manifest icons (the 512 also as `maskable`). `robots.txt` and `sitemap.xml` point at the
  production URL. Only `/` is indexable, because in-app routes are hash-based.

- **NFR-BR-1** The last 2 versions of Chrome, Edge, Firefox and Safari (desktop and iOS/Android).

### Testing

- **NFR-TEST-1** Unit tests for: BMR/TDEE/target/floor, macro grams, slot shares, portion factors
  and clamping, every hard constraint, variety rules, leftover rules, aggregation, rounding,
  package selection, clipboard output (snapshot of the exact FR-GL-5 format), import validation
  and migration.
- **NFR-TEST-2** The generator is deterministic for a given seed, which tests rely on.
- **NFR-TEST-3** `db:lint` runs in CI along with tests, type-check and lint.

---

## 15. Acceptance criteria (v1)

1. A first-time user can set up a 2-person vegetarian, high-protein, gluten-free household with
   3 meals per day, generate a week, and copy a grouped grocery list, in under 3 minutes.
2. The generated week contains no recipe that breaks the diet, profile filter, allergens or slot
   type, which is checked automatically across 1,000 random seeds.
3. Swapping and locking a meal, then regenerating, keeps the locked meal and changes the others.
4. The copied text matches the FR-GL-5 format exactly.
5. Export → Delete all → Import restores an identical app state.
6. All color pairs in §13.2 pass the contrast test in both themes.
7. The "No cookies here" notice appears on first visit, disappears for good after OK, and
   stays dismissed after a reload.
8. The app can't be used before the legal texts are accepted. The three legal pages are
   reachable from every screen, and the production build makes no network request after load
   (checked in the browser network panel).

---

## 16. Legal: disclaimer, terms and privacy

> These texts are a starting draft written for an offline, free, hobby app. They are **not legal
> advice**. Have a lawyer review them before public release, especially the liability clauses,
> because Italian and EU consumer law limit how far liability can be excluded.

### 16.1 Requirements

- **FR-LEGAL-1** The app contains three pages: **Disclaimer** (Appendix A), **Terms of Service**
  (Appendix B) and **Privacy Policy** (Appendix C). They are bundled static content, available
  offline, in English.
- **FR-LEGAL-2** On first launch, before any data is entered, a screen summarizes the key points
  (offline only, not medical advice, no liability, data stays on your device) and links the three
  pages. The user must tick "I have read and accept the Disclaimer, Terms of Service and Privacy
  Policy" and confirm "I am 18 or older" before continuing. Acceptance is stored as
  `legal.acceptedVersion` / `legal.acceptedAt` (§11.1).
- **FR-LEGAL-3** Each text has a version (its "Last updated" date). If the bundled version is
  newer than `legal.acceptedVersion`, the acceptance screen is shown again on next launch. The
  user's data is kept, but the app can't be used until they accept again.
- **FR-LEGAL-4** The footer on every screen links Disclaimer · Terms · Privacy and shows the short
  line: "Estimates only — not medical advice. Your data never leaves this device."
- **FR-LEGAL-5** The grocery list and meal detail screens show a short allergen notice: "Always
  check product labels. Allergen data may be incomplete or wrong."
- **FR-LEGAL-6** The app sets no cookies and uses `localStorage` only to store data the user
  explicitly creates (strictly necessary under the ePrivacy Directive art. 5(3)), so no consent
  is needed. Cloudflare Web Analytics, and any other analytics or beacon, must stay
  **disabled** on the Cloudflare Pages project. Enabling it would make the Privacy Policy wrong.
- **FR-LEGAL-6a** A small **cookie notice box** (informational, not a consent banner) is shown
  fixed at the bottom of the screen on first visit, over every screen, including the acceptance
  screen. It reads:

  > **No cookies here.** Plateful uses no cookies and no tracking. Your data is saved only in
  > this browser's local storage. [Privacy Policy](#/legal/privacy)
  >
  > [ OK ]

  It has a single **OK** button (`.ds-button--primary --small`), with no accept/reject choices.
  Pressing OK hides it permanently. The dismissal is saved under its own `localStorage` key,
  `plateful:cookie-notice`, which is not part of `PlatefulData`. It isn't exported, and
  "Delete all data" keeps it. It doesn't block interaction, it's keyboard reachable, and screen
  readers announce it as a `role="region"` labelled "Cookie notice". If storage is unavailable,
  it shows again on every visit.
- **FR-LEGAL-7** Declining the terms leaves the user on the acceptance screen, with a note that
  the app can't be used without accepting. Nothing is stored.
- **FR-LEGAL-8** The source code is released under the **MIT License**. The repository root has a
  `LICENSE` file ("Copyright (c) 2026 Luca Bonaldo"), and `package.json` has `"license": "MIT"`.
  The license covers the code. The Terms of Service govern use of the hosted app. The About
  screen links the license and lists third-party notices (design system: MIT; fonts: SIL OFL;
  nutrition data: USDA FoodData Central, public domain).

### 16.2 Open items

- Lawyer review of Appendices A–C before public launch.

---

## Appendix A — Disclaimer

*Last updated: 1 November 2026*

**Plateful is a meal-planning and grocery-list tool. It is not a medical device and does not give
medical, nutritional or dietary advice.**

1. **Estimates only.** Calorie, macronutrient and portion figures are estimates calculated with
   general-population formulas (Mifflin-St Jeor) and generic nutrition data. Individual needs
   vary widely. The figures may be inaccurate or unsuitable for you.
2. **Consult a professional.** Talk to a doctor or registered dietitian before changing your diet,
   especially if you are pregnant or breastfeeding, have or have had an eating disorder, have
   diabetes, kidney, heart or any other medical condition, take medication, or plan to lose or
   gain weight. Do not use Plateful to plan meals for children.
3. **Allergens and intolerances.** Allergen and diet information (vegan, vegetarian, gluten-free,
   etc.) is based on generic ingredient data and may be incomplete or wrong. Products differ
   between brands and may contain traces of allergens. **Always read the labels of the products
   you buy.** Do not rely on Plateful if you have a severe allergy.
4. **Food safety.** Recipes and leftover suggestions assume normal food-safety practice: proper
   storage, refrigeration and cooking temperatures. You are responsible for preparing and
   storing food safely.
5. **Quantities.** Grocery quantities and package suggestions are approximations. Check them
   before buying.
6. **Use at your own risk.** You use Plateful and act on its output entirely at your own risk.

## Appendix B — Terms of Service

*Last updated: 1 November 2026*

These Terms govern your use of the Plateful web app ("Plateful", "the app") at **https://plateful.lucabonaldo.dev**,
provided by
**Luca Bonaldo**, an individual ("I", "me"). Contact: **me@lucabonaldo.dev**.

1. **Acceptance.** By ticking the acceptance box or by using the app, you agree to these Terms,
   the Disclaimer and the Privacy Policy. If you do not agree, do not use the app.
2. **Eligibility.** You must be at least 18 years old.
3. **What Plateful is.** A free tool that runs entirely in your web browser. It plans meals from
   a built-in recipe database and generates a grocery list. After the page has loaded it works
   offline. There are no accounts, no servers storing your data, and no paid features.
4. **Your data is your responsibility.** All data you enter is stored only in your browser's local
   storage on your device. I have no access to it and cannot back it up, restore or recover it.
   Clearing your browser data, using private browsing, switching browser or device, or a browser
   malfunction can erase it permanently. Use the export function to keep your own backups. Keep
   exported files safe; they contain the personal information you entered.
5. **No advice.** Plateful does not provide medical, nutritional or dietary advice (see the
   Disclaimer). Its output is not a substitute for professional advice.
6. **Provided "as is".** The app is provided free of charge, "as is" and "as available", without
   warranties of any kind, express or implied, including accuracy, completeness, fitness for a
   particular purpose, availability, or freedom from errors. I may change, suspend or discontinue
   the app at any time without notice.
7. **Limitation of liability.** To the maximum extent permitted by applicable law, I am not liable
   for any direct, indirect, incidental, consequential or other damages arising from the use of,
   or the inability to use, the app or its output. This includes health problems, allergic
   reactions, weight changes, food-related illness, financial loss from purchases, and loss of
   data. Nothing in these Terms excludes or limits liability that cannot be excluded or limited
   by law, including liability for intent or gross negligence (art. 1229 of the Italian Civil
   Code), or your mandatory rights as a consumer.
8. **Acceptable use.** Do not use the app unlawfully, and do not attempt to disrupt the hosting
   service.
9. **Intellectual property.** The app's name, design and bundled content (recipes, texts) belong
   to their respective owners. The source code is released under the MIT License (see the
   `LICENSE` file in the repository). Nutrition data is derived from USDA FoodData Central
   (public domain).
10. **Changes.** I may update these Terms. The app shows the new version and asks you to accept
    it before further use. The "Last updated" date shows the current version.
11. **Governing law.** These Terms are governed by Italian law. If you are a consumer, you keep
    the protection of the mandatory provisions of the law of your country of residence, and the
    courts with jurisdiction are those required by applicable consumer law (for consumers
    resident in Italy, the courts of their place of residence).
12. **Severability.** If any provision is found invalid, the rest remains in effect.

## Appendix C — Privacy Policy

*Last updated: 1 November 2026*

**In short: Plateful runs entirely on your device. I do not collect, receive, store or share any
of the data you enter.**

1. **Controller.** Luca Bonaldo, contact **me@lucabonaldo.dev**. For the data you enter in the app,
   no controller processes it, because it never leaves your device.
2. **Data you enter.** Names, sex, age, weight, height, activity level, goals, diet, allergen
   preferences and meal plans. Some of this (health and diet-related data) may reveal sensitive
   information. It is stored **only in your browser's local storage** on your device. It is never
   sent to me or to anyone else. There are no accounts and no server-side database.
3. **Offline operation.** After the app has loaded, it makes no network requests. Fonts and all
   content are bundled with the app. There are no analytics, trackers, advertising, social plugins
   or third-party scripts.
4. **Cookies and local storage.** The app sets no cookies. It uses local storage only to keep the
   data you create, your theme preference, and the fact that you closed the "No cookies here"
   notice. This is strictly necessary for the app to work, so no consent is needed. The
   notice is there for information only.
5. **Hosting.** The app's files are served by **Cloudflare Pages** (Cloudflare, Inc.). When your
   browser downloads the app, Cloudflare processes technical connection data (such as IP address,
   user agent and request time) to deliver the files and protect the service. This processing is
   carried out by Cloudflare under its own privacy policy (https://www.cloudflare.com/privacypolicy/),
   based on the legitimate interest in operating a secure website (GDPR art. 6(1)(f)). I do not
   use this data to identify you, and I have not enabled any analytics.
6. **Export and import.** Exporting creates a JSON file on your device containing your data. Where
   you keep or share that file is up to you. Importing reads a file you choose. Neither action
   sends data anywhere.
7. **Your rights.** Because I hold no data about you, you exercise control directly in the app:
   view and edit your data at any time, export it (portability), and delete it with "Delete all
   data" or by clearing your browser's site data. For the hosting data in section 5, you can
   contact me or Cloudflare. You have the right to lodge a complaint with a supervisory
   authority, in Italy the Garante per la protezione dei dati personali (www.garanteprivacy.it).
8. **Children.** The app is intended for adults (18+) and must not be used to enter data about
   children.
9. **Changes.** If this policy changes, the app shows the new version and asks you to accept it.
   The "Last updated" date shows the current version.
