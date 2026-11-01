// Plateful design — Penpot builder, part 3: mobile screens (390 wide).
// Screens are numbered as in REQUIREMENTS §13.3. Build a theme with:
//   await storage.buildMobile("light", "Mobile — Light");
// If a full build hits the MCP 120 s limit, pass a subset of keys:
//   await storage.buildMobile("dark", "Mobile — Dark", ["grocery", "settings"], 9 * 470);

const S = storage;
const box = (...a) => S.box(...a), add = (...a) => S.add(...a), txt = (...a) => S.txt(...a), icon = (...a) => S.icon(...a);
const W = 390, IW = W - 32;
S.screens = S.screens || {};

// sheet over a dimmed page; returns { screen, sheet }
S.sheetScreen = (name, h = 844) => {
  const s = box(name, { w: W, h, fill: "bg", justify: "end", clip: true });
  const back = penpot.createRectangle(); back.name = "backdrop"; back.resize(W, h); back.fills = [S.F("backdrop")];
  add(s, [back, { abs: true }]);
  const sheet = box("sheet", { gap: 16, pad: [10, 16, 24, 16], fill: "surface", align: "center" });
  sheet.borderRadiusTopLeft = 12; sheet.borderRadiusTopRight = 12;
  const handle = penpot.createRectangle(); handle.name = "sheet/handle"; handle.resize(36, 4); handle.borderRadius = 2; handle.fills = [S.F("line-strong")];
  add(sheet, handle);
  add(s, [sheet, { fillW: true }]);
  return { screen: s, sheet };
};

S.stepHeader = (step, total, title, sub) => {
  const h = box("onboarding/head", { gap: 10, pad: [20, 16, 0, 16] });
  const prog = box("progress", { dir: "row", gap: 6 });
  for (let i = 1; i <= total; i++) {
    const r = penpot.createRectangle(); r.name = "step"; r.resize(10, 4); r.borderRadius = 2; r.fills = [S.F(i <= step ? "accent-fill" : "line-strong")];
    add(prog, [r, { fillW: true }]);
  }
  add(h, [prog, { fillW: true }], S.overline(`Step ${step} of ${total}`, "accent"), txt(title, "Display/Title L", "text"), txt(sub, "Text/Md", "text-soft", { width: IW }));
  return h;
};

S.householdBody = () => {
  const body = box("body", { gap: 28, pad: [20, 16, 24, 16] });
  const ppl = S.section("People", { sub: "Adults only (18+). Everyone eats the same dishes; portions are sized per person.", subW: IW });
  for (const p of S.D.people) add(ppl, [S.personCard(p, IW), { fillW: true }]);
  add(ppl, [S.btn("Add person", { icon: "plus" }), { fillW: true }]);
  add(body, [ppl, { fillW: true }]);

  const diet = S.section("Diet", { sub: "One diet for the whole household.", subW: IW });
  const chips = box("diet/chips", { dir: "row", gap: 8, wrap: true, w: IW, hs: "fix" });
  S.D.diets.forEach(d => add(chips, S.chip(d, d === "Vegetarian")));
  add(diet, [chips, { fillW: true }], txt("Lacto-ovo: dairy, eggs and honey are allowed.", "Text/Xs", "text-soft"));
  add(body, [diet, { fillW: true }]);

  const mac = S.section("Macro profile", { sub: "Share of daily calories · carbs / protein / fat", subW: IW });
  const list = box("macro/list", { gap: 8 });
  for (const [t, d, r] of S.D.profiles) add(list, [S.radioRow(t, d, t === "High-protein", r), { fillW: true }]);
  add(mac, [list, { fillW: true }]);
  add(body, [mac, { fillW: true }]);

  const al = S.section("Allergens", { sub: "Recipes with any of these are never used.", subW: IW });
  const ach = box("allergen/chips", { dir: "row", gap: 8, wrap: true, w: IW, hs: "fix" });
  S.D.allergens.forEach(d => add(ach, S.chip(d, d === "Gluten")));
  add(al, [ach, { fillW: true }], [S.notice("Always check product labels. Allergen data may be incomplete or wrong.", { icon: "alert", kind: "warn", width: IW - 60 }), { fillW: true }]);
  add(body, [al, { fillW: true }]);

  const cp = S.panel("compatibility", { gap: 10 });
  add(cp, txt("Recipes available", "Text/Md Medium", "text"));
  const rows = box("compat/rows", { gap: 6 });
  for (const [k, v, warn] of [["Breakfast", "18"], ["Lunch", "41"], ["Dinner", "44"], ["Snack", "6", true]]) {
    const r = box("compat/" + k, { dir: "row", justify: "space-between", align: "center" });
    add(r, txt(k, "Text/Sm", "text-soft"), warn ? S.tag(v + " · repeats likely", { kind: "warn", icon: "alert" }) : txt(v, "Text/Sm Medium", "text"));
    add(rows, [r, { fillW: true }]);
  }
  add(cp, [rows, { fillW: true }]);
  add(body, [cp, { fillW: true }]);
  return body;
};

S.planSettingsBody = () => {
  const body = box("body", { gap: 28, pad: [20, 16, 24, 16] });
  const mpd = S.section("Meals per day", { sub: "Sets the slots and how calories are split.", subW: IW });
  add(mpd, [S.segmented(["1", "2", "3", "4", "5", "6"], 2, { equal: true }), { fillW: true }]);
  const slots = S.panel("slots", { gap: 10 });
  for (const [n, p] of [["Breakfast", 25], ["Lunch", 40], ["Dinner", 35]]) {
    const r = box("slot/" + n, { gap: 6 });
    add(r, [S.kv(n, p + "% of daily kcal"), { fillW: true }], [S.bar(p / 100, IW - 32), { fillW: true }]);
    add(slots, [r, { fillW: true }]);
  }
  add(mpd, [slots, { fillW: true }]);
  add(body, [mpd, { fillW: true }]);
  const wk = S.section("Week", { sub: "Plans always run Monday to Sunday.", subW: IW });
  add(wk, [S.field(null, "Mon 2 Nov – Sun 8 Nov 2026", { icon: "calendar", select: true }), { fillW: true }]);
  add(body, [wk, { fillW: true }]);
  const lo = S.panel("leftovers", { dir: "row", gap: 14, align: "center" });
  const col = box("leftovers/text", { gap: 2 });
  add(col, txt("Leftovers & batch cooking", "Text/Md Medium", "text"), txt("Cook a dinner twice and eat it for lunch the next day. Up to 3 times a week.", "Text/Sm", "text-soft", { width: IW - 90 }));
  add(lo, [col, { fillW: true }], S.toggle(true));
  add(body, [lo, { fillW: true }]);
  return body;
};

// 01 — welcome, legal acceptance (FR-LEGAL-2) and cookie notice (FR-LEGAL-6a)
S.screens.welcome = () => {
  const s = box("01 Welcome & terms", { w: W, h: 844, fill: "bg", clip: true });
  add(s, [S.mHeader(), { fillW: true }]);
  const body = box("body", { gap: 24, pad: [28, 16, 24, 16] });
  add(body, S.logo(48));
  const hero = box("hero", { gap: 10 });
  add(hero, txt("Plan the week.\nShop once.", "Display/Title XL", "text", { width: IW }),
    txt("Tell Plateful who's eating. It plans shared meals with portions sized for each person, then adds up everything you need to buy.", "Text/Md", "text-soft", { width: IW }));
  add(body, hero);
  const pts = box("key-points", { gap: 14 });
  for (const [ic, t, d] of [["wifioff", "Works offline", "No account, no server. Nothing is sent anywhere."], ["shield", "Your data stays here", "Saved in this browser only. Export it any time."], ["info", "Estimates, not advice", "Not a substitute for a doctor or dietitian."], ["alert", "Check the labels", "Allergen data may be incomplete or wrong."]]) {
    const r = box("point/" + t, { dir: "row", gap: 12, align: "start" });
    const col = box("point/text", { gap: 1 });
    add(col, txt(t, "Text/Md Medium", "text"), txt(d, "Text/Sm", "text-soft", { width: IW - 32 }));
    add(r, icon(ic, 20, "accent"), col);
    add(pts, r);
  }
  add(body, pts);
  const accept = box("acceptance", { gap: 12 });
  add(accept, S.check("I have read and accept the Disclaimer, Terms of Service and Privacy Policy.", true, { width: IW - 28, typo: "Text/Sm" }), S.check("I am 18 or older.", true, { typo: "Text/Sm" }));
  add(body, [accept, { fillW: true }], [S.btn("Get started", { v: "primary", size: "lg", trail: "chevron-right" }), { fillW: true }]);
  const links = box("legal-links", { dir: "row", gap: 16 });
  add(links, txt("Disclaimer", "Text/Sm Medium", "accent"), txt("Terms", "Text/Sm Medium", "accent"), txt("Privacy", "Text/Sm Medium", "accent"));
  add(body, links);
  add(s, [body, { fillW: true }]);
  const ck = S.panel("cookie-notice", { gap: 12, pad: 14, shadow: true, w: IW, hs: "fix" });
  const top = box("cookie/top", { dir: "row", gap: 10, align: "start" });
  const col = box("cookie/text", { gap: 2 });
  add(col, txt("No cookies here.", "Text/Sm Medium", "text"), txt("Plateful uses no cookies and no tracking. Your data is saved only in this browser's local storage.", "Text/Sm", "text-soft", { width: IW - 60 }));
  add(top, icon("cookie", 20, "accent"), col);
  const actions = box("cookie/actions", { dir: "row", justify: "space-between", align: "center" });
  add(actions, txt("Privacy Policy", "Text/Sm Medium", "accent"), S.btn("OK", { v: "primary", size: "sm" }));
  add(ck, [top, { fillW: true }], [actions, { fillW: true }]);
  add(s, [ck, { abs: true }]);
  s.setPluginData("pinBottom", ck.id);
  return s;
};

S.screens.onbHousehold = () => {
  const s = box("02 Onboarding · Household", { w: W, fill: "bg" });
  add(s, [S.mHeader(), { fillW: true }], [S.stepHeader(1, 2, "Your household", "Who's eating, and how. You can change all of this later."), { fillW: true }], [S.householdBody(), { fillW: true }]);
  const foot = box("onboarding/actions", { dir: "row", pad: [0, 16, 24, 16] });
  add(foot, [S.btn("Continue", { v: "primary", size: "lg", trail: "chevron-right" }), { fillW: true }]);
  add(s, [foot, { fillW: true }]);
  return s;
};

S.screens.onbPlan = () => {
  const s = box("03 Onboarding · Plan settings", { w: W, h: 844, fill: "bg" });
  add(s, [S.mHeader(), { fillW: true }], [S.stepHeader(2, 2, "Your week", "How many meals, and which week to plan first."), { fillW: true }], [S.planSettingsBody(), { fillW: true, fillH: true }]);
  const foot = box("onboarding/actions", { dir: "row", gap: 8, pad: [0, 16, 24, 16] });
  add(foot, S.btn("Back", { size: "lg", icon: "chevron-left" }), [S.btn("Create plan", { v: "primary", size: "lg", icon: "sparkles" }), { fillW: true }]);
  add(s, [foot, { fillW: true }]);
  return s;
};

S.screens.plans = () => {
  const s = box("04 Plans", { w: W, h: 844, fill: "bg", clip: true });
  add(s, [S.mHeader(), { fillW: true }]);
  const body = box("body", { gap: 20, pad: [24, 16] });
  const head = box("head", { dir: "row", align: "end", justify: "space-between" });
  const tcol = box("titles", { gap: 4 });
  add(tcol, S.overline("Your weeks"), txt("Plans", "Display/Title L", "text"));
  add(head, tcol, S.btn("New plan", { v: "primary", icon: "plus" }));
  add(body, [head, { fillW: true }]);
  const list = box("plan-list", { gap: 10 });
  for (const [t, d, m, e, cur] of [["Week of 2 Nov 2026", "Mon 2 – Sun 8 Nov", "21 meals · 2 people", "Edited today", true], ["Week of 26 Oct 2026", "Mon 26 Oct – Sun 1 Nov", "21 meals · 2 people", "Edited 25 Oct", false], ["Week of 19 Oct 2026", "Mon 19 – Sun 25 Oct", "18 meals · 2 people", "Edited 18 Oct", false]]) {
    const c = S.panel("plan/" + t, { dir: "row", align: "center", gap: 12, pad: [14, 12, 14, 16], stroke: cur ? "accent" : "line" });
    const col = box("plan/text", { gap: 4 });
    const tr = box("plan/title", { dir: "row", gap: 8, align: "center" });
    add(tr, txt(t, "Display/Title S", "text"));
    if (cur) add(tr, S.tag("This week", { kind: "accent" }));
    add(col, tr, txt(d + " · " + m, "Text/Sm", "text-soft"), txt(e, "Text/Xs", "text-soft"));
    add(c, [col, { fillW: true }], S.btn(null, { icon: "more", v: "quiet" }));
    add(list, [c, { fillW: true }]);
  }
  add(body, [list, { fillW: true }], [S.notice("Plans keep a snapshot of your household. Editing the household doesn't change saved plans.", { icon: "info", width: IW - 60 }), { fillW: true }]);
  add(s, [body, { fillW: true, fillH: true }], [S.bottomNav("Plans"), { fillW: true }]);
  return s;
};

S.screens.plan = () => {
  const s = box("05 Plan · day", { w: W, fill: "bg" });
  add(s, [S.mHeader({ back: true, title: "Week of 2 Nov", actions: [S.btn(null, { icon: "basket", v: "quiet", role: "text" })] }), { fillW: true }]);
  const body = box("body", { gap: 16, pad: [16, 16, 24, 16] });
  const acts = box("plan/actions", { dir: "row", gap: 8 });
  add(acts, [S.btn("Generate week", { v: "primary", icon: "sparkles" }), { fillW: true }], [S.btn("Regenerate day", { icon: "refresh" }), { fillW: true }]);
  add(body, [acts, { fillW: true }]);
  const tabs = box("day-tabs", { dir: "row", gap: 6 });
  S.D.days.forEach((d, i) => {
    const on = i === 0, [dn, num] = d.split(" ");
    const t = box("day/" + d, { w: 46, h: 56, radius: 6, align: "center", justify: "center", fill: on ? "accent-fill" : "surface", stroke: on ? "accent-fill" : "line" });
    add(t, txt(dn, "Text/Xs Medium", on ? "on-accent" : "text-soft"), txt(num, "Display/Title S", on ? "on-accent" : "text"));
    add(tabs, t);
  });
  add(body, tabs);
  const meals = box("meals", { gap: 10 });
  S.D.week[0].forEach(m => add(meals, [S.mealCard(m, { tw: IW - 30 }), { fillW: true }]));
  add(body, [meals, { fillW: true }]);
  const tot = S.panel("day-totals", { gap: 14 });
  const th = box("totals/head", { dir: "row", justify: "space-between", align: "center" });
  add(th, txt("Monday totals", "Display/Title S", "text"), S.tag("High-protein · 35/35/30"));
  add(tot, [th, { fillW: true }]);
  for (const [n, k, t, d, macros, pct] of [["Giulia", "2,061", "2,075", "−1%", "P 176 / 182 g  ·  C 180 / 182 g  ·  F 70 / 69 g", 0.99], ["Marco", "2,571", "2,564", "+0%", "P 219 / 224 g  ·  C 226 / 224 g  ·  F 86 / 85 g", 1]]) {
    const r = box("person/" + n, { gap: 6 });
    const top = box("row", { dir: "row", justify: "space-between", align: "center" });
    const left = box("l", { dir: "row", gap: 8, align: "center" });
    add(left, txt(n, "Text/Md Medium", "text"), S.tag(d, { kind: "ok" }));
    add(top, left, txt(k + " / " + t + " kcal", "Text/Sm", "text-soft"));
    add(r, [top, { fillW: true }], [S.bar(pct, IW - 32), { fillW: true }], txt(macros, "Text/Xs", "text-soft"));
    add(tot, [r, { fillW: true }]);
  }
  add(body, [tot, { fillW: true }], [S.btn("Grocery list · 37 items", { v: "primary", size: "lg", icon: "basket" }), { fillW: true }]);
  add(s, [body, { fillW: true }], [S.bottomNav("Plans"), { fillW: true }]);
  return s;
};

S.screens.mealDetail = () => {
  const { screen, sheet } = S.sheetScreen("06 Meal · detail");
  const head = box("sheet/head", { dir: "row", justify: "space-between", align: "start", gap: 8 });
  const hc = box("h", { gap: 4 });
  add(hc, S.overline("Monday · Dinner"), txt("Red lentil dal with basmati rice", "Display/Title M", "text", { width: IW - 50 }));
  add(head, [hc, { fillW: true }], S.btn(null, { icon: "x", v: "quiet" }));
  add(sheet, [head, { fillW: true }]);
  const tags = box("tags", { dir: "row", gap: 6, wrap: true, w: IW, hs: "fix" });
  add(tags, S.tag("540 kcal / serving"), S.tag("35 min", { icon: "clock" }), S.tag("Cooks ×2 → Tue lunch", { kind: "accent", icon: "leftover" }));
  add(sheet, [tags, { fillW: true }]);
  const pt = S.panel("portions", { gap: 8, pad: [12, 14], fill: "bg" });
  const col = (v, i, typo) => { const c = txt(v, typo, i === 0 && typo !== "Text/Xs Medium" ? "text" : typo === "Text/Xs Medium" ? "text-soft" : "text"); c.resize([90, 70, 60, 100][i], c.height); c.growType = "auto-height"; return c; };
  const hdr = box("row/head", { dir: "row", gap: 8 });
  ["Person", "Portion", "kcal", "P / C / F g"].forEach((t, i) => add(hdr, col(t, i, "Text/Xs Medium")));
  add(pt, hdr, [S.rule(IW - 28), { fillW: true }]);
  for (const row of [["Giulia", "×1.35", "729", "36 / 112 / 16"], ["Marco", "×1.65", "891", "44 / 137 / 19"]]) {
    const r = box("row", { dir: "row", gap: 8 });
    row.forEach((v, i) => add(r, col(v, i, i === 0 ? "Text/Sm Medium" : "Text/Sm")));
    add(pt, r);
  }
  add(sheet, [pt, { fillW: true }]);
  const ing = box("ingredients", { gap: 8 });
  add(ing, txt("Ingredients · both servings, ×2 for leftovers", "Text/Sm Medium", "text"));
  for (const [n, q] of [["Red lentils", "350 g"], ["Basmati rice", "300 g"], ["Coconut milk", "400 ml"], ["Chopped tomatoes", "400 g"], ["Red onions", "2"], ["Garlic", "4 cloves"], ["Fresh ginger", "20 g"], ["Garam masala", "6 g"]]) add(ing, [S.kv(n, q), { fillW: true }]);
  add(sheet, [ing, { fillW: true }]);
  const meth = S.panel("method", { dir: "row", justify: "space-between", align: "center", pad: [12, 14], fill: "bg" });
  add(meth, txt("Method · 5 steps", "Text/Md Medium", "text"), icon("chevron-down", 18, "text-soft"));
  add(sheet, [meth, { fillW: true }]);
  const acts = box("sheet/actions", { dir: "row", gap: 8 });
  add(acts, [S.btn("Swap", { icon: "swap", size: "lg" }), { fillW: true }], [S.btn("Lock", { icon: "lock", size: "lg" }), { fillW: true }], S.btn(null, { icon: "trash", v: "quiet", iconRole: "err" }));
  add(sheet, [acts, { fillW: true }]);
  return screen;
};

S.screens.swap = () => {
  const { screen, sheet } = S.sheetScreen("07 Meal · swap");
  const head = box("sheet/head", { dir: "row", justify: "space-between", align: "start" });
  const hc = box("h", { gap: 4 });
  add(hc, S.overline("Monday · Breakfast"), txt("Swap breakfast", "Display/Title M", "text"));
  add(head, hc, S.btn(null, { icon: "x", v: "quiet" }));
  add(sheet, [head, { fillW: true }], [S.field(null, "Search recipes", { icon: "search", placeholder: true }), { fillW: true }],
    [txt("Vegetarian · gluten-free · fits breakfast. Best macro fit first.", "Text/Xs", "text-soft", { width: IW }), { fillW: true }]);
  const list = box("alternatives", { gap: 8 });
  for (const [n, m, fit, kind, sel] of [["Tofu scramble with spinach", "360 kcal · 15 min", "Best fit", "ok", true], ["Cottage cheese & berry bowl", "330 kcal · 5 min", "Good fit", "ok"], ["Overnight chia pudding with skyr", "340 kcal · 5 min", "Good fit", "ok"], ["Egg & feta breakfast wrap (GF)", "420 kcal · 10 min", "Cooked Thu", "warn"], ["Peanut butter banana smoothie", "390 kcal · 5 min", "Low protein", "default"]]) {
    const r = S.panel("alt/" + n, { dir: "row", gap: 12, align: "center", pad: [12, 14], stroke: sel ? "accent" : "line", fill: sel ? "accent-soft" : "surface" });
    const c = box("t", { gap: 2 });
    add(c, txt(n, "Text/Md Medium", "text", { width: IW - 140 }), txt(m, "Text/Xs", "text-soft"));
    add(r, [c, { fillW: true }], S.tag(fit, { kind }));
    add(list, [r, { fillW: true }]);
  }
  add(sheet, [list, { fillW: true }], [txt("Swapping a meal locks it, so generating again keeps it.", "Text/Xs", "text-soft", { width: IW }), { fillW: true }],
    [S.btn("Use Tofu scramble", { v: "primary", size: "lg", icon: "check" }), { fillW: true }]);
  return screen;
};

S.screens.household = () => {
  const s = box("08 Household", { w: W, fill: "bg" });
  const title = box("title", { gap: 4, pad: [24, 16, 0, 16] });
  add(title, S.overline("Who's eating"), txt("Household", "Display/Title L", "text"));
  add(s, [S.mHeader(), { fillW: true }], [title, { fillW: true }], [S.householdBody(), { fillW: true }], [S.bottomNav("Household"), { fillW: true }]);
  return s;
};

S.screens.personEdit = () => {
  const { screen, sheet } = S.sheetScreen("09 Person · edit");
  const head = box("sheet/head", { dir: "row", justify: "space-between", align: "center" });
  add(head, txt("Edit person", "Display/Title M", "text"), S.btn(null, { icon: "x", v: "quiet" }));
  add(sheet, [head, { fillW: true }]);
  const form = box("form", { gap: 14 });
  const labelled = (label, ctrl, hint) => { const f = box("field/" + label, { gap: 6 }); add(f, txt(label, "Text/Sm Medium", "text"), [ctrl, { fillW: true }]); if (hint) add(f, txt(hint, "Text/Xs", "text-soft")); return f; };
  add(form, [S.field("Name", "Marco"), { fillW: true }],
    [labelled("Sex", S.segmented(["Female", "Male"], 1, { equal: true }), "Used by the calorie formula (Mifflin-St Jeor)."), { fillW: true }]);
  const r = box("row", { dir: "row", gap: 10 });
  add(r, [S.field("Age", "36", { suffix: "y" }), { fillW: true }], [S.field("Weight", "82.0", { suffix: "kg" }), { fillW: true }], [S.field("Height", "181", { suffix: "cm" }), { fillW: true }]);
  add(form, [r, { fillW: true }],
    [labelled("Activity level", S.segmented(["Sedentary", "Moderate", "High"], 2, { equal: true }), "High: hard exercise 6–7 days a week, or a physical job."), { fillW: true }],
    [labelled("Goal", S.segmented(["Lose", "Maintain", "Gain"], 0, { equal: true })), { fillW: true }]);
  const res = S.panel("result", { dir: "row", justify: "space-between", align: "center", fill: "accent-soft", stroke: false, pad: [12, 14] });
  const rc = box("r", {}); add(rc, S.overline("Daily target", "accent"), txt("2,564 kcal", "Display/Figure", "text"));
  add(res, rc, txt("TDEE 3,064 − 500", "Text/Sm", "text-soft"));
  add(form, [res, { fillW: true }]);
  add(sheet, [form, { fillW: true }]);
  const acts = box("sheet/actions", { dir: "row", gap: 8 });
  add(acts, S.btn("Remove", { v: "quiet", icon: "trash", role: "err" }), [S.btn("Save", { v: "primary", size: "lg" }), { fillW: true }]);
  add(sheet, [acts, { fillW: true }]);
  return screen;
};

S.screens.grocery = () => {
  const s = box("10 Grocery list", { w: W, fill: "bg" });
  add(s, [S.mHeader({ back: true, title: "Grocery list" }), { fillW: true }]);
  const body = box("body", { gap: 24, pad: [20, 16, 24, 16] });
  const sum = box("summary", { gap: 6 });
  add(sum, S.overline("Week of 2 Nov 2026"), txt("37 items", "Display/Title L", "text"), txt("Mon 2 – Sun 8 Nov · 21 meals · 2 people", "Text/Sm", "text-soft"));
  add(body, sum, [S.btn("Copy list", { v: "primary", size: "lg", icon: "copy" }), { fillW: true }],
    [S.notice("Always check product labels. Allergen data may be incomplete or wrong.", { icon: "alert", kind: "warn", width: IW - 60 }), { fillW: true }]);
  for (const [cat, items] of S.D.grocery) add(body, [S.groceryCat(cat, items, IW), { fillW: true }]);
  add(s, [body, { fillW: true }], [S.footer(), { fillW: true }]);
  const t = S.toast("Copied to clipboard");
  add(s, [t, { abs: true }]);
  s.setPluginData("toast", t.id);
  return s;
};

S.screens.settings = () => {
  const s = box("11 Settings", { w: W, fill: "bg" });
  const title = box("title", { gap: 4, pad: [24, 16, 0, 16] });
  add(title, S.overline("Preferences & data"), txt("Settings", "Display/Title L", "text"));
  add(s, [S.mHeader(), { fillW: true }], [title, { fillW: true }]);
  const body = box("body", { gap: 28, pad: [20, 16, 24, 16] });
  const pd = S.section("New plan defaults");
  const p1 = S.panel("defaults", { gap: 14 });
  const r1 = box("row", { dir: "row", justify: "space-between", align: "center" }); add(r1, txt("Meals per day", "Text/Md", "text"), S.stepper(3));
  const r2 = box("row", { dir: "row", justify: "space-between", align: "center" }); add(r2, txt("Leftovers & batch cooking", "Text/Md", "text"), S.toggle(true));
  add(p1, [r1, { fillW: true }], [S.rule(IW - 32), { fillW: true }], [r2, { fillW: true }]);
  add(pd, [p1, { fillW: true }]);
  add(body, [pd, { fillW: true }]);
  const dt = S.section("Your data", { sub: "Everything is stored in this browser only. Export a backup to keep it safe or move it to another device.", subW: IW });
  const dp = S.panel("data", { gap: 0, pad: [4, 16] });
  const rows = [["download", "Export data", "plateful-2026-11-01.json · 2 people, 3 plans", "text"], ["upload", "Import data", "Replaces everything currently saved", "text"], ["trash", "Delete all data", "Removes your household and plans from this browser", "err"]];
  rows.forEach(([ic, t, d, role], i) => {
    const r = box("data/" + t, { dir: "row", gap: 12, align: "center", pad: [12, 0] });
    const c = box("t", { gap: 1 }); add(c, txt(t, "Text/Md Medium", role), txt(d, "Text/Xs", "text-soft", { width: IW - 100 }));
    add(r, icon(ic, 20, role === "err" ? "err" : "accent"), [c, { fillW: true }], icon("chevron-right", 16, "text-soft"));
    add(dp, [r, { fillW: true }]);
    if (i < rows.length - 1) add(dp, [S.rule(IW - 32), { fillW: true }]);
  });
  add(dt, [dp, { fillW: true }], [S.notice("Saved automatically · last saved a few seconds ago", { kind: "ok", icon: "check", width: IW - 60 }), { fillW: true }]);
  add(body, [dt, { fillW: true }]);
  const ab = S.section("About");
  const ap = S.panel("about", { gap: 8 });
  for (const [k, v] of [["Version", "1.0.0"], ["License", "MIT"], ["Design system", "Paper & ink"], ["Nutrition data", "USDA FoodData Central"]]) add(ap, [S.kv(k, v), { fillW: true }]);
  const links = box("links", { dir: "row", gap: 16 });
  add(links, txt("Disclaimer", "Text/Sm Medium", "accent"), txt("Terms", "Text/Sm Medium", "accent"), txt("Privacy", "Text/Sm Medium", "accent"), txt("Source", "Text/Sm Medium", "accent"));
  add(ap, [S.rule(IW - 32), { fillW: true }], links);
  add(ab, [ap, { fillW: true }]);
  add(body, [ab, { fillW: true }]);
  add(s, [body, { fillW: true }], [S.bottomNav("Settings"), { fillW: true }]);
  return s;
};

S.screens.deleteDialog = () => {
  const s = box("12 Settings · delete dialog", { w: W, h: 844, fill: "bg", align: "center", justify: "center", pad: 16, clip: true });
  const back = penpot.createRectangle(); back.name = "backdrop"; back.resize(W, 844); back.fills = [S.F("backdrop")];
  add(s, [back, { abs: true }]);
  const d = S.panel("dialog", { gap: 14, pad: 24, shadow: true });
  add(d, icon("alert", 24, "err"), txt("Delete all data?", "Display/Title M", "text"),
    txt("This removes your household, 3 saved plans and your settings from this browser. It can't be undone.", "Text/Md", "text-soft", { width: IW - 48 }),
    [S.notice("Export a backup first if you might need it again.", { icon: "download", width: IW - 110 }), { fillW: true }]);
  const acts = box("dialog/actions", { dir: "row", gap: 8, justify: "end", wrap: true });
  const del = S.btn("Delete everything", { v: "primary" });
  del.fills = [S.F("err")]; del.strokes = [S.S("err")];
  // dark err (#FF8D82) is light, so its label must be dark ink to stay readable
  if (S.th === "dark") penpotUtils.findShape(x => x.type === "text", del).fills = [S.F("bg")];
  add(acts, S.btn("Export first", { icon: "download" }), S.btn("Cancel", { v: "quiet" }), del);
  add(d, [acts, { fillW: true }]);
  add(s, [d, { fillW: true }]);
  return s;
};

S.screens.privacy = () => {
  const s = box("13 Legal · Privacy policy", { w: W, fill: "bg" });
  add(s, [S.mHeader({ back: true, title: "Privacy" }), { fillW: true }]);
  const body = box("body", { gap: 18, pad: [24, 16, 32, 16] });
  add(body, S.overline("Last updated 1 November 2026"), txt("Privacy Policy", "Display/Title L", "text"),
    [S.notice("Plateful runs entirely on your device. I do not collect, receive, store or share any of the data you enter.", { kind: "ok", icon: "shield", title: "In short", width: IW - 60 }), { fillW: true }]);
  for (const [h, p] of [["1. Controller", "Luca Bonaldo, me@lucabonaldo.dev. For the data you enter in the app, no controller processes it, because it never leaves your device."], ["2. Data you enter", "Names, sex, age, weight, height, activity level, goals, diet, allergen preferences and meal plans. Stored only in your browser's local storage. Never sent to me or anyone else."], ["3. Offline operation", "After the app has loaded, it makes no network requests. No analytics, trackers, advertising or third-party scripts."], ["4. Cookies and local storage", "The app sets no cookies. Local storage keeps only the data you create, your theme, and that you closed the cookie notice."], ["5. Hosting", "Files are served by Cloudflare Pages, which processes technical connection data (IP address, user agent, time) to deliver the app securely."]]) {
    const c = box("sec", { gap: 6 });
    add(c, txt(h, "Display/Title S", "text"), txt(p, "Text/Md", "text-soft", { width: IW }));
    add(body, c);
  }
  add(body, txt("Sections 6–9: export & import, your rights, children, changes…", "Text/Sm", "text-soft", { width: IW }));
  add(s, [body, { fillW: true }], [S.footer(), { fillW: true }]);
  return s;
};

S.mobileOrder = ["welcome", "onbHousehold", "onbPlan", "plans", "plan", "mealDetail", "swap", "household", "personEdit", "grocery", "settings", "deleteDialog", "privacy"];

S.buildMobile = async (theme, pageName, keys = S.mobileOrder, startX = 0) => {
  await penpot.openPage(penpotUtils.getPageById(S.pages[pageName]));
  await new Promise(r => setTimeout(r, 300));
  S.th = theme;
  const ids = [];
  let x = startX;
  for (const k of keys) {
    const b = S.screens[k]();
    for (const old of penpot.root.children.filter(c => c.name === b.name && c.id !== b.id)) old.remove();
    b.x = x; b.y = 0;
    await S.finalize(b);
    const bd = penpotUtils.findShape(s => s.name === "backdrop", b);
    if (bd) { bd.x = b.x; bd.y = b.y; bd.resize(b.width, b.height); }
    const pin = b.getPluginData("pinBottom");
    if (pin) { const p = penpotUtils.findShapeById(pin); p.x = b.x + 16; p.y = b.y + b.height - p.height - 16; }
    const toast = b.getPluginData("toast");
    if (toast) { const t = penpotUtils.findShapeById(toast); t.x = b.x + (b.width - t.width) / 2; t.y = b.y + 700; }
    x += W + 80; ids.push(b.id);
  }
  return ids;
};

return S.mobileOrder.length;
