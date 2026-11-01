# Contributing to Plateful

Thanks for your interest in Plateful. Bug reports, ideas and pull requests are welcome.

## Before you start

- Read [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md). Behavior is specified there with stable IDs (`FR-*`, `NFR-*`). Reference them in issues and pull requests.
- For anything beyond a small fix, open an issue first so we can agree on the approach.
- Changes that alter behavior should update the requirements in the same pull request.

## Workflow

1. Fork the repository and create a branch from `main`, named `feat/<topic>`, `fix/<topic>` or `docs/<topic>`.
2. Make your change, keeping it focused on one thing.
3. Add or update tests for any change to domain logic (nutrition, generator, grocery aggregation, import/export).
4. Verify locally before pushing (the commands arrive with the app scaffold): tests, type-check, lint and production build must all pass.
5. Open a pull request against `main`.

## Code guidelines

- TypeScript throughout, with `strict` type checking passing.
- Match the style of the surrounding code (naming, comment density, idiom).
- Keep domain logic in plain TypeScript modules with no React imports. The UI consumes them.
- Use the design system's role tokens (`--ds-*`), never hard-coded colors.
- Plateful is offline-only: no network requests, analytics or third-party scripts at runtime.
- Avoid adding runtime dependencies without discussing them first.

## Recipe and ingredient data

- Nutrition values must come from USDA FoodData Central, and each ingredient records its source ID.
- Diet compatibility and allergens are derived from ingredients, so never tag them on recipes by hand.
- Run the database lint (`db:lint`) before submitting data changes.

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: generate leftovers for batchable dinners
fix: round piece ingredients up in the grocery list
docs: clarify portion clamping in requirements
```

Use the imperative mood, keep the subject under about 72 characters, and explain *why* in the body when it isn't obvious.

## Pull requests

A good pull request:

- Describes what changed and why.
- Links the related issue and requirement IDs.
- Includes screenshots or a short recording for UI changes (light and dark theme).
- Passes all checks.

## Licensing of contributions

Plateful is released under the [MIT License](LICENSE). By submitting a contribution, you agree it may be distributed under those terms. Don't contribute code or data you don't have the right to license.
