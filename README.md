# Narancs Signage – community templates

**English** · [Magyar](#magyar)

Ready-made content packs for [Narancs Signage](https://github.com/mzzg-bazsi/narancs-signage). Every template here appears in the admin panel under **Templates → Community gallery**, with a live preview, a language choice and one-click install.

## Use a template
- **In the admin panel:** Templates → Community gallery → *Install* (or *Download* the `.narancs.json` file).
- **Manually:** download a file from [`templates/`](templates) and use *Import from file* on the Templates page.

## Submit your own
1. In the admin panel, open a content item or playlist → **Export** → fill in the name and category → **Submit to the gallery**. The file is downloaded and a submission form opens here.
2. Drag the downloaded `.narancs.json` file into the *Template file* box and send the form.
3. A bot validates the template with the same checks Narancs Signage uses and opens a pull request. You get a comment with the result – if something is wrong, fix it and edit the issue.
4. After review the template is published automatically.

Templates must not contain personal data, and you must have the right to share their texts and images. Each template carries its own license (CC0-1.0 or CC-BY-4.0, see `meta.license`).

## Format
A template is one JSON file: `{ "format": "narancs-template", "version": 1, "meta", "slides", "playlist", "forms", "calendars", "media" }`. Content refers to each other by names (`s1`, `f1`, `c1`, `m1`), texts can be bilingual (`{ "en": "…", "hu": "…" }`), and `{{org_name}}`, `{{city}}`, `{{date+N}}` are filled in when installing. See the [documentation](https://mzzg-bazsi.github.io/narancs-signage-website/docs/#templates).

The gallery is published to GitHub Pages: [`index.json`](https://mzzg-bazsi.github.io/narancs-signage-templates/index.json). `tools/build-index.mjs` validates every template and builds the index; `tools/submission.mjs` turns a submission issue into a pull request.

---

## Magyar

Kész tartalomcsomagok a [Narancs Signage](https://github.com/mzzg-bazsi/narancs-signage)-hez. Minden itteni sablon megjelenik az admin felületen a **Sablonok → Közösségi galéria** alatt, élő előnézettel, nyelvválasztással és egy kattintásos telepítéssel.

### Sablon használata
- **Az admin felületen:** Sablonok → Közösségi galéria → *Telepítés* (vagy *Letöltés* `.narancs.json` fájlként).
- **Kézzel:** tölts le egy fájlt a [`templates/`](templates) mappából, és a Sablonok oldalon használd az *Importálás fájlból* gombot.

### Saját sablon beküldése
1. Az admin felületen nyiss meg egy tartalmat vagy lejátszási listát → **Exportálás** → add meg a nevet és a kategóriát → **Beküldés a galériába**. A fájl letöltődik, és itt megnyílik a beküldő űrlap.
2. Húzd a letöltött `.narancs.json` fájlt a *Template file* mezőbe, és küldd el az űrlapot.
3. Egy robot ugyanazzal az ellenőrzéssel vizsgálja meg, amit a Narancs Signage is használ, és pull requestet nyit. Az eredményről hozzászólást kapsz – ha hibás, javítsd, és szerkeszd az issue-t.
4. Jóváhagyás után a sablon automatikusan megjelenik.

A sablonban nem lehet személyes adat, és jogodnak kell lennie a szövegek és képek megosztására. Minden sablonnak saját licence van (CC0-1.0 vagy CC-BY-4.0, lásd `meta.license`).
