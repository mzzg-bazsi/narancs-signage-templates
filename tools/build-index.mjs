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
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const name = (v) => esc(typeof v === 'object' ? v.en || Object.values(v)[0] : v);
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Narancs Signage templates</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 16px;color:#2a1a10;background:#fff8f2}a{color:#e07a35}li{margin:6px 0}</style></head><body>
<h1>Narancs Signage community templates</h1>
<p>Install them from the admin panel (<b>Templates → Community gallery</b>), or download a file and use <b>Import from file</b>. <a href="https://github.com/mzzg-bazsi/narancs-signage-templates">Submit your own on GitHub</a> · <a href="https://mzzg-bazsi.github.io/narancs-signage-website/">Narancs Signage</a></p>
<ul>${templates.map((t) => `<li>${esc(t.icon)} <a href="${t.file}" download>${name(t.name)}</a> – ${t.languages.join(', ')} · ${t.slides} items</li>`).join('')}</ul>
</body></html>\n`);
console.log(`✔ ${templates.length} templates → ${path.relative(process.cwd(), out)}/index.json`);
