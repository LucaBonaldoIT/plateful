<div align="center">

# Plateful

**Plan a week of meals for your household and get the grocery list.**

Pick a diet and a macro profile, describe the people eating, and Plateful plans shared dishes with portions sized for each person, then adds up every raw ingredient you need to buy. Everything runs in your browser.

[![Status](https://img.shields.io/badge/status-in%20design-2e7d32?style=flat-square)](docs/REQUIREMENTS.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/built%20with-Vite-646cff?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

[Requirements](docs/REQUIREMENTS.md) · [Report an issue](https://github.com/LucaBonaldoIT/plateful/issues) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)

</div>

---

> [!NOTE]
> Plateful is in the design phase. The requirements are in [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md), and the UI/UX design is being drawn in Penpot ([`docs/design`](docs/design)). There's no app code yet.

## Overview

Plateful is a free, static, client-only web app. There's no backend, no account, no cookies and no tracking. Your household and plans are stored in your browser's local storage, and you can export, import or delete them at any time as a single JSON file.

## Features (planned)

- **Household:** any number of adults, each with sex, age, weight, height, activity level and goal (lose, maintain, gain). Calorie targets use Mifflin-St Jeor.
- **Diet types:** omnivore, flexitarian, pescatarian, vegetarian, vegan.
- **Macro profiles:** balanced, keto, low-carb, high-carb, high-protein, Mediterranean, zone, low-fat.
- **Allergen exclusions:** gluten, dairy, eggs, tree nuts, peanuts, soy, fish, shellfish, sesame.
- **Weekly plan:** 1–6 meals per day, generated automatically with variety rules, batch cooking and leftovers, and macro targeting. Swap and lock meals by hand.
- **Shared dishes, personal portions:** everyone eats the same meal, with each person's portion sized to their target.
- **Grocery list:** exact raw quantities plus suggested package sizes, grouped by aisle. Copy it to the clipboard as a checklist in one click.
- **Saved plans:** keep, rename, duplicate and reopen past weeks.
- **Your data, on your device:** JSON export, import and delete.
- **Bundled database:** 300+ recipes, with nutrition data from USDA FoodData Central.

## Tech stack

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript (`strict`)
- [`@lucabonaldo/design`](https://github.com/LucaBonaldoIT/design) ("Paper & ink" design system) with a Leaf-green primary
- Zustand (state), Zod (schema validation), React Router (hash routes)
- Vitest + React Testing Library

## Project structure

```text
plateful/
├── docs/
│   ├── REQUIREMENTS.md   Product requirements, decision log, legal texts
│   └── design/           Penpot design files and exported screens
├── LICENSE               MIT
├── CONTRIBUTING.md
└── SECURITY.md
```

The app source arrives with the implementation phase.

## Disclaimer

Plateful gives estimates, not medical or nutritional advice. Talk to a doctor or registered dietitian before changing your diet, and always check product labels for allergens. See the full [Disclaimer](docs/REQUIREMENTS.md#appendix-a--disclaimer).

## License

Source code is released under the [MIT License](LICENSE). © 2026 Luca Bonaldo.
