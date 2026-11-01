// Plateful design — Penpot builder, part 2: sample content shown in the mockups.
// Household: Giulia and Marco, vegetarian, high-protein (35/35/30), gluten excluded,
// 3 meals per day (25/40/35), leftovers on. Targets follow REQUIREMENTS §6.

storage.D = {
  people: [
    { name: "Giulia", sex: "Female", age: 34, kg: "62.0", cm: 168, act: "Moderate", goal: "Maintain", bmr: "1,339", tdee: "2,075", target: "2,075", c: 182, p: 182, f: 69 },
    { name: "Marco", sex: "Male", age: 36, kg: "82.0", cm: 181, act: "High", goal: "Lose", bmr: "1,776", tdee: "3,064", target: "2,564", c: 224, p: 224, f: 85 },
  ],
  days: ["Mon 2", "Tue 3", "Wed 4", "Thu 5", "Fri 6", "Sat 7", "Sun 8"],
  week: [
    [{ slot: "Breakfast", share: "25%", name: "Greek yogurt bowl with berries & walnuts", kcal: 380, time: "5 min", portions: "Giulia ×1.35 · Marco ×1.70" },
     { slot: "Lunch", share: "40%", name: "Lentil & feta salad with roasted peppers", kcal: 560, time: "20 min", portions: "Giulia ×1.50 · Marco ×1.85", locked: true },
     { slot: "Dinner", share: "35%", name: "Red lentil dal with basmati rice", kcal: 540, time: "35 min", batch: true, portions: "Giulia ×1.35 · Marco ×1.65" }],
    [{ slot: "Breakfast", share: "25%", name: "Tofu scramble with spinach", kcal: 360 },
     { slot: "Lunch", share: "40%", name: "Red lentil dal with basmati rice", leftover: "Leftovers from Mon dinner" },
     { slot: "Dinner", share: "35%", name: "Paneer tikka with brown rice", kcal: 610 }],
    [{ slot: "Breakfast", share: "25%", name: "Overnight chia pudding with skyr", kcal: 340 },
     { slot: "Lunch", share: "40%", name: "Quinoa, black bean & avocado bowl", kcal: 590 },
     { slot: "Dinner", share: "35%", name: "Tofu & broccoli stir-fry with rice", kcal: 520, batch: true }],
    [{ slot: "Breakfast", share: "25%", name: "Greek yogurt bowl with berries & walnuts", kcal: 380 },
     { slot: "Lunch", share: "40%", name: "Tofu & broccoli stir-fry with rice", leftover: "Leftovers from Wed dinner" },
     { slot: "Dinner", share: "35%", name: "Spinach & feta frittata", kcal: 480 }],
    [{ slot: "Breakfast", share: "25%", name: "Tofu scramble with spinach", kcal: 360 },
     { slot: "Lunch", share: "40%", name: "Chickpea shakshuka", kcal: 540, locked: true },
     { slot: "Dinner", share: "35%", name: "Tempeh peanut rice noodles", kcal: 620 }],
    [{ slot: "Breakfast", share: "25%", name: "Cottage cheese & berry bowl", kcal: 330 },
     { slot: "Lunch", share: "40%", name: "Halloumi & roasted veg traybake", kcal: 640, warn: "Capped for Marco" },
     { slot: "Dinner", share: "35%", name: "Chickpea & spinach curry", kcal: 560, batch: true }],
    [{ slot: "Breakfast", share: "25%", name: "Overnight chia pudding with skyr", kcal: 340 },
     { slot: "Lunch", share: "40%", name: "Chickpea & spinach curry", leftover: "Leftovers from Sat dinner" },
     { slot: "Dinner", share: "35%", name: "Lentil & feta salad with roasted peppers", kcal: 560 }],
  ],
  // [aisle, [[item, exact amount, suggested packages]]]
  grocery: [
    ["Produce", [["Avocado", "4", ""], ["Baby spinach", "600 g", "3 × 200 g bag"], ["Broccoli", "1.10 kg", ""], ["Cherry tomatoes", "750 g", "3 × 250 g"], ["Fresh ginger", "40 g", ""], ["Garlic", "14 cloves", "2 × bulb"], ["Lemons", "3", ""], ["Red bell peppers", "6", ""], ["Red onions", "5", ""]]],
    ["Dairy & eggs", [["Cottage cheese", "900 g", "2 × 500 g"], ["Eggs", "18", "3 × 6"], ["Feta", "400 g", "2 × 200 g"], ["Greek yogurt 2%", "3.40 kg", "3 × 1 kg + 1 × 500 g"], ["Halloumi", "450 g", "2 × 225 g"], ["Paneer", "500 g", "2 × 250 g"], ["Skyr", "1.00 kg", "2 × 500 g"]]],
    ["Plant proteins", [["Firm tofu", "1.20 kg", "3 × 400 g"], ["Tempeh", "400 g", "2 × 200 g"]]],
    ["Grains, pasta & rice", [["Basmati rice", "700 g", "1 × 1 kg"], ["Brown rice", "350 g", "1 × 500 g"], ["Quinoa", "450 g", "1 × 500 g"], ["Rice noodles", "250 g", "1 × 250 g"]]],
    ["Legumes", [["Green lentils", "300 g", "1 × 500 g"], ["Red lentils", "500 g", "1 × 500 g"]]],
    ["Canned & jarred", [["Black beans", "800 g", "2 × 400 g can"], ["Chickpeas", "1.60 kg", "4 × 400 g can"], ["Chopped tomatoes", "1.60 kg", "4 × 400 g can"], ["Coconut milk", "800 ml", "2 × 400 ml can"]]],
    ["Nuts & seeds", [["Chia seeds", "120 g", "1 × 200 g"], ["Peanut butter", "90 g", "1 × 350 g jar"], ["Walnuts", "210 g", "1 × 250 g"]]],
    ["Oils, vinegars & condiments", [["Extra virgin olive oil", "420 ml", "1 × 500 ml"], ["Tamari (gluten-free)", "90 ml", "1 × 150 ml"]]],
    ["Spices & herbs", [["Garam masala", "15 g", "1 × 50 g"], ["Ground cumin", "20 g", "1 × 50 g"], ["Smoked paprika", "10 g", "1 × 50 g"]]],
    ["Frozen", [["Mixed berries", "1.05 kg", "1 × 750 g + 1 × 300 g"]]],
  ],
  diets: ["Omnivore", "Flexitarian", "Pescatarian", "Vegetarian", "Vegan"],
  allergens: ["Gluten", "Dairy", "Eggs", "Tree nuts", "Peanuts", "Soy", "Fish", "Shellfish", "Sesame"],
  profiles: [["Balanced", "A standard everyday split", "50/20/30"], ["High-protein", "More protein for training and satiety", "35/35/30"], ["Mediterranean", "Olive oil, legumes; tagged recipes only", "45/18/37"], ["Low-carb", "Recipes ≤ 30% net carbs", "20/30/50"], ["Keto", "Recipes ≤ 10% net carbs", "5/20/75"], ["High-carb", "For endurance and active days", "60/15/25"], ["Zone", "Even 40/30/30 split", "40/30/30"], ["Low-fat", "Fat around 20%", "60/20/20"]],
};

// shared composite components used by both mobile and desktop screens
const S = storage;
const box = (...a) => S.box(...a), add = (...a) => S.add(...a), txt = (...a) => S.txt(...a), icon = (...a) => S.icon(...a);

S.personCard = (p, w) => {
  const c = S.panel("person/" + p.name, { gap: 12, pad: 16 });
  const top = box("person/top", { dir: "row", justify: "space-between", align: "start" });
  const col = box("person/id", { gap: 2 });
  add(col, txt(p.name, "Display/Title S", "text"), txt(`${p.sex} · ${p.age} y · ${p.kg} kg · ${p.cm} cm`, "Text/Sm", "text-soft"));
  add(top, col, S.btn(null, { icon: "pencil", v: "quiet" }));
  add(c, [top, { fillW: true }]);
  const tags = box("person/tags", { dir: "row", gap: 6 });
  add(tags, S.tag(p.act + " activity"), S.tag(p.goal === "Lose" ? "Lose weight · −500 kcal" : p.goal === "Gain" ? "Gain · +300 kcal" : "Maintain", { kind: "accent" }));
  add(c, tags, [S.rule(w - 32), { fillW: true }]);
  const nums = box("person/numbers", { dir: "row", justify: "space-between", align: "end" });
  const tcol = box("target", {});
  add(tcol, S.overline("Daily target"), txt(p.target + " kcal", "Display/Figure", "text"));
  const mcol = box("macros", { gap: 2, align: "end" });
  add(mcol, txt(`BMR ${p.bmr} · TDEE ${p.tdee}`, "Text/Xs", "text-soft"), txt(`C ${p.c} g · P ${p.p} g · F ${p.f} g`, "Text/Sm Medium", "text"));
  add(nums, tcol, mcol);
  if (w < 340) {
    // narrow (desktop two-up): stack target above macros
    nums.flex.dir = "column"; nums.flex.alignItems = "start"; nums.flex.rowGap = 6;
    mcol.flex.alignItems = "start";
    mcol.appendChild(mcol.children[0]);
  }
  add(c, [nums, { fillW: true }]);
  return c;
};

S.groceryRow = (n, q, pk) => {
  const r = box("item/" + n, { dir: "row", gap: 12, align: "center", pad: [10, 0] });
  const c = box("item/text", { gap: 1 });
  add(c, txt(n, "Text/Md", "text"));
  if (pk) add(c, txt(pk, "Text/Xs", "text-soft"));
  add(r, [c, { fillW: true }], txt(q, "Text/Md Medium", "text"));
  return r;
};

S.groceryCat = (cat, items, w) => {
  const g = box("category/" + cat, {});
  const h = box("category/head", { dir: "row", justify: "space-between", align: "center", pad: [0, 0, 6, 0] });
  add(h, S.overline(cat, "accent"), txt(String(items.length), "Text/Xs Medium", "text-soft"));
  add(g, [h, { fillW: true }], [S.rule(w), { fillW: true }]);
  items.forEach(([n, q, pk], i) => {
    add(g, [S.groceryRow(n, q, pk), { fillW: true }]);
    if (i < items.length - 1) add(g, [S.rule(w), { fillW: true }]);
  });
  return g;
};

return Object.keys(S.D).length;
