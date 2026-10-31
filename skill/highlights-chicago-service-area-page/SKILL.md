---
name: "highlights-chicago-service-area-page"
description: Write a complete Highlights Chicago electrician service area page (a "location page", "neighbourhood page" or "electricians in X" page) for the Service Areas app at /service-areas, from just an area name, e.g. "Lincoln Park", "Logan Square", "River North", "Evanston", "Oak Park". Use this whenever the user names a Chicago neighbourhood, community area or nearby suburb and wants a service area page, area page or "best electrician X" page for Highlights Chicago, asks to add, update, refresh or re-run an area page (including West Loop and Evanston), wants a Sanity draft for an area, or says "do the same for another area". The skill researches the area, pulls City of Chicago permit data, picks matching Google reviews, and writes one area.json that fills every field of the standard template (page and collection card), then builds, checks and drafts it into Sanity.
---

# Highlights Chicago service area page

Input: an area name. Output: `content/areas/<slug>/area.json` (and `permits.json` for a Chicago area) in the
Service Areas repo (`HighlightsChicago111/highlightschicago-Service-Area-Pages`, local checkout
`C:\highlights-chicago-service-pages-v2`), built, checked and, once the user says yes, written to Sanity as a draft.

**The design is fixed.** Every area page renders through the same Design System v3 template in the app, and every
area appears as a card on the `/service-areas` collection page. Your job is research and writing: one content file that
is specific and true for this area and fills **every field** of that template. Never hand-build HTML.

Read before writing:
- `references/content-guide.md`: fold intents, honesty rules, voice, research checklist, quality bar.
- `references/area-config.md`: every field, its size and where it shows on the page. Use it as the checklist.
- Worked examples: `references/examples/west-loop.json` (Chicago area with permit data) and
  `references/examples/evanston.json` (suburb: `city` set, record built from neighbouring Chicago permits).

## Workflow

`SKILL_DIR` is this skill's folder; `REPO` is the Service Areas checkout. Use `corepack pnpm` (pnpm is not on PATH).

### 1. Pin down the area
Confirm which area is meant if the name is ambiguous. Decide: **Chicago neighbourhood** (leave `city` out) or
**suburb** (set `city`, e.g. "Evanston", "Oak Park"). Suburbs change the H1 ("Electricians in Evanston, IL"), the
search schema, the licence answers and the permit section, so get this right first.

### 2. Research (web search)
Follow the research checklist in `references/content-guide.md`. Keep every source URL for `research_sources`. For a
suburb, also research its contractor registration, permit office, inspections and historic-district rules.

### 3. Pull permit data
Chicago area: run on the area's bounding box and save as `REPO/content/areas/<slug>/permits.json`:
```bash
python $SKILL_DIR/scripts/permits.py --north N --south S --west W --east E --out permits.json
```
Suburb: the City of Chicago data does not cover it, and most suburbs do not publish permits. Do **not** create
`permits.json`. Instead run `permits.py` on the Chicago community areas that border the suburb, and write the
`no_record_text` lead and 3 to 6 block-level `record_bullets` from Highlights' permits there (see Evanston).

### 4. Pick reviews
```bash
python -X utf8 $SKILL_DIR/scripts/reviews.py --out reviews.json --area "<Area>" --keywords "<district>,<building type>,..."
```
Choose 6 to 8: reviews naming the area first, then reviews matching its building types. Read candidates in full;
trim only at a sentence end with `cut_before`. Skip reviews that name a competitor.

### 5. Collection-card photo
First check `REPO/src/lib/area/card-library.json`. It holds the approved collection template's card for 15 areas
(Evanston, Lakeview, Avondale, Lincoln Square, Wicker Park, Logan Square, Lincoln Park, Oak Park, Sauganash, West Ridge,
Edison Park, Portage Park, Glenview, Wilmette, Park Ridge): exact photo in `public/images/areas/<slug>.jpg`, alt,
credit, summary and location line. **If the slug is there, leave `card_image`, `card_summary` and `card_region` out**:
the build and the collection page use the template's card exactly. Use the library's slug spelling for the page.
Only for an area not in the library: find a real photo of the area, free to reuse (Wikimedia Commons: CC BY, CC BY-SA
or public domain), crop to 4:3, save as `REPO/public/images/areas/<slug>.webp` at 800 x 600, and record the author,
licence and file page in `card_image`, plus `card_summary` and `card_region` in the template's style. Never use stock
or AI images, and never a photo without a known licence.

### 6. Write `area.json`
Copy the shape of the closest example and replace every value. Fill **every** field in `references/area-config.md`.
Mark anything you could not verify with `[CONFIRM: …]` (it shows in drafts, is hidden on the live site, and FAQ
answers containing one are kept out of the FAQ schema). Nothing may be copied from another area: every district,
building card, scope row and FAQ must be wrong if pasted onto a different area page.

### 7. Build and check
```bash
cd REPO
corepack pnpm run content:build     # must end with no errors and no "standard template" warnings
corepack pnpm run test:content
```
`content:build` rejects unknown keys and bad values, and warns about any standard block that is empty or outside its
expected size, any missing photo or card text, and every `[CONFIRM]` left. Fix them all (a `[CONFIRM]` may stay
only if it truly needs the client).
Then preview the page with `AREA_CONTENT_SOURCE=local` (preview config `area-local`, port 3012) at
`/service-areas/<slug>` and `/service-areas`, at 1440 px and 390 px: no horizontal scroll, no console errors, the
card shows on the collection page and opens the page.

### 8. Sanity draft (only after the user says yes)
State the target (Sanity project `hzu8fe77`, dataset `production`), what will be written and the expected count,
prove the target with `corepack pnpm run sanity:check`, dry-run `corepack pnpm run content:push --only <slug>`, and
wait for a clear yes. Then `corepack pnpm run content:push --only <slug> --yes` writes drafts only; the user
publishes in the Studio (`/service-areas/studio`, "Live page" tab shows the result). Never use `--publish` unless
asked.

### 9. Update the Google Sheet copy
Every published area page is also a row of the team's Google Sheet, tab "Service area pages" (headings = exact Sanity
field paths, e.g. `districts[2].name`). After the user publishes, run `corepack pnpm sheet:export` and update that tab with
`exports/service-area-pages.csv` (write the page's row through a Google Sheets connector if one is connected, otherwise
tell the user to import the file on that tab: File → Import → Replace current sheet, never Replace spreadsheet). When the user edits pages in the sheet, they
download it as CSV and `corepack pnpm sheet:import -- --file <csv>` dry-runs it; writing (`--yes`) needs the same
target proof and clear yes as step 8, writes drafts only, and refuses rows for pages edited in Sanity after the export.

### 10. Hand over
Say what is specific to the area (districts, building types, the permit mix or neighbouring record in one line),
list every `[CONFIRM: …]` item for the client, mention a thin or missing Highlights record, and give the preview link.

## Shared facts

Company facts (licences, BBB, citywide permit count, rating, founder line, phone, address) live in
`REPO/content/company.json` (a copy is in `assets/company.json`). Update that file, not area files, when they change.
The service catalogue is `scripts/services.py`; Highlights' Google reviews are `assets/highlights-reviews.csv`
(`REPO/content/highlights-reviews.csv` is the copy the build uses; refresh both when a new review pack arrives).
