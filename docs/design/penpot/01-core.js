// Plateful design — Penpot builder, part 1: core helpers and components.
// Run each part in order through the Penpot MCP `execute_code` tool. Parts share
// state through the plugin `storage` object. Library colors ("Light/*", "Dark/*")
// and typographies ("Display/*", "Text/*") must already exist; 00-library.js makes them.

const S = storage;
const lib = penpot.library.local;

// ---- library lookups ------------------------------------------------------
S.C = { light: {}, dark: {} };
for (const c of lib.colors) {
  if (c.path === "Light") S.C.light[c.name] = c;
  if (c.path === "Dark") S.C.dark[c.name] = c;
}
S.T = {};
for (const t of lib.typographies) S.T[t.path + "/" + t.name] = t;
S.th = S.th || "light";

S.F = (role) => S.C[S.th][role].asFill();
S.S = (role, w = 1, pos = "inner") => ({ ...S.C[S.th][role].asStroke(), strokeWidth: w, strokeAlignment: pos, strokeStyle: "solid" });

// ---- primitives -----------------------------------------------------------
S.txt = (str, typo = "Text/Md", role = "text", o = {}) => {
  const t = penpot.createText(str === "" ? " " : str);
  t.applyTypography(S.T[typo]);
  t.fills = [S.F(role)];
  if (o.align) t.align = o.align;
  if (o.width) { t.resize(o.width, t.height); t.growType = "auto-height"; } else t.growType = "auto-width";
  if (o.name) t.name = o.name;
  return t;
};

// Flex board. Sizing intent is kept in plugin data ("sz") and re-applied by
// finalize(), because Penpot drops verticalSizing when set right after creation.
S.box = (name, o = {}) => {
  const b = penpot.createBoard();
  b.name = name;
  b.fills = o.fill ? [S.F(o.fill)] : [];
  if (o.stroke) b.strokes = [S.S(o.stroke, o.strokeW || 1)];
  if (o.radius !== undefined) b.borderRadius = o.radius;
  if (o.w || o.h) b.resize(o.w || 100, o.h || 100);
  b.clipContent = o.clip ?? false;
  const f = b.addFlexLayout();
  f.dir = o.dir || "column";
  f.rowGap = o.gap ?? 0; f.columnGap = o.gap ?? 0;
  const p = o.pad ?? 0;
  const [pt, pr, pb, pl] = Array.isArray(p) ? (p.length === 2 ? [p[0], p[1], p[0], p[1]] : p) : [p, p, p, p];
  f.topPadding = pt; f.rightPadding = pr; f.bottomPadding = pb; f.leftPadding = pl;
  f.alignItems = o.align || "start";
  f.justifyContent = o.justify || "start";
  if (o.wrap) f.wrap = "wrap";
  const hs = o.hs || (o.w ? "fix" : "auto"), vs = o.vs || (o.h ? "fix" : "auto");
  b.setPluginData("sz", hs + "," + vs);
  if (o.shadow) b.shadows = [{ style: "drop-shadow", offsetX: 0, offsetY: 4, blur: 16, spread: 0, color: { color: "#1A1712", opacity: S.th === "light" ? 0.08 : 0.35 } }];
  return b;
};

const setSz = (s, axis, val) => {
  if (s.type !== "board") return;
  const cur = (s.getPluginData("sz") || "auto,auto").split(",");
  cur[axis === "h" ? 0 : 1] = val;
  s.setPluginData("sz", cur.join(","));
};
// add(parent, shape, [shape, { fillW, fillH, abs }], ...)
S.add = (parent, ...kids) => {
  for (const k of kids) {
    if (!k) continue;
    const [s, o] = Array.isArray(k) ? k : [k, {}];
    parent.appendChild(s);
    if (o.fillW) { s.layoutChild.horizontalSizing = "fill"; setSz(s, "h", "fill"); }
    if (o.fillH) { s.layoutChild.verticalSizing = "fill"; setSz(s, "v", "fill"); }
    if (o.abs) s.layoutChild.absolute = true;
  }
  return parent;
};

S.fixBars = (root) => {
  for (const n of penpotUtils.findShapes(s => s.type === "board" && !!s.getPluginData("bar"), root)) {
    const bar = penpotUtils.findShapeById(n.getPluginData("bar"));
    if (bar) { bar.resize(2, n.height); bar.x = n.x; bar.y = n.y; }
  }
};

S.finalize = async (root) => {
  const depth = (s) => { let d = 0; while (s.parent) { d++; s = s.parent; } return d; };
  const boards = penpotUtils.findShapes(s => s.type === "board" && !!s.getPluginData("sz"), root);
  if (root.getPluginData("sz")) boards.push(root);
  boards.sort((a, b) => depth(b) - depth(a));
  for (const b of boards) {
    const [hs, vs] = b.getPluginData("sz").split(",");
    const inLayout = b.parent && b.parent.type === "board" && (b.parent.flex || b.parent.grid);
    if (vs === "fill") { if (inLayout && b.layoutChild.verticalSizing !== "fill") b.layoutChild.verticalSizing = "fill"; }
    else if (b.flex && b.flex.verticalSizing !== vs) b.flex.verticalSizing = vs;
    if (hs === "fill") { if (inLayout && b.layoutChild.horizontalSizing !== "fill") b.layoutChild.horizontalSizing = "fill"; }
    else if (b.flex && b.flex.horizontalSizing !== hs) b.flex.horizontalSizing = hs;
  }
  await new Promise(r => setTimeout(r, 250));
  // equal-height meal cards in the desktop week grid. Wrapped text needs ~800 ms
  // to settle before auto heights are correct.
  if (root.getPluginData("equalize")) {
    const rows = penpotUtils.findShapes(x => x.getPluginData && x.getPluginData("cardrow") === "1", root);
    for (const row of rows) for (const c of row.children.filter(c => c.getPluginData("card") === "1")) c.flex.verticalSizing = "auto";
    await new Promise(r => setTimeout(r, 800));
    for (const row of rows) {
      const cards = row.children.filter(c => c.getPluginData("card") === "1");
      const h = Math.max(...cards.map(c => c.height));
      for (const c of cards) { c.flex.verticalSizing = "fix"; c.resize(c.width, h); }
    }
    await new Promise(r => setTimeout(r, 300));
  }
  for (const v of penpotUtils.findShapes(s => s.name === "bar/value" && !!s.getPluginData("pct"), root))
    v.resize(Math.max(2, v.parent.width * Number(v.getPluginData("pct"))), 4);
  S.fixBars(root);
};

// ---- icons (Lucide-style, 24px grid) --------------------------------------
S.ICONS = {
  plus: ['<path d="M12 5v14M5 12h14"/>'],
  minus: ['<path d="M5 12h14"/>'],
  "chevron-right": ['<path d="m9 18 6-6-6-6"/>'],
  "chevron-left": ['<path d="m15 18-6-6 6-6"/>'],
  "chevron-down": ['<path d="m6 9 6 6 6-6"/>'],
  "arrow-left": ['<path d="m12 19-7-7 7-7"/>', '<path d="M19 12H5"/>'],
  lock: ['<rect x="3" y="11" width="18" height="11" rx="2"/>', '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>'],
  unlock: ['<rect x="3" y="11" width="18" height="11" rx="2"/>', '<path d="M7 11V7a5 5 0 0 1 9.9-1"/>'],
  refresh: ['<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>', '<path d="M21 3v5h-5"/>'],
  swap: ['<path d="M8 3 4 7l4 4"/>', '<path d="M4 7h16"/>', '<path d="m16 21 4-4-4-4"/>', '<path d="M20 17H4"/>'],
  copy: ['<rect x="8" y="8" width="14" height="14" rx="2"/>', '<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'],
  check: ['<path d="M20 6 9 17l-5-5"/>'],
  trash: ['<path d="M3 6h18"/>', '<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>', '<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>'],
  download: ['<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>', '<path d="m7 10 5 5 5-5"/>', '<path d="M12 15V3"/>'],
  upload: ['<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>', '<path d="m17 8-5-5-5 5"/>', '<path d="M12 3v12"/>'],
  users: ['<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>', '<circle cx="9" cy="7" r="4"/>', '<path d="M22 21v-2a4 4 0 0 0-3-3.87"/>', '<path d="M16 3.13a4 4 0 0 1 0 7.75"/>'],
  calendar: ['<rect x="3" y="4" width="18" height="18" rx="2"/>', '<path d="M16 2v4M8 2v4M3 10h18"/>'],
  settings: ['<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>'],
  basket: ['<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>', '<path d="M3 6h18"/>', '<path d="M16 10a4 4 0 0 1-8 0"/>'],
  x: ['<path d="M18 6 6 18M6 6l12 12"/>'],
  alert: ['<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>', '<path d="M12 9v4M12 17h.01"/>'],
  info: ['<circle cx="12" cy="12" r="10"/>', '<path d="M12 16v-4M12 8h.01"/>'],
  more: ['<path d="M5 12h.01M12 12h.01M19 12h.01"/>'],
  moon: ['<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'],
  sun: ['<circle cx="12" cy="12" r="4"/>', '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>'],
  pencil: ['<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>'],
  clock: ['<circle cx="12" cy="12" r="10"/>', '<path d="M12 6v6l4 2"/>'],
  search: ['<circle cx="11" cy="11" r="8"/>', '<path d="m21 21-4.3-4.3"/>'],
  sparkles: ['<path d="M12 3l1.9 5.8 5.8 1.9-5.8 1.9L12 18.5l-1.9-5.9-5.8-1.9 5.8-1.9Z"/>', '<path d="M19 3v4M17 5h4"/>'],
  leftover: ['<path d="m15 10 5 5-5 5"/>', '<path d="M4 4v7a4 4 0 0 0 4 4h12"/>'],
  shield: ['<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>'],
  wifioff: ['<path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M5 12.86a10 10 0 0 1 5.17-2.69M19 12.86a10 10 0 0 0-2-1.45M2 8.82a15 15 0 0 1 4.18-2.65M22 8.82a15 15 0 0 0-11.29-3.76M2 2l20 20"/>'],
  leaf: ['<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>', '<path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'],
  cookie: ['<path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>', '<path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01M11 17v.01M7 14v.01"/>'],
};
S.icon = (name, size = 18, role = "text", sw = 1.75) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${S.ICONS[name].join("")}</svg>`;
  const g = penpot.createShapeFromSvg(svg);
  const b = penpot.createBoard();
  b.name = "icon/" + name; b.fills = []; b.resize(size, size); b.clipContent = false;
  b.appendChild(g); g.x = b.x; g.y = b.y; g.resize(size, size);
  const recolor = (s) => {
    if (s.children) s.children.forEach(recolor);
    if (s.type !== "group" && s.type !== "board") { s.strokes = [S.S(role, sw, "center")]; s.fills = []; }
  };
  recolor(g);
  return b;
};

// ---- components -----------------------------------------------------------
const { box, add, txt, icon, F } = new Proxy({}, { get: (_, k) => (...a) => S[k](...a) });

S.rule = (w) => { const r = penpot.createRectangle(); r.name = "rule"; r.resize(w || 100, 1); r.fills = [F("line")]; return r; };
S.spacer = (h = 8, w = 1) => { const r = penpot.createRectangle(); r.name = "spacer"; r.resize(w, h); r.fills = []; return r; };
S.overline = (s, role = "text-soft") => txt(s, "Text/Overline", role);

// v: default | primary | quiet ; size: sm | md | lg (lg = 44px touch target)
S.btn = (label, o = {}) => {
  const v = o.v || "default", size = o.size || "md";
  const h = size === "sm" ? 30 : size === "lg" ? 44 : 36;
  const px = size === "sm" ? 10 : size === "lg" ? 18 : 14;
  const iconOnly = !label;
  const b = box("button/" + (label || o.icon), {
    dir: "row", gap: 8, align: "center", justify: "center", h,
    w: iconOnly ? h : undefined, hs: iconOnly ? "fix" : "auto",
    pad: iconOnly ? 0 : [0, px], radius: 2,
    fill: v === "primary" ? "accent-fill" : undefined,
    stroke: v === "primary" ? "accent-fill" : v === "quiet" ? undefined : "line",
  });
  const role = v === "primary" ? "on-accent" : (o.role || (v === "quiet" ? "text-soft" : "text"));
  if (o.icon) add(b, icon(o.icon, size === "sm" ? 15 : 17, o.iconRole || role));
  if (label) add(b, txt(label, size === "sm" ? "Text/Xs Medium" : "Text/Sm Medium", role));
  if (o.trail) add(b, icon(o.trail, 15, role));
  return b;
};

S.tag = (label, o = {}) => {
  const kind = o.kind || "default";
  const fill = kind === "default" ? undefined : kind === "accent" ? "accent-soft" : kind + "-soft";
  const role = kind === "default" ? "text-soft" : kind;
  const t = box("tag/" + label, { dir: "row", gap: 4, align: "center", pad: [2, 8], radius: 2, fill, stroke: kind === "default" ? "line" : undefined });
  if (o.icon) add(t, icon(o.icon, 12, role, 1.75));
  add(t, txt(label, "Text/Xs Medium", role));
  return t;
};

S.notice = (text, o = {}) => {
  const kind = o.kind || "default";
  const n = box("notice/" + kind, { dir: "row", gap: 10, align: "start", pad: [12, 16, 12, 14], fill: kind === "default" ? "bg-soft" : kind + "-soft" });
  const bar = penpot.createRectangle(); bar.name = "notice-bar"; bar.resize(2, 10); bar.fills = [F(kind === "default" ? "line-strong" : kind)];
  add(n, [bar, { abs: true }]);
  if (o.icon) add(n, icon(o.icon, 17, kind === "default" ? "text-soft" : kind));
  const col = box("notice/body", { gap: 2 });
  if (o.title) add(col, txt(o.title, "Text/Sm Medium", "text"));
  add(col, txt(text, "Text/Sm", "text", { width: o.width || 280 }));
  add(n, [col, { fillW: true }]);
  n.setPluginData("bar", bar.id);
  return n;
};

S.field = (label, value, o = {}) => {
  const f = box("field/" + (label || value), { gap: 6 });
  if (label) add(f, txt(label, "Text/Sm Medium", "text"));
  const inp = box("input", { dir: "row", align: "center", justify: "space-between", gap: 8, h: o.h || 40, pad: [0, 12], radius: 2, fill: "surface", stroke: o.focus ? "accent" : o.err ? "err" : "line-strong", strokeW: o.focus ? 2 : 1 });
  if (o.icon) add(inp, icon(o.icon, 16, "text-soft"));
  const val = txt(value, "Text/Md", o.placeholder ? "text-soft" : "text");
  add(inp, val);
  if (o.icon) val.layoutChild.horizontalSizing = "fill";
  if (o.suffix) add(inp, txt(o.suffix, "Text/Sm", "text-soft"));
  if (o.select) add(inp, icon("chevron-down", 16, "text-soft"));
  add(f, [inp, { fillW: true }]);
  if (o.hint) add(f, txt(o.hint, "Text/Xs", o.err ? "err" : "text-soft", { width: o.hintW || 160 }));
  return f;
};

S.segmented = (opts, sel, o = {}) => {
  const s = box("segmented", { dir: "row", radius: 2, stroke: "line-strong", h: o.h || 38, clip: true });
  opts.forEach((label, i) => {
    const on = i === sel;
    const it = box("segment/" + label, { dir: "row", align: "center", justify: "center", pad: [0, o.px ?? 12], fill: on ? "accent-fill" : undefined });
    add(it, txt(label, o.typo || "Text/Sm Medium", on ? "on-accent" : "text"));
    add(s, [it, { fillH: true, fillW: !!o.equal }]);
    if (i < opts.length - 1) { const d = penpot.createRectangle(); d.name = "divider"; d.resize(1, 10); d.fills = [F("line-strong")]; add(s, d); d.layoutChild.verticalSizing = "fill"; }
  });
  return s;
};

S.check = (label, on, o = {}) => {
  const c = box("check/" + label, { dir: "row", gap: 10, align: "center" });
  const sq = box("checkbox", { w: 18, h: 18, radius: 3, align: "center", justify: "center", fill: on ? "accent-fill" : "surface", stroke: on ? "accent-fill" : "line-strong" });
  if (on) add(sq, icon("check", 13, "on-accent", 2.25));
  add(c, sq, txt(label, o.typo || "Text/Md", "text", o.width ? { width: o.width } : {}));
  return c;
};

S.chip = (label, on) => {
  const c = box("chip/" + label, { dir: "row", gap: 6, align: "center", pad: [0, 12], h: 34, radius: 17, fill: on ? "accent-soft" : undefined, stroke: on ? "accent" : "line-strong" });
  if (on) add(c, icon("check", 14, "accent", 2));
  add(c, txt(label, "Text/Sm Medium", on ? "accent" : "text"));
  return c;
};

S.stepper = (value, o = {}) => {
  const s = box("stepper", { dir: "row", align: "center", radius: 2, stroke: "line-strong", h: 40, fill: "surface" });
  const mk = (n) => { const b = box("step/" + n, { w: 40, h: 40, align: "center", justify: "center" }); add(b, icon(n, 16, "text")); return b; };
  const v = box("value", { w: o.w || 48, h: 40, align: "center", justify: "center" });
  add(v, txt(String(value), "Text/Md Medium", "text"));
  add(s, mk("minus"), v, mk("plus"));
  return s;
};

S.toggle = (on) => {
  const t = box("toggle", { dir: "row", w: 42, h: 24, radius: 12, pad: 3, align: "center", justify: on ? "end" : "start", fill: on ? "accent-fill" : "line-strong" });
  const k = penpot.createEllipse(); k.name = "knob"; k.resize(18, 18); k.fills = [F(on ? "on-accent" : "surface")];
  add(t, k); return t;
};

S.panel = (name, o = {}) => box(name, { gap: o.gap ?? 12, pad: o.pad ?? 16, radius: 6, fill: o.fill || "surface", stroke: o.stroke === false ? undefined : (o.stroke || "line"), shadow: o.shadow, dir: o.dir, align: o.align, justify: o.justify, w: o.w, h: o.h, hs: o.hs, vs: o.vs });

S.logo = (size = 40) => {
  const b = box("logo", { w: size, h: size, radius: size / 2, align: "center", justify: "center", fill: "accent-fill" });
  add(b, icon("leaf", Math.round(size * 0.5), "on-accent", 1.75));
  return b;
};

S.wordmark = () => { const t = txt("Plateful.", "Display/Wordmark", "text"); t.getRange(8, 9).fills = [F("accent")]; t.name = "wordmark"; return t; };

S.section = (title, o = {}) => {
  const s = box("section/" + title, { gap: o.gap ?? 12 });
  const head = box("section/head", { dir: "row", align: "end", justify: "space-between", gap: 8 });
  const tcol = box("section/titles", { gap: 2 });
  add(tcol, txt(title, o.big ? "Display/Title M" : "Display/Title S", "text"));
  if (o.sub) add(tcol, txt(o.sub, "Text/Sm", "text-soft", { width: o.subW || 300 }));
  add(head, tcol);
  if (o.action) add(head, o.action);
  add(s, [head, { fillW: true }]);
  return s;
};

S.bar = (pct, w, role = "accent-fill") => {
  const b = box("bar", { dir: "row", w, h: 4, radius: 2, fill: "bg-soft", clip: true });
  const r = penpot.createRectangle(); r.name = "bar/value"; r.resize(Math.max(2, Math.min(1, pct) * w), 4); r.fills = [F(role)];
  r.setPluginData("pct", String(Math.min(1, pct)));
  add(b, r); return b;
};

S.kv = (k, v, o = {}) => {
  const r = box("kv/" + k, { dir: "row", justify: "space-between", align: "center", gap: 8 });
  add(r, txt(k, o.kTypo || "Text/Sm", "text-soft"), txt(v, o.vTypo || "Text/Sm Medium", o.vRole || "text"));
  return r;
};

S.radioRow = (title, desc, on, right, w = 358) => {
  const r = box("radio/" + title, { dir: "row", gap: 12, align: "center", pad: [12, 14], radius: 6, fill: on ? "accent-soft" : "surface", stroke: on ? "accent" : "line" });
  const dot = box("radio", { w: 18, h: 18, radius: 9, align: "center", justify: "center", stroke: on ? "accent-fill" : "line-strong", strokeW: on ? 5 : 1, fill: "surface" });
  const col = box("radio/text", { gap: 1 });
  add(col, txt(title, "Text/Md Medium", "text"));
  if (desc) add(col, txt(desc, "Text/Xs", "text-soft", { width: w - 138 }));
  add(r, dot, [col, { fillW: true }]);
  if (right) add(r, txt(right, "Text/Xs Medium", on ? "accent" : "text-soft"));
  return r;
};

S.toast = (text) => {
  const t = box("toast", { dir: "row", gap: 10, align: "center", pad: [10, 16], radius: 6, fill: "text", shadow: true });
  add(t, icon("check", 16, "bg", 2.25), txt(text, "Text/Sm Medium", "bg"));
  return t;
};

// meal card; o.compact for the desktop grid
S.mealCard = (m, o = {}) => {
  const leftover = !!m.leftover;
  const c = S.panel("meal/" + (m.slot || "cell"), { gap: 8, pad: [12, 12, 14, 14], fill: leftover ? "bg-soft" : "surface", stroke: m.selected ? "accent" : "line" });
  c.setPluginData("card", "1");
  const top = box("meal/top", { dir: "row", align: "center", justify: "space-between" });
  add(top, m.slot ? S.overline(m.slot + (m.share ? " · " + m.share : "")) : S.spacer(1, 1));
  const acts = box("meal/actions", { dir: "row", align: "center" });
  add(acts, S.btn(null, { icon: m.locked ? "lock" : "unlock", v: "quiet", size: "sm", iconRole: m.locked ? "accent" : "text-soft" }), S.btn(null, { icon: "more", v: "quiet", size: "sm" }));
  add(top, acts);
  add(c, [top, { fillW: true }]);
  add(c, txt(m.name, o.compact ? "Text/Md Medium" : "Display/Title S", "text", { width: o.tw || 300 }));
  const tags = box("meal/tags", { dir: "row", gap: 6, wrap: !!o.compact, w: o.compact ? o.tw : undefined });
  if (o.compact) tags.flex.rowGap = 6;
  if (leftover) add(tags, S.tag(o.compact ? "From " + m.leftover.replace("Leftovers from ", "").split(" ")[0] : m.leftover, { kind: "accent", icon: "leftover" }));
  else {
    add(tags, S.tag(m.kcal + (o.compact ? " kcal" : " kcal / serving")));
    if (m.time && !o.compact) add(tags, S.tag(m.time, { icon: "clock" }));
    if (m.batch) add(tags, S.tag("Cooks ×2", { kind: "accent", icon: "leftover" }));
  }
  if (m.warn) add(tags, S.tag(o.compact ? "Capped" : m.warn, { kind: "warn", icon: "alert" }));
  add(c, tags);
  if (m.portions && !o.compact) add(c, txt(m.portions, "Text/Sm", "text-soft", { width: o.tw || 300 }));
  return c;
};

// ---- chrome ---------------------------------------------------------------
S.mHeader = (o = {}) => {
  const w = o.w || 390;
  const h = box("header", { w, fill: "bg" });
  const inner = box("header/inner", { dir: "row", align: "center", justify: "space-between", h: 56, pad: [0, o.back ? 8 : 16, 0, o.back ? 6 : 16], gap: 8 });
  const left = box("header/left", { dir: "row", align: "center", gap: 2 });
  if (o.back) add(left, S.btn(null, { icon: "arrow-left", v: "quiet", role: "text" }));
  add(left, o.title ? txt(o.title, "Display/Title S", "text") : S.wordmark());
  const right = box("header/right", { dir: "row", align: "center", gap: 2 });
  for (const a of (o.actions || [])) add(right, a);
  add(right, S.btn(null, { icon: S.th === "light" ? "moon" : "sun", v: "quiet" }));
  add(inner, left, right);
  add(h, [inner, { fillW: true }], [S.rule(w), { fillW: true }]);
  return h;
};

S.bottomNav = (active, o = {}) => {
  const w = o.w || 390;
  const n = box("bottom-nav", { w, fill: "bg" });
  const row = box("bottom-nav/items", { dir: "row", h: 64, pad: [0, 8] });
  for (const [ic, label] of [["calendar", "Plans"], ["users", "Household"], ["settings", "Settings"]]) {
    const on = label === active;
    const it = box("nav/" + label, { gap: 3, align: "center", justify: "center" });
    add(it, icon(ic, 21, on ? "accent" : "text-soft"), txt(label, "Text/Xs Medium", on ? "accent" : "text-soft"));
    add(row, [it, { fillW: true, fillH: true }]);
  }
  add(n, [S.rule(w), { fillW: true }], [row, { fillW: true }]);
  return n;
};

S.footer = (o = {}) => {
  const f = box("footer", { gap: 6, pad: [16, 16, 20, 16] });
  add(f, txt("Disclaimer · Terms · Privacy", "Text/Xs Medium", "text-soft"),
    txt("Estimates only — not medical advice. Your data never leaves this device.", "Text/Xs", "text-soft", { width: (o.w || 390) - 32 }));
  return f;
};

S.dHeader = (active, DW = 1440, G = 40) => {
  const h = box("header", { w: DW, fill: "bg" });
  const inner = box("header/inner", { dir: "row", align: "center", justify: "space-between", h: 56, pad: [0, G] });
  const nav = box("nav", { dir: "row", gap: 28, align: "center" });
  for (const n of ["Plans", "Household", "Settings"]) add(nav, txt(n, "Text/Sm Medium", n === active ? "accent" : "text-soft"));
  add(nav, S.btn(null, { icon: S.th === "light" ? "moon" : "sun", v: "quiet" }));
  add(inner, S.wordmark(), nav);
  add(h, [inner, { fillW: true }], [S.rule(DW), { fillW: true }]);
  return h;
};

S.dFooter = (DW = 1440, G = 40) => {
  const w = box("footer/wrap", { w: DW });
  const f = box("footer", { dir: "row", justify: "space-between", align: "center", pad: [20, G] });
  add(f, txt("Estimates only — not medical advice. Your data never leaves this device.", "Text/Xs", "text-soft"), txt("Disclaimer · Terms · Privacy · MIT", "Text/Xs Medium", "text-soft"));
  add(w, [S.rule(DW), { fillW: true }], [f, { fillW: true }]);
  return w;
};

return Object.keys(S).length;
