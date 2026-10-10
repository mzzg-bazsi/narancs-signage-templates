// A galéria felépítése: minden sablon ellenőrzése a Narancs Signage saját ellenőrzőjével, majd index.json + fájlok a _site mappába.
// Használat: node tools/build-index.mjs <a narancs-signage repó mappája> [kimenet=_site]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const app = path.resolve(process.argv[2] || 'app');
const out = path.resolve(process.argv[3] || '_site');
process.env.SIGNAGE_DATA ||= fs.mkdtempSync(path.join(os.tmpdir(), 'tpl-')); // az ellenőrző modul adatbázist nyit
const { validateTemplate } = await import(pathToFileURL(path.join(app, 'server/src/templates.js')).href);

const CATEGORIES = ['food', 'office', 'retail', 'health', 'education', 'hospitality', 'sport', 'events', 'other'];
const pick = (v) => (v && typeof v === 'object' ? v : String(v ?? '')); // kétnyelvű {en, hu} vagy szöveg
const errors = [], templates = [];
// a galéria oldal mini képernyőihez: a diák rövid kivonata (a teljes sablont így nem kell letölteni)
const cut = (v, n = 160) => v == null || v === '' ? undefined : typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, String(x).slice(0, n)])) : String(v).slice(0, n);
function screens(t) {
  const forms = Object.fromEntries((t.forms || []).map((f) => [f.ref, f.name]));
  return Object.fromEntries(t.slides.map((s) => {
    const d = s.data || {};
    return [s.ref, {
      type: s.type, name: cut(s.name, 60), kicker: cut(d.kicker, 60), title: cut(d.title ?? forms[d.form_id], 90), body: cut(d.body ?? d.subtitle ?? d.text),
      items: (d.cards || d.buttons || []).slice(0, 4).map((c) => ({ icon: String(c.icon || '').slice(0, 8), title: cut(c.title ?? c.label, 40) })),
      zones: s.type === 'zones' ? (d.zones || []).map((z) => z.items?.[0]?.slide_id ?? null) : undefined, layout: d.layout, size: d.size,
    }];
  }));
}
fs.rmSync(out, { recursive: true, force: true });

for (const id of fs.readdirSync('templates').sort()) {
  const file = path.join('templates', id, 'template.narancs.json');
  if (!fs.existsSync(file)) continue;
  try {
    if (!/^[a-z0-9-]{1,60}$/.test(id)) throw new Error('the folder name must be lowercase letters, digits and dashes');
    const t = JSON.parse(fs.readFileSync(file, 'utf8'));
    validateTemplate(t);
    const m = t.meta || {};
    if (!m.name) throw new Error('meta.name is missing');
    const languages = Array.isArray(m.languages) && m.languages.length ? m.languages : [m.lang || 'en'];
    templates.push({
      id, file: `templates/${id}/template.narancs.json`, icon: String(m.icon || '📦').slice(0, 8),
      name: pick(m.name), description: pick(m.description), category: CATEGORIES.includes(m.category) ? m.category : 'other',
      languages, author: String(m.author || ''), license: String(m.license || 'CC0-1.0'), submitted_by: m.submitted_by || null,
      slides: t.slides.length, items: t.playlist?.items?.length || 0, forms: (t.forms || []).length, calendars: (t.calendars || []).length, media: (t.media || []).length,
      size: fs.statSync(file).size, created: m.created || null,
      preview: m.preview || t.playlist?.items?.[0]?.slide || t.slides[0]?.ref, playlist: (t.playlist?.items || []).map((i) => i.slide), screens: screens(t),
    });
    fs.mkdirSync(path.join(out, 'templates', id), { recursive: true });
    fs.copyFileSync(file, path.join(out, file));
  } catch (e) {
    errors.push(`${id}: ${e.message}`);
  }
}

if (errors.length) {
  console.error(`✘ ${errors.length} invalid template(s):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify({ version: 1, updated: new Date().toISOString(), templates }, null, 1));
// a statikus galéria oldal + az osztott képernyő elrendezések a fő repóból
for (const f of fs.readdirSync('site')) fs.copyFileSync(path.join('site', f), path.join(out, f));
fs.copyFileSync(path.join(app, 'server/public/shared/zones.js'), path.join(out, 'zones.js'));
console.log(`✔ ${templates.length} templates → ${path.relative(process.cwd(), out)}/index.json`);
