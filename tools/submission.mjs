// Beküldés feldolgozása: a GitHub issue űrlapból kiolvassa a sablont (csatolt fájl vagy beillesztett JSON),
// ellenőrzi a Narancs Signage ellenőrzőjével, és a templates/<id>/ mappába írja. Az eredmény a GITHUB_OUTPUT-ba kerül.
// Használat (Actionből): ISSUE_BODY=… ISSUE_AUTHOR=… node tools/submission.mjs <a narancs-signage repó mappája>
// A bemenet megbízhatatlan: csak környezeti változóként érkezik, shellbe soha nem kerül.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const app = path.resolve(process.argv[2] || 'app');
process.env.SIGNAGE_DATA ||= fs.mkdtempSync(path.join(os.tmpdir(), 'tpl-'));
const { validateTemplate } = await import(pathToFileURL(path.join(app, 'server/src/templates.js')).href);

const output = (k, v) => process.env.GITHUB_OUTPUT && fs.appendFileSync(process.env.GITHUB_OUTPUT, `${k}<<__END__\n${v}\n__END__\n`);
const fail = (msg) => { output('ok', 'false'); output('error', msg); console.error(`✘ ${msg}`); process.exit(0); };

// az issue form szakaszai: "### Mező\n\nérték"
export function parseForm(body) {
  const out = {};
  for (const part of String(body || '').split(/^### /m).slice(1)) {
    const nl = part.indexOf('\n');
    const label = part.slice(0, nl).trim();
    const value = part.slice(nl + 1).trim();
    out[label] = value === '_No response_' ? '' : value;
  }
  return out;
}

const CATEGORY = { 'Food & drink': 'food', Office: 'office', Retail: 'retail', 'Health & beauty': 'health', Education: 'education', Hotels: 'hospitality', Sport: 'sport', Events: 'events', Other: 'other' };
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'template';

async function readTemplate(field) {
  // 1) GitHub-ra feltöltött csatolmány (csak github.com / githubusercontent címről)
  const link = /https:\/\/(?:github\.com\/(?:user-attachments\/files|[\w.-]+\/[\w.-]+\/files)\/[^\s)]+|[\w.-]+\.githubusercontent\.com\/[^\s)]+)/.exec(field)?.[0];
  if (link) {
    const headers = link.startsWith('https://github.com/') && process.env.GH_TOKEN ? { Authorization: `Bearer ${process.env.GH_TOKEN}` } : {};
    const r = await fetch(link, { headers, redirect: 'follow', signal: AbortSignal.timeout(30000) });
    if (!r.ok) fail(`Could not download the attached file (HTTP ${r.status}).`);
    const text = await r.text();
    if (text.length > 64 * 1024 * 1024) fail('The file is larger than 64 MB.');
    return text;
  }
  // 2) beillesztett JSON (kódblokkban vagy anélkül)
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(field)?.[1];
  return (fenced ?? field).trim();
}

const f = parseForm(process.env.ISSUE_BODY);
const raw = await readTemplate(f['Template file'] || '');
if (!raw.startsWith('{')) fail('No template found. Drag the .narancs.json file into the "Template file" box (or paste its content).');
let t;
try { t = JSON.parse(raw); } catch { fail('The template file is not valid JSON.'); }
try { validateTemplate(t); } catch (e) { fail(`The template is not valid: ${e.message.replace(/\{(\w+)\}/g, (_, k) => e.vars?.[k] ?? k)}`); }

const name = (f['Template name'] || '').slice(0, 120) || (typeof t.meta?.name === 'string' ? t.meta.name : 'Template');
const languages = [/- \[x\] English/i.test(f.Languages || '') && 'en', /- \[x\] Magyar/i.test(f.Languages || '') && 'hu'].filter(Boolean);
t.meta = {
  ...(t.meta || {}),
  name, description: (f.Description || '').slice(0, 1000),
  category: CATEGORY[(f.Category || '').split(' / ')[0]] || 'other',
  languages: languages.length ? languages : t.meta?.languages || [t.meta?.lang || 'en'],
  author: (f.Author || '').slice(0, 120) || process.env.ISSUE_AUTHOR || '',
  license: f.License === 'CC-BY-4.0' ? 'CC-BY-4.0' : 'CC0-1.0',
  submitted_by: process.env.ISSUE_AUTHOR || null,
  created: new Date().toISOString(),
};

// egyedi mappa név; ugyanannak a beküldőnek a javított beküldése felülírja a sajátját
let id = slug(name), n = 1;
const owner = (dir) => { try { return JSON.parse(fs.readFileSync(path.join('templates', dir, 'template.narancs.json'), 'utf8')).meta?.submitted_by; } catch { return undefined; } };
while (fs.existsSync(path.join('templates', id)) && owner(id) !== process.env.ISSUE_AUTHOR) id = `${slug(name)}-${++n}`;
fs.mkdirSync(path.join('templates', id), { recursive: true });
fs.writeFileSync(path.join('templates', id, 'template.narancs.json'), JSON.stringify(t, null, 2) + '\n');
output('ok', 'true'); output('id', id); output('name', name);
console.log(`✔ templates/${id}/template.narancs.json`);
