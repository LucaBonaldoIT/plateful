// Plateful design — Penpot builder, part 5: Foundations page and Cover.
// Run each block separately if a call gets close to the MCP 120 s limit:
//   await storage.buildFoundations();  // F1 colors, F2 type, F3 components (+ library components)
//   await storage.buildCover();

const S = storage;
const box = (...a) => S.box(...a), add = (...a) => S.add(...a), txt = (...a) => S.txt(...a), icon = (...a) => S.icon(...a);
const settle = () => new Promise(r => setTimeout(r, 500));

S.buildFoundations = async () => {
  await penpot.openPage(penpotUtils.getPageById(S.pages["Foundations"]));
  await new Promise(r => setTimeout(r, 300));
  for (const c of [...penpot.root.children]) c.remove();
  S.th = "light";

  // F1 — color roles
  const order = ["bg", "bg-soft", "surface", "text", "text-soft", "line", "line-strong", "accent", "accent-fill", "accent-fill-hover", "on-accent", "accent-soft", "ok", "ok-soft", "warn", "warn-soft", "err", "err-soft", "backdrop"];
  const f1 = box("F1 Color roles", { w: 1440, fill: "bg", pad: 48, gap: 28 });
  const h1 = box("head", { gap: 8 });
  add(h1, S.overline("Foundations"), txt("Color roles", "Display/Title XL", "text"),
    txt("Paper & ink roles with the Leaf-green accent and teal success. Components use roles only, never raw palette values. Each swatch is a library color (Light/… and Dark/…).", "Text/Md", "text-soft", { width: 760 }));
  add(f1, h1);
  for (const theme of ["light", "dark"]) {
    S.th = theme;
    const panel = box("theme/" + theme, { fill: "bg", stroke: "line", radius: 6, pad: 24, gap: 16 });
    add(panel, txt(theme === "light" ? "Light" : "Dark", "Display/Title M", "text"));
    const grid = box("swatches", { dir: "row", gap: 12, wrap: true, w: 1296, hs: "fix" });
    for (const role of order) {
      const c = S.C[theme][role];
      const sw = box("swatch/" + role, { gap: 8, w: 150, hs: "fix" });
      const chip = penpot.createRectangle(); chip.name = "chip"; chip.resize(150, 64); chip.borderRadius = 6;
      chip.fills = [c.asFill()]; chip.strokes = [S.S("line", 1)];
      add(sw, chip, txt("--ds-" + role, "Text/Xs Medium", "text"), txt(c.color + (c.opacity < 1 ? " · " + Math.round(c.opacity * 100) + "%" : ""), "Text/Xs", "text-soft"));
      add(grid, sw);
    }
    add(panel, grid);
    add(f1, [panel, { fillW: true }]);
  }
  S.th = "light";
  const contrast = S.panel("contrast", { gap: 8, pad: 20 });
  add(contrast, txt("Contrast (WCAG AA ≥ 4.5:1)", "Text/Md Medium", "text"),
    txt("Light — accent on paper 4.58 · on-accent on fill 4.84 · on-accent on hover 6.95 · accent on accent-soft 4.50 · ok on paper 5.73 · ok on ok-soft 5.37", "Text/Sm", "text-soft"),
    txt("Dark — accent on ink 9.17 · on-accent on fill 4.84 · on-accent on hover 6.16 · accent on accent-soft 7.97 · ok on ink 8.76 · ok on ok-soft 7.08", "Text/Sm", "text-soft"));
  add(f1, [contrast, { fillW: true }]);
  f1.x = 0; f1.y = 0;
  await S.finalize(f1); await settle();

  // F2 — typography
  const f2 = box("F2 Typography", { w: 1440, fill: "bg", pad: 48, gap: 24 });
  const h2 = box("head", { gap: 8 });
  add(h2, S.overline("Foundations"), txt("Typography", "Display/Title XL", "text"), txt("Fraunces for display, Inter for text. Sizes follow the design system scale (xs 12.5 · sm 14 · md 15 · base 17).", "Text/Md", "text-soft", { width: 760 }));
  add(f2, h2);
  const list = box("specimens", {});
  for (const [typo, sample, spec] of [["Display/Title XL", "Plan the week. Shop once.", "Fraunces 500 · 40 / 1.1"], ["Display/Title L", "Week of 2 Nov 2026", "Fraunces 500 · 30 / 1.1"], ["Display/Title M", "Red lentil dal with basmati rice", "Fraunces 500 · 22 / 1.15"], ["Display/Title S", "Monday totals", "Fraunces 500 · 18 / 1.2"], ["Display/Figure", "2,564 kcal", "Fraunces 500 · 26 / 1.1"], ["Display/Wordmark", "Plateful.", "Fraunces 600 · 18.4"], ["Text/Base", "Everyone eats the same dishes; portions are sized per person.", "Inter 400 · 17 / 1.65"], ["Text/Md", "Cook a dinner twice and eat it for lunch the next day.", "Inter 400 · 15 / 1.5"], ["Text/Md Medium", "Leftovers & batch cooking", "Inter 500 · 15 / 1.5"], ["Text/Sm", "Mon 2 – Sun 8 Nov · 21 meals · 2 people", "Inter 400 · 14 / 1.5"], ["Text/Sm Medium", "Generate week", "Inter 500 · 14 / 1.4"], ["Text/Xs", "3 × 200 g bag", "Inter 400 · 12.5 / 1.5"], ["Text/Xs Medium", "380 kcal / serving", "Inter 500 · 12.5 · +0.5"], ["Text/Overline", "Breakfast · 25%", "Inter 500 · 12.5 · caps +1.1"]]) {
    const r = box("type/" + typo, { dir: "row", gap: 24, align: "center", pad: [14, 0] });
    const meta = box("meta", { gap: 2, w: 220, hs: "fix" });
    add(meta, txt(typo, "Text/Sm Medium", "text"), txt(spec, "Text/Xs", "text-soft"));
    add(r, meta, typo === "Display/Wordmark" ? S.wordmark() : txt(sample, typo, "text"));
    add(list, [S.rule(1344), { fillW: true }], [r, { fillW: true }]);
  }
  add(f2, [list, { fillW: true }]);
  f2.x = 0; f2.y = f1.y + f1.height + 120;
  await S.finalize(f2); await settle();
  f2.y = f1.y + f1.height + 120;

  // F3 — components; each piece becomes a main component in the local library
  const f3 = box("F3 Components", { w: 1440, fill: "bg", pad: 48, gap: 32 });
  const h3 = box("head", { gap: 8 });
  add(h3, S.overline("Foundations"), txt("Components", "Display/Title XL", "text"), txt("Design-system classes (.ds-button, .ds-tag, .ds-notice, .ds-input, .ds-check, .ds-panel) plus Plateful's own: chip, segmented control, stepper, toggle, meal card, toast. Main components live in the local library.", "Text/Md", "text-soft", { width: 820 }));
  add(f3, h3);
  const comps = {};
  const reg = (name, shape, w) => { if (w) { shape.setPluginData("sz", "fix," + shape.getPluginData("sz").split(",")[1]); shape.resize(w, shape.height); } comps[name] = shape; return shape; };
  const group = (title, ...items) => {
    const g = box("group/" + title, { gap: 12 });
    const row = box("items", { dir: "row", gap: 12, align: "center", wrap: true, w: 1344, hs: "fix" });
    for (const it of items) add(row, it);
    add(g, S.overline(title, "accent"), row);
    return g;
  };
  add(f3,
    group("Buttons", reg("Button/Primary", S.btn("Generate week", { v: "primary", icon: "sparkles" })), reg("Button/Default", S.btn("Regenerate day", { icon: "refresh" })), reg("Button/Quiet", S.btn("Cancel", { v: "quiet" })), reg("Button/Icon", S.btn(null, { icon: "lock" })), reg("Button/Small", S.btn("OK", { v: "primary", size: "sm" })), reg("Button/Large", S.btn("Copy list", { v: "primary", size: "lg", icon: "copy" }))),
    group("Tags", reg("Tag/Default", S.tag("380 kcal / serving")), reg("Tag/Accent", S.tag("Vegetarian", { kind: "accent" })), reg("Tag/Leftover", S.tag("Leftovers from Mon dinner", { kind: "accent", icon: "leftover" })), reg("Tag/OK", S.tag("−1%", { kind: "ok" })), reg("Tag/Warn", S.tag("Capped for Marco", { kind: "warn", icon: "alert" }))),
    group("Selection", reg("Chip/On", S.chip("Gluten", true)), reg("Chip/Off", S.chip("Dairy", false)), reg("Checkbox/On", S.check("I am 18 or older.", true)), reg("Checkbox/Off", S.check("Peanuts", false)), reg("Toggle/On", S.toggle(true)), reg("Toggle/Off", S.toggle(false)), reg("Stepper", S.stepper(3)), reg("Segmented", S.segmented(["Sedentary", "Moderate", "High"], 1))),
    group("Fields", reg("Field/Text", S.field("Weight", "72.5", { suffix: "kg", hint: "30–300 kg" }), 220), reg("Field/Select", S.field("Week", "Mon 2 – Sun 8 Nov 2026", { icon: "calendar", select: true }), 300), reg("Field/Search", S.field(null, "Search recipes", { icon: "search", placeholder: true }), 300), reg("Field/Error", S.field("Age", "16", { err: true, hint: "Plateful plans for adults only.", hintW: 220 }), 260)),
    group("Feedback", reg("Notice/Warn", S.notice("Always check product labels. Allergen data may be incomplete or wrong.", { kind: "warn", icon: "alert", width: 320 }), 380), reg("Notice/OK", S.notice("Saved automatically.", { kind: "ok", icon: "check", width: 200 }), 260), reg("Notice/Info", S.notice("Plans keep a snapshot of your household.", { icon: "info", width: 280 }), 340), reg("Toast", S.toast("Copied to clipboard"))),
    group("Cards", reg("Meal card", S.mealCard(S.D.week[0][2], { tw: 300 })), reg("Meal card/Leftover", S.mealCard(S.D.week[1][1], { tw: 300 })), reg("Radio row", S.radioRow("High-protein", "More protein for training and satiety", true, "35/35/30"), 358)),
  );
  const ic = box("group/Icons", { gap: 12 });
  const irow = box("icons", { dir: "row", gap: 16, wrap: true, w: 1344, hs: "fix" });
  for (const n of Object.keys(S.ICONS)) { const c = box("icon-cell/" + n, { gap: 6, align: "center", w: 72, hs: "fix" }); add(c, icon(n, 22, "text"), txt(n, "Text/Xs", "text-soft")); add(irow, c); }
  add(ic, S.overline("Icons · Lucide-style, 1.75 stroke", "accent"), irow);
  add(f3, ic);
  f3.x = 0; f3.y = f2.y + f2.height + 120;
  await S.finalize(f3); await settle();
  f3.y = f2.y + f2.height + 120;

  for (const [name, shape] of Object.entries(comps)) {
    const comp = penpot.library.local.createComponent([shape]);
    const parts = name.split("/");
    comp.name = parts.pop(); comp.path = parts.join("/");
  }
  return [f1.id, f2.id, f3.id];
};

S.buildCover = async () => {
  await penpot.openPage(penpotUtils.getPageById(S.pages["Cover"]));
  await new Promise(r => setTimeout(r, 300));
  for (const c of [...penpot.root.children]) c.remove();
  S.th = "light";
  const cover = box("Cover", { w: 1600, h: 900, fill: "bg", pad: [80, 96], justify: "space-between", clip: true });
  const top = box("top", { dir: "row", justify: "space-between", align: "center" });
  const brand = box("brand", { dir: "row", gap: 14, align: "center" });
  add(brand, S.logo(44), S.wordmark());
  add(top, brand, S.tag("UI/UX · v0.1 · 1 Nov 2026"));
  const hero = box("hero", { gap: 20 });
  const h = txt("Plan the week.\nShop once.", "Display/Title XL", "text", { width: 900 });
  h.fontSize = "96"; h.lineHeight = "1.02";
  add(hero, S.overline("Plateful — design", "accent"), h, txt("Weekly meal planning and grocery lists for the whole household. Client-only, offline, no cookies. Built on the Paper & ink design system with a Leaf-green accent.", "Text/Base", "text-soft", { width: 760 }));
  const idx = box("index", { dir: "row", gap: 16 });
  for (const [n, d] of [["Foundations", "Colors, type, components, icons"], ["Mobile — Light", "13 screens · 390 wide"], ["Mobile — Dark", "13 screens · 390 wide"], ["Desktop — Light", "Plan, grocery list, household"], ["Desktop — Dark", "Plan, grocery list, household"]]) {
    const c = S.panel("index/" + n, { gap: 4, pad: [16, 18] });
    add(c, txt(n, "Text/Md Medium", "text"), txt(d, "Text/Xs", "text-soft"));
    add(idx, [c, { fillW: true }]);
  }
  const foot = box("foot", { dir: "row", justify: "space-between" });
  add(foot, txt("plateful.lucabonaldo.dev · github.com/LucaBonaldoIT/plateful", "Text/Sm", "text-soft"), txt("Spec: docs/REQUIREMENTS.md · MIT", "Text/Sm", "text-soft"));
  add(cover, [top, { fillW: true }], hero, [idx, { fillW: true }], [foot, { fillW: true }]);
  const leaf = icon("leaf", 420, "accent-soft", 1.2);
  add(cover, [leaf, { abs: true }]);
  leaf.x = cover.x + 1080; leaf.y = cover.y + 170;
  leaf.setParentIndex(0);
  await S.finalize(cover);
  return cover.id;
};

return "foundations ready";
