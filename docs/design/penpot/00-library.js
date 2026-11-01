// Plateful design — Penpot builder, part 0: library colors, typographies and pages.
// Run once on an empty Penpot file. Colors are the Paper & ink role tokens with the
// Leaf-green accent and teal success (REQUIREMENTS §13.2), one set per theme.

const roles = {
  light: {
    "bg": ["#F5F2EA", 1], "bg-soft": ["#EEEADE", 1], "surface": ["#FBF9F4", 1],
    "text": ["#1A1712", 1], "text-soft": ["#1A1712", 0.64], "line": ["#1A1712", 0.18], "line-strong": ["#1A1712", 0.34],
    "accent": ["#2E7D32", 1], "accent-fill": ["#2E7D32", 1], "accent-fill-hover": ["#23622A", 1], "on-accent": ["#FFF7F0", 1], "accent-soft": ["#E9F3E6", 1],
    "ok": ["#0F6B5C", 1], "ok-soft": ["#DCEFEB", 1], "warn": ["#8A5A08", 1], "warn-soft": ["#F8EED6", 1], "err": ["#B42318", 1], "err-soft": ["#F9E4E0", 1],
    "backdrop": ["#1A1712", 0.42],
  },
  dark: {
    "bg": ["#1C1915", 1], "bg-soft": ["#221E19", 1], "surface": ["#29241E", 1],
    "text": ["#F0ECDF", 1], "text-soft": ["#F0ECDF", 0.64], "line": ["#F0ECDF", 0.16], "line-strong": ["#F0ECDF", 0.30],
    "accent": ["#7BCF6F", 1], "accent-fill": ["#2E7D32", 1], "accent-fill-hover": ["#256B2B", 1], "on-accent": ["#FFF7F0", 1], "accent-soft": ["#172A17", 1],
    "ok": ["#5FC9B5", 1], "ok-soft": ["#12302B", 1], "warn": ["#F0C466", 1], "warn-soft": ["#2E2512", 1], "err": ["#FF8D82", 1], "err-soft": ["#3A1B19", 1],
    "backdrop": ["#000000", 0.6],
  },
};
const lib = penpot.library.local;
for (const theme of ["light", "dark"]) {
  for (const [role, [hex, op]] of Object.entries(roles[theme])) {
    const c = lib.createColor();
    c.name = role; c.path = theme === "light" ? "Light" : "Dark";
    c.color = hex; c.opacity = op;
  }
}

// findByName("Inter") matches "Inter Tight", so match exactly
const inter = penpot.fonts.all.find(f => f.name === "Inter");
const fraunces = penpot.fonts.all.find(f => f.name === "Fraunces");
const variant = (f, w) => f.variants.find(v => v.fontWeight == String(w) && v.fontStyle === "normal");
const typos = [
  ["Display/Title XL", fraunces, 500, 40, 1.1, 0],
  ["Display/Title L", fraunces, 500, 30, 1.1, 0],
  ["Display/Title M", fraunces, 500, 22, 1.15, 0],
  ["Display/Title S", fraunces, 500, 18, 1.2, 0],
  ["Display/Wordmark", fraunces, 600, 18.4, 1.2, 0],
  ["Display/Figure", fraunces, 500, 26, 1.1, 0],
  ["Text/Base", inter, 400, 17, 1.65, 0],
  ["Text/Md", inter, 400, 15, 1.5, 0],
  ["Text/Md Medium", inter, 500, 15, 1.5, 0],
  ["Text/Sm", inter, 400, 14, 1.5, 0],
  ["Text/Sm Medium", inter, 500, 14, 1.4, 0],
  ["Text/Xs", inter, 400, 12.5, 1.5, 0],
  ["Text/Xs Medium", inter, 500, 12.5, 1.5, 0.5],
  ["Text/Overline", inter, 500, 12.5, 1.4, 1.1],
];
for (const [name, font, w, size, lh, ls] of typos) {
  const t = lib.createTypography();
  const [path, n] = name.split("/");
  t.path = path; t.name = n;
  t.setFont(font, variant(font, w));
  t.fontSize = String(size); t.lineHeight = String(lh); t.letterSpacing = String(ls);
  if (name === "Text/Overline") t.textTransform = "uppercase";
}

penpot.currentPage.name = "Cover";
for (const n of ["Foundations", "Mobile — Light", "Mobile — Dark", "Desktop — Light", "Desktop — Dark"]) penpot.createPage().name = n;

return { colors: lib.colors.length, typographies: lib.typographies.length, pages: penpotUtils.getPages().map(p => p.name) };
