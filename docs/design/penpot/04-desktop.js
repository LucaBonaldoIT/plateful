// Plateful design — Penpot builder, part 4: desktop screens (1440 wide).
// Build one screen per call to stay under the MCP 120 s limit, e.g.:
//   storage.th = "light"; await storage.buildDesktopScreen("dPlan", "Desktop — Light", 0);

const S = storage;
const box = (...a) => S.box(...a), add = (...a) => S.add(...a), txt = (...a) => S.txt(...a), icon = (...a) => S.icon(...a);
const DW = 1440, G = 40, CW = DW - 2 * G;
S.screens = S.screens || {};

const crumbs = (a, b) => {
  const c = box("crumbs", { dir: "row", gap: 6, align: "center" });
  add(c, txt(a, "Text/Sm Medium", "accent"), icon("chevron-right", 14, "text-soft"), txt(b, "Text/Sm", "text-soft"));
  return c;
};

// D1 — the week as a 7 × N grid
S.screens.dPlan = () => {
  const s = box("D1 Plan · week", { w: DW, fill: "bg" });
  s.setPluginData("equalize", "1");
  add(s, [S.dHeader("Plans"), { fillW: true }]);
  const body = box("body", { gap: 24, pad: [32, G, 40, G] });
  const top = box("title-row", { dir: "row", justify: "space-between", align: "end" });
  const tc = box("titles", { gap: 6 });
  add(tc, crumbs("Plans", "Week of 2 Nov 2026"), txt("Week of 2 Nov 2026", "Display/Title XL", "text"));
  const tags = box("plan/tags", { dir: "row", gap: 6 });
  add(tags, S.tag("2 people", { icon: "users" }), S.tag("Vegetarian", { kind: "accent" }), S.tag("High-protein · 35/35/30", { kind: "accent" }), S.tag("No gluten"), S.tag("3 meals / day"), S.tag("Leftovers on", { icon: "leftover" }));
  add(tc, tags);
  const acts = box("actions", { dir: "row", gap: 8 });
  add(acts, S.btn("Regenerate", { icon: "refresh" }), S.btn("Generate week", { v: "primary", icon: "sparkles" }), S.btn("Grocery list · 37", { icon: "basket" }));
  add(top, tc, acts);
  add(body, [top, { fillW: true }]);

  const LW = 112, gap = 8, colW = Math.floor((CW - LW - 7 * gap) / 7);
  const grid = box("week-grid", { gap });
  const hr = box("grid/days", { dir: "row", gap });
  add(hr, S.spacer(1, LW));
  S.D.days.forEach((d, i) => {
    const [dn, num] = d.split(" ");
    const c = box("day/" + d, { dir: "row", gap: 6, align: "end", w: colW, hs: "fix", pad: [0, 4] });
    add(c, txt(dn, "Text/Sm Medium", i === 0 ? "accent" : "text-soft"), txt(num, "Display/Title S", i === 0 ? "accent" : "text"));
    add(hr, c);
  });
  add(grid, hr);
  [["Breakfast", "25%"], ["Lunch", "40%"], ["Dinner", "35%"]].forEach(([slot, share], si) => {
    const row = box("grid/" + slot, { dir: "row", gap });
    row.setPluginData("cardrow", "1");
    const lab = box("slot-label", { w: LW, hs: "fix", pad: [14, 0], gap: 2 });
    add(lab, S.overline(slot), txt(share + " kcal", "Text/Xs", "text-soft"));
    add(row, lab);
    S.D.week.forEach((day, di) => {
      const card = S.mealCard({ ...day[si], slot: "", selected: di === 0 && si === 2 }, { compact: true, tw: colW - 26 });
      card.resize(colW, card.height);
      card.setPluginData("sz", "fix,auto");
      add(row, card);
    });
    add(grid, row);
  });
  add(body, grid);

  const sum = box("week-summary", { dir: "row", gap: 16 });
  const person = (name, kcal, tgt, d, macros) => {
    const p = S.panel("summary/" + name, { gap: 10, pad: 20 });
    const t = box("t", { dir: "row", justify: "space-between", align: "center" });
    const l = box("l", { dir: "row", gap: 8, align: "center" });
    add(l, txt(name, "Display/Title S", "text"), S.tag(d, { kind: "ok" }));
    add(t, l, txt("avg / day", "Text/Xs", "text-soft"));
    add(p, [t, { fillW: true }], txt(kcal + " / " + tgt + " kcal", "Display/Figure", "text"), [S.bar(0.99, 400), { fillW: true }], txt(macros, "Text/Sm", "text-soft"));
    return p;
  };
  add(sum, [person("Giulia", "2,068", "2,075", "−0.3%", "P 180 / 182 g · C 183 / 182 g · F 68 / 69 g"), { fillW: true }],
    [person("Marco", "2,552", "2,564", "−0.5%", "P 221 / 224 g · C 228 / 224 g · F 84 / 85 g"), { fillW: true }]);
  const legend = S.panel("legend", { gap: 8, pad: 20 });
  add(legend, txt("Legend", "Text/Sm Medium", "text"));
  for (const [ic, role, t] of [["lock", "accent", "Locked — kept when regenerating"], ["leftover", "accent", "Leftovers — no extra cooking"], ["alert", "warn", "Portion capped at ×2.0"]]) {
    const r = box("r", { dir: "row", gap: 8, align: "center" });
    add(r, icon(ic, 15, role), txt(t, "Text/Sm", "text-soft"));
    add(legend, r);
  }
  add(sum, legend);
  add(body, [sum, { fillW: true }]);
  add(s, [body, { fillW: true }]);
  add(s, [S.dFooter(), { fillW: true }]);
  return s;
};

// D2 — grocery list with a clipboard preview (REQUIREMENTS FR-GL-5)
S.screens.dGrocery = () => {
  const s = box("D2 Grocery list", { w: DW, fill: "bg" });
  add(s, [S.dHeader("Plans"), { fillW: true }]);
  const body = box("body", { dir: "row", gap: 40, pad: [32, G, 40, G], align: "start" });
  const SW = 400;
  const side = box("summary", { gap: 18, w: SW, hs: "fix" });
  add(side, crumbs("Week of 2 Nov 2026", "Grocery list"), txt("37 items", "Display/Title XL", "text"), txt("Mon 2 – Sun 8 Nov · 21 meals · 2 people", "Text/Md", "text-soft"));
  add(side, [S.btn("Copy list", { v: "primary", size: "lg", icon: "copy" }), { fillW: true }]);
  const prev = S.panel("clipboard-preview", { gap: 8, pad: 16, fill: "bg-soft" });
  add(prev, S.overline("Clipboard preview"));
  const mono = txt("Plateful — Week of 2 Nov 2026\n\nPRODUCE\n- [ ] Avocado — 4\n- [ ] Baby spinach — 600 g (3 × 200 g bag)\n- [ ] Broccoli — 1.10 kg\n- [ ] Cherry tomatoes — 750 g (3 × 250 g)\n…\n\nDAIRY & EGGS\n- [ ] Cottage cheese — 900 g (2 × 500 g)\n- [ ] Eggs — 18 (3 × 6)\n…", "Text/Xs", "text", { width: SW - 34 });
  const monoFont = penpot.fonts.all.find(f => f.name === "JetBrains Mono") || penpot.fonts.all.find(f => /Mono/.test(f.name));
  if (monoFont) { monoFont.applyToText(mono, monoFont.variants.find(v => v.fontWeight == "400" && v.fontStyle === "normal")); mono.fontSize = "12"; mono.lineHeight = "1.6"; }
  add(prev, mono);
  add(side, [prev, { fillW: true }], [S.notice("Always check product labels. Allergen data may be incomplete or wrong.", { icon: "alert", kind: "warn", width: SW - 70 }), { fillW: true }]);
  add(body, side);
  const colW = Math.floor((CW - SW - 40 - 32) / 2);
  const cols = box("categories", { dir: "row", gap: 32, align: "start" });
  const c1 = box("col-1", { gap: 28, w: colW, hs: "fix" }), c2 = box("col-2", { gap: 28, w: colW, hs: "fix" });
  // keep aisle order (FR-GL-4): fill column 1, then column 2, split at half the rows
  const total = S.D.grocery.reduce((t, g) => t + g[1].length + 2, 0);
  let acc = 0;
  for (const [cat, items] of S.D.grocery) {
    add(acc < total / 2 ? c1 : c2, [S.groceryCat(cat, items, colW), { fillW: true }]);
    acc += items.length + 2;
  }
  add(cols, c1, c2);
  add(body, cols);
  add(s, [body, { fillW: true }]);
  add(s, [S.dFooter(), { fillW: true }]);
  return s;
};

// D3 — household
S.screens.dHousehold = () => {
  const s = box("D3 Household", { w: DW, fill: "bg" });
  add(s, [S.dHeader("Household"), { fillW: true }]);
  const body = box("body", { gap: 28, pad: [32, G, 40, G] });
  const tc = box("titles", { gap: 6 });
  add(tc, S.overline("Who's eating"), txt("Household", "Display/Title XL", "text"));
  add(body, tc);
  const lw = 640, rw = CW - lw - 40;
  const cols = box("columns", { dir: "row", gap: 40, align: "start" });
  const left = box("left", { gap: 28, w: lw, hs: "fix" }), right = box("right", { gap: 28, w: rw, hs: "fix" });

  const ppl = S.section("People", { sub: "Adults only (18+). Everyone eats the same dishes; portions are sized per person.", subW: lw - 160, action: S.btn("Add person", { icon: "plus" }) });
  const pr = box("people/row", { dir: "row", gap: 16 });
  for (const p of S.D.people) add(pr, [S.personCard(p, (lw - 16) / 2), { fillW: true }]);
  add(ppl, [pr, { fillW: true }]);
  add(left, [ppl, { fillW: true }]);

  const diet = S.section("Diet", { sub: "One diet for the whole household. Lacto-ovo vegetarian allows dairy, eggs and honey.", subW: lw });
  const chips = box("diet/chips", { dir: "row", gap: 8 });
  S.D.diets.forEach(d => add(chips, S.chip(d, d === "Vegetarian")));
  add(diet, chips);
  add(left, [diet, { fillW: true }]);

  const al = S.section("Allergens", { sub: "Recipes with any of these are never used.", subW: lw });
  const ach = box("allergen/chips", { dir: "row", gap: 8, wrap: true, w: lw, hs: "fix" });
  S.D.allergens.forEach(d => add(ach, S.chip(d, d === "Gluten")));
  add(al, [ach, { fillW: true }], [S.notice("Always check product labels. Allergen data may be incomplete or wrong.", { icon: "alert", kind: "warn", width: lw - 60 }), { fillW: true }]);
  add(left, [al, { fillW: true }]);

  const mac = S.section("Macro profile", { sub: "Share of daily calories · carbs / protein / fat", subW: rw });
  const grid = box("macro/grid", { dir: "row", gap: 8, wrap: true, w: rw, hs: "fix" });
  const cw = (rw - 8) / 2;
  for (const [t, d, r] of S.D.profiles) {
    const rr = S.radioRow(t, d, t === "High-protein", r, cw);
    rr.resize(cw, rr.height); rr.setPluginData("sz", "fix,auto");
    add(grid, rr);
  }
  add(mac, [grid, { fillW: true }]);
  add(right, [mac, { fillW: true }]);

  const cp = S.panel("compatibility", { gap: 12 });
  add(cp, txt("Recipes available with these settings", "Text/Md Medium", "text"));
  const rows = box("rows", { dir: "row", gap: 32 });
  for (const [k, v, warn] of [["Breakfast", "18"], ["Lunch", "41"], ["Dinner", "44"], ["Snack", "6", true]]) {
    const c = box("count/" + k, { gap: 2 });
    add(c, S.overline(k), txt(v, "Display/Figure", warn ? "warn" : "text"));
    if (warn) add(c, txt("repeats likely", "Text/Xs", "warn"));
    add(rows, c);
  }
  add(cp, rows);
  add(right, [cp, { fillW: true }]);
  add(cols, left, right);
  add(body, [cols, { fillW: true }]);
  add(s, [body, { fillW: true }]);
  add(s, [S.dFooter(), { fillW: true }]);
  return s;
};

S.buildDesktopScreen = async (key, pageName, y) => {
  if (penpot.currentPage.name !== pageName) { await penpot.openPage(penpotUtils.getPageById(S.pages[pageName])); await new Promise(r => setTimeout(r, 300)); }
  const name = { dPlan: "D1 Plan · week", dGrocery: "D2 Grocery list", dHousehold: "D3 Household" }[key];
  for (const c of penpot.root.children.filter(c => c.name === name)) c.remove();
  const b = S.screens[key]();
  b.x = 0; b.y = y;
  await S.finalize(b);
  return { id: b.id, h: Math.round(b.height) };
};

return Object.keys(S.screens);
