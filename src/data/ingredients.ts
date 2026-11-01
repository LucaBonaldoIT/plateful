// Ingredient table (REQUIREMENTS §11.2). Values are per 100 g (or 100 ml) of edible raw food,
// rounded from USDA FoodData Central generic entries (SR Legacy / Foundation). They are
// estimates: check FR-DB-4 before adding exact FDC ids.
//
// Tuple: id, name, aisle, unit, grams per piece (0 if not a piece), edible portion,
//        kcal, protein, carbs, fiber, fat, animal category, allergens, packages
//        packages: "size label|size label" in the ingredient's unit.
import type { Aisle, Allergen, AnimalCategory, Ingredient } from '../domain/types';

type Row = [string, string, Aisle, Ingredient['unit'], number, number, number, number, number, number, number, AnimalCategory, string, string];

const ROWS: Row[] = [
  // produce
  ['spinach', 'Baby spinach', 'produce', 'g', 0, 1, 23, 2.9, 3.6, 2.2, 0.4, 'none', '', '200 bag'],
  ['kale', 'Kale', 'produce', 'g', 0, 0.85, 49, 4.3, 8.8, 3.6, 0.9, 'none', '', '200 bag'],
  ['salad-leaves', 'Mixed salad leaves', 'produce', 'g', 0, 1, 15, 1.4, 2.9, 1.3, 0.2, 'none', '', '125 bag'],
  ['broccoli', 'Broccoli', 'produce', 'g', 0, 0.8, 34, 2.8, 6.6, 2.6, 0.4, 'none', '', ''],
  ['cauliflower', 'Cauliflower', 'produce', 'g', 0, 0.6, 25, 1.9, 5, 2, 0.3, 'none', '', ''],
  ['green-beans', 'Green beans', 'produce', 'g', 0, 0.9, 31, 1.8, 7, 2.7, 0.2, 'none', '', ''],
  ['zucchini', 'Zucchini', 'produce', 'piece', 200, 0.95, 17, 1.2, 3.1, 1, 0.3, 'none', '', ''],
  ['eggplant', 'Eggplant', 'produce', 'piece', 300, 0.9, 25, 1, 5.9, 3, 0.2, 'none', '', ''],
  ['bell-pepper', 'Red bell peppers', 'produce', 'piece', 160, 0.85, 31, 1, 6, 2.1, 0.3, 'none', '', ''],
  ['tomato', 'Tomatoes', 'produce', 'piece', 120, 0.95, 18, 0.9, 3.9, 1.2, 0.2, 'none', '', ''],
  ['cherry-tomato', 'Cherry tomatoes', 'produce', 'g', 0, 1, 18, 0.9, 3.9, 1.2, 0.2, 'none', '', '250'],
  ['cucumber', 'Cucumber', 'produce', 'piece', 300, 0.95, 15, 0.7, 3.6, 0.5, 0.1, 'none', '', ''],
  ['carrot', 'Carrots', 'produce', 'piece', 70, 0.9, 41, 0.9, 9.6, 2.8, 0.2, 'none', '', ''],
  ['celery', 'Celery', 'produce', 'g', 0, 0.9, 16, 0.7, 3, 1.6, 0.2, 'none', '', ''],
  ['red-onion', 'Red onions', 'produce', 'piece', 150, 0.9, 40, 1.1, 9.3, 1.7, 0.1, 'none', '', ''],
  ['spring-onion', 'Spring onions', 'produce', 'piece', 15, 0.9, 32, 1.8, 7.3, 2.6, 0.2, 'none', '', ''],
  ['garlic', 'Garlic cloves', 'produce', 'piece', 5, 0.9, 149, 6.4, 33, 2.1, 0.5, 'none', '', ''],
  ['ginger', 'Fresh ginger', 'produce', 'g', 0, 0.9, 80, 1.8, 18, 2, 0.8, 'none', '', ''],
  ['mushroom', 'Mushrooms', 'produce', 'g', 0, 0.97, 22, 3.1, 3.3, 1, 0.3, 'none', '', '250'],
  ['potato', 'Potatoes', 'produce', 'g', 0, 0.85, 77, 2, 17.5, 2.2, 0.1, 'none', '', '2500|1000'],
  ['sweet-potato', 'Sweet potatoes', 'produce', 'g', 0, 0.85, 86, 1.6, 20, 3, 0.1, 'none', '', ''],
  ['avocado', 'Avocados', 'produce', 'piece', 200, 0.7, 160, 2, 8.5, 6.7, 14.7, 'none', '', ''],
  ['lemon', 'Lemons', 'produce', 'piece', 120, 0.65, 29, 1.1, 9.3, 2.8, 0.3, 'none', '', ''],
  ['lime', 'Limes', 'produce', 'piece', 70, 0.65, 30, 0.7, 10.5, 2.8, 0.2, 'none', '', ''],
  ['banana', 'Bananas', 'produce', 'piece', 120, 0.65, 89, 1.1, 22.8, 2.6, 0.3, 'none', '', ''],
  ['apple', 'Apples', 'produce', 'piece', 180, 0.9, 52, 0.3, 13.8, 2.4, 0.2, 'none', '', ''],
  ['orange', 'Oranges', 'produce', 'piece', 140, 0.7, 47, 0.9, 11.8, 2.4, 0.1, 'none', '', ''],
  ['blueberries', 'Blueberries', 'produce', 'g', 0, 1, 57, 0.7, 14.5, 2.4, 0.3, 'none', '', '125'],
  ['parsley', 'Fresh parsley', 'produce', 'g', 0, 0.8, 36, 3, 6.3, 3.3, 0.8, 'none', '', '30 bunch'],
  ['basil', 'Fresh basil', 'produce', 'g', 0, 0.8, 23, 3.2, 2.7, 1.6, 0.6, 'none', '', '30 bunch'],
  ['coriander', 'Fresh coriander', 'produce', 'g', 0, 0.8, 23, 2.1, 3.7, 2.8, 0.5, 'none', '', '30 bunch'],
  // bakery
  ['bread', 'Wholegrain bread', 'bakery', 'g', 0, 1, 250, 12, 43, 7, 3.5, 'none', 'gluten', '500 loaf'],
  ['wrap', 'Wholewheat wraps', 'bakery', 'piece', 60, 1, 310, 8, 52, 3, 8, 'none', 'gluten', '6'],
  ['pita', 'Pita breads', 'bakery', 'piece', 60, 1, 275, 9, 55, 2.2, 1.2, 'none', 'gluten', '6'],
  ['corn-tortilla', 'Corn tortillas', 'bakery', 'piece', 26, 1, 218, 5.7, 44.6, 6.3, 2.9, 'none', '', '10'],
  // meat
  ['chicken-breast', 'Chicken breast', 'meat', 'g', 0, 1, 120, 22.5, 0, 0, 2.6, 'meat', '', '1000|400'],
  ['chicken-thigh', 'Chicken thighs, skinless', 'meat', 'g', 0, 1, 121, 19.7, 0, 0, 4.1, 'meat', '', '500'],
  ['beef-mince', 'Lean beef mince (10% fat)', 'meat', 'g', 0, 1, 176, 20, 0, 0, 10, 'meat', '', '500'],
  ['turkey-mince', 'Turkey mince', 'meat', 'g', 0, 1, 150, 19, 0, 0, 8, 'meat', '', '500'],
  ['pork-tenderloin', 'Pork tenderloin', 'meat', 'g', 0, 1, 120, 21, 0, 0, 3.5, 'meat', '', '500'],
  ['beef-steak', 'Beef sirloin steak', 'meat', 'g', 0, 1, 160, 21, 0, 0, 8, 'meat', '', '300'],
  ['ham', 'Cooked ham', 'meat', 'g', 0, 1, 120, 18, 1.5, 0, 4.5, 'meat', '', '100'],
  // fish
  ['salmon', 'Salmon fillets', 'fish', 'g', 0, 1, 208, 20, 0, 0, 13, 'fish', 'fish', '250 pack (2)'],
  ['cod', 'Cod fillets', 'fish', 'g', 0, 1, 82, 18, 0, 0, 0.7, 'fish', 'fish', '400'],
  ['shrimp', 'Raw prawns', 'fish', 'g', 0, 1, 85, 20, 0, 0, 0.5, 'seafood', 'shellfish', '200'],
  ['mussels', 'Mussels', 'fish', 'g', 0, 0.3, 86, 12, 3.7, 0, 2.2, 'seafood', 'shellfish', '1000 net'],
  ['smoked-salmon', 'Smoked salmon', 'fish', 'g', 0, 1, 117, 18, 0, 0, 4.3, 'fish', 'fish', '100'],
  // dairy & eggs
  ['egg', 'Eggs', 'dairy-eggs', 'piece', 60, 0.88, 143, 12.6, 0.7, 0, 9.5, 'egg', 'eggs', '10|6'],
  ['greek-yogurt', 'Greek yogurt 2%', 'dairy-eggs', 'g', 0, 1, 73, 10, 3.9, 0, 2, 'dairy', 'dairy', '1000|500'],
  ['skyr', 'Skyr', 'dairy-eggs', 'g', 0, 1, 63, 11, 4, 0, 0.2, 'dairy', 'dairy', '500'],
  ['cottage-cheese', 'Cottage cheese', 'dairy-eggs', 'g', 0, 1, 98, 11, 3.4, 0, 4.3, 'dairy', 'dairy', '500|250'],
  ['milk', 'Semi-skimmed milk', 'dairy-eggs', 'ml', 0, 1, 50, 3.4, 4.8, 0, 1.9, 'dairy', 'dairy', '1000'],
  ['feta', 'Feta', 'dairy-eggs', 'g', 0, 1, 264, 14, 4, 0, 21, 'dairy', 'dairy', '200'],
  ['mozzarella', 'Mozzarella', 'dairy-eggs', 'g', 0, 1, 250, 18.5, 1, 0, 19, 'dairy', 'dairy', '125'],
  ['parmesan', 'Parmesan', 'dairy-eggs', 'g', 0, 1, 392, 35.8, 3.2, 0, 25.8, 'dairy', 'dairy', '200'],
  ['halloumi', 'Halloumi', 'dairy-eggs', 'g', 0, 1, 316, 21, 2, 0, 25, 'dairy', 'dairy', '225'],
  ['paneer', 'Paneer', 'dairy-eggs', 'g', 0, 1, 296, 20, 3.6, 0, 22, 'dairy', 'dairy', '250'],
  ['ricotta', 'Ricotta', 'dairy-eggs', 'g', 0, 1, 174, 11, 3, 0, 13, 'dairy', 'dairy', '250'],
  ['cheddar', 'Cheddar', 'dairy-eggs', 'g', 0, 1, 403, 25, 1.3, 0, 33, 'dairy', 'dairy', '200'],
  ['butter', 'Butter', 'dairy-eggs', 'g', 0, 1, 717, 0.9, 0.1, 0, 81, 'dairy', 'dairy', '250'],
  // plant proteins
  ['tofu', 'Firm tofu', 'plant-protein', 'g', 0, 1, 144, 15.8, 2.8, 2.3, 8.7, 'none', 'soy', '400|200'],
  ['tempeh', 'Tempeh', 'plant-protein', 'g', 0, 1, 192, 20.3, 7.6, 0, 10.8, 'none', 'soy', '200'],
  ['seitan', 'Seitan', 'plant-protein', 'g', 0, 1, 141, 25, 6, 0.6, 2, 'none', 'gluten', '250'],
  ['soy-milk', 'Soy milk, unsweetened', 'plant-protein', 'ml', 0, 1, 33, 3.3, 1.7, 0.5, 1.8, 'none', 'soy', '1000'],
  ['soy-yogurt', 'Soy yogurt, plain', 'plant-protein', 'g', 0, 1, 66, 4, 4, 0.5, 3.5, 'none', 'soy', '500'],
  ['hummus', 'Hummus', 'plant-protein', 'g', 0, 1, 166, 7.9, 14.3, 6, 9.6, 'none', 'sesame', '200'],
  // grains, pasta & rice
  ['basmati', 'Basmati rice', 'grains', 'g', 0, 1, 360, 7.5, 79, 1.3, 0.9, 'none', '', '1000|500'],
  ['brown-rice', 'Brown rice', 'grains', 'g', 0, 1, 367, 7.5, 76, 3.5, 2.7, 'none', '', '1000|500'],
  ['quinoa', 'Quinoa', 'grains', 'g', 0, 1, 368, 14, 64, 7, 6, 'none', '', '500'],
  ['pasta', 'Pasta', 'grains', 'g', 0, 1, 371, 13, 75, 3.2, 1.5, 'none', 'gluten', '500'],
  ['gf-pasta', 'Gluten-free pasta', 'grains', 'g', 0, 1, 357, 7, 79, 2, 1.5, 'none', '', '400'],
  ['oats', 'Rolled oats', 'grains', 'g', 0, 1, 379, 13, 67.7, 10, 6.5, 'none', 'gluten', '1000|500'],
  ['couscous', 'Couscous', 'grains', 'g', 0, 1, 376, 12.8, 77, 5, 0.6, 'none', 'gluten', '500'],
  ['bulgur', 'Bulgur', 'grains', 'g', 0, 1, 342, 12.3, 76, 12.5, 1.3, 'none', 'gluten', '500'],
  ['rice-noodles', 'Rice noodles', 'grains', 'g', 0, 1, 364, 6, 80, 1.6, 0.6, 'none', '', '250'],
  ['polenta', 'Polenta', 'grains', 'g', 0, 1, 362, 8, 77, 7, 3.6, 'none', '', '500'],
  ['rice-cakes', 'Rice cakes', 'grains', 'piece', 9, 1, 387, 8, 81, 4, 3, 'none', '', '14'],
  ['buckwheat', 'Buckwheat groats', 'grains', 'g', 0, 1, 343, 13.3, 71.5, 10, 3.4, 'none', '', '500'],
  // legumes (dry)
  ['red-lentils', 'Red lentils', 'legumes', 'g', 0, 1, 358, 24, 63, 11, 2, 'none', '', '500'],
  ['green-lentils', 'Green lentils', 'legumes', 'g', 0, 1, 352, 24.6, 63, 10.7, 1.1, 'none', '', '500'],
  // canned & jarred (quantities are whole can contents; nutrition is per drained weight)
  ['chickpeas', 'Chickpeas', 'canned', 'g', 0, 0.6, 139, 7, 22.5, 6.4, 2.6, 'none', '', '400 can'],
  ['black-beans', 'Black beans', 'canned', 'g', 0, 0.6, 105, 7, 19, 7, 0.3, 'none', '', '400 can'],
  ['kidney-beans', 'Kidney beans', 'canned', 'g', 0, 0.6, 105, 7, 18, 6, 0.5, 'none', '', '400 can'],
  ['cannellini', 'Cannellini beans', 'canned', 'g', 0, 0.6, 110, 7.3, 19, 6, 0.4, 'none', '', '400 can'],
  ['chopped-tomatoes', 'Chopped tomatoes', 'canned', 'g', 0, 1, 24, 1.2, 4, 1, 0.2, 'none', '', '400 can'],
  ['passata', 'Tomato passata', 'canned', 'ml', 0, 1, 31, 1.6, 5, 1.5, 0.2, 'none', '', '700 jar'],
  ['coconut-milk', 'Coconut milk', 'canned', 'ml', 0, 1, 197, 2, 2.8, 0, 21, 'none', '', '400 can'],
  ['sweetcorn', 'Sweetcorn', 'canned', 'g', 0, 0.7, 79, 2.6, 15, 2.4, 1.2, 'none', '', '300 can'],
  ['tuna', 'Tuna in water', 'canned', 'g', 0, 0.8, 116, 26, 0, 0, 1, 'fish', 'fish', '160 can'],
  ['sardines', 'Sardines in olive oil', 'canned', 'g', 0, 0.8, 208, 24.6, 0, 0, 11.5, 'fish', 'fish', '120 can'],
  // nuts & seeds
  ['walnuts', 'Walnuts', 'nuts-seeds', 'g', 0, 1, 654, 15.2, 13.7, 6.7, 65.2, 'none', 'tree-nuts', '200'],
  ['almonds', 'Almonds', 'nuts-seeds', 'g', 0, 1, 579, 21, 21.6, 12.5, 49.9, 'none', 'tree-nuts', '200'],
  ['cashews', 'Cashews', 'nuts-seeds', 'g', 0, 1, 553, 18, 30, 3.3, 43.8, 'none', 'tree-nuts', '200'],
  ['peanuts', 'Roasted peanuts', 'nuts-seeds', 'g', 0, 1, 585, 24, 21, 8, 50, 'none', 'peanuts', '200'],
  ['peanut-butter', 'Peanut butter', 'nuts-seeds', 'g', 0, 1, 588, 25, 20, 6, 50, 'none', 'peanuts', '350 jar'],
  ['chia', 'Chia seeds', 'nuts-seeds', 'g', 0, 1, 486, 16.5, 42, 34, 30.7, 'none', '', '200'],
  ['pumpkin-seeds', 'Pumpkin seeds', 'nuts-seeds', 'g', 0, 1, 559, 30, 10.7, 6, 49, 'none', '', '200'],
  ['tahini', 'Tahini', 'nuts-seeds', 'g', 0, 1, 595, 17, 21, 9.3, 53.8, 'none', 'sesame', '300 jar'],
  ['sesame', 'Sesame seeds', 'nuts-seeds', 'g', 0, 1, 573, 17.7, 23.5, 11.8, 49.7, 'none', 'sesame', '100'],
  ['flaxseed', 'Ground flaxseed', 'nuts-seeds', 'g', 0, 1, 534, 18, 29, 27, 42, 'none', '', '250'],
  // oils, vinegars & condiments
  ['olive-oil', 'Extra virgin olive oil', 'oils-condiments', 'ml', 0, 1, 824, 0, 0, 0, 91.6, 'none', '', '1000|500'],
  ['soy-sauce', 'Soy sauce', 'oils-condiments', 'ml', 0, 1, 53, 8, 4.9, 0.8, 0.6, 'none', 'soy,gluten', '150'],
  ['tamari', 'Tamari (gluten-free)', 'oils-condiments', 'ml', 0, 1, 60, 10.5, 5.6, 0.8, 0.1, 'none', 'soy', '150'],
  ['honey', 'Honey', 'oils-condiments', 'g', 0, 1, 304, 0.3, 82.4, 0.2, 0, 'honey', '', '250 jar'],
  ['maple-syrup', 'Maple syrup', 'oils-condiments', 'ml', 0, 1, 260, 0, 67, 0, 0.1, 'none', '', '250'],
  ['balsamic', 'Balsamic vinegar', 'oils-condiments', 'ml', 0, 1, 88, 0.5, 17, 0, 0, 'none', '', '250'],
  ['mustard', 'Dijon mustard', 'oils-condiments', 'g', 0, 1, 66, 4, 5.8, 4, 4, 'none', '', '200 jar'],
  ['tomato-paste', 'Tomato paste', 'oils-condiments', 'g', 0, 1, 82, 4.3, 19, 4, 0.5, 'none', '', '140 tube'],
  ['stock-cube', 'Vegetable stock cubes', 'oils-condiments', 'piece', 10, 1, 230, 8, 22, 1, 13, 'none', '', '8'],
  // spices & herbs
  ['cumin', 'Ground cumin', 'spices-herbs', 'g', 0, 1, 375, 17.8, 44, 10.5, 22, 'none', '', '50'],
  ['paprika', 'Smoked paprika', 'spices-herbs', 'g', 0, 1, 282, 14, 54, 35, 13, 'none', '', '50'],
  ['garam-masala', 'Garam masala', 'spices-herbs', 'g', 0, 1, 379, 14, 50, 25, 15, 'none', '', '50'],
  ['curry-powder', 'Curry powder', 'spices-herbs', 'g', 0, 1, 325, 14, 56, 33, 14, 'none', '', '50'],
  ['turmeric', 'Ground turmeric', 'spices-herbs', 'g', 0, 1, 312, 9.7, 67, 22.7, 3.3, 'none', '', '50'],
  ['chili-flakes', 'Chili flakes', 'spices-herbs', 'g', 0, 1, 318, 12, 57, 27, 17, 'none', '', '30'],
  ['oregano', 'Dried oregano', 'spices-herbs', 'g', 0, 1, 265, 9, 69, 42.5, 4.3, 'none', '', '15'],
  ['cinnamon', 'Ground cinnamon', 'spices-herbs', 'g', 0, 1, 247, 4, 81, 53, 1.2, 'none', '', '50'],
  // frozen
  ['frozen-berries', 'Mixed berries', 'frozen', 'g', 0, 1, 50, 0.7, 12, 2.8, 0.3, 'none', '', '750|500|300'],
  ['peas', 'Garden peas', 'frozen', 'g', 0, 1, 77, 5.2, 13.6, 4.5, 0.4, 'none', '', '1000|500'],
  ['edamame', 'Edamame beans', 'frozen', 'g', 0, 1, 121, 11.9, 8.9, 5.2, 5.2, 'none', 'soy', '500'],
  // other
  ['dark-chocolate', 'Dark chocolate 70%', 'other', 'g', 0, 1, 598, 7.8, 46, 10.9, 42.6, 'none', '', '100'],
  ['dates', 'Medjool dates', 'other', 'g', 0, 0.9, 282, 2.5, 75, 8, 0.4, 'none', '', '250'],
];

const parsePackages = (s: string) =>
  s
    ? s.split('|').map((p) => {
        const [size, ...label] = p.split(' ');
        return { size: Number(size), label: label.join(' ') };
      })
    : undefined;

export const INGREDIENTS: Ingredient[] = ROWS.map(([id, name, aisle, unit, gpp, edible, kcal, protein, carbs, fiber, fat, animal, allergens, packages]) => ({
  id,
  name,
  aisle,
  unit,
  ...(unit === 'piece' ? { gramsPerPiece: gpp } : {}),
  ediblePortion: edible,
  per100: { kcal, protein, carbs, fiber, fat },
  animal,
  allergens: allergens ? (allergens.split(',') as Allergen[]) : [],
  packages: parsePackages(packages),
  source: 'USDA FoodData Central, generic entry (rounded)',
}));
