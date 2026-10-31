---
name: "highlights-chicago-service-area-page"
description: Write a complete Highlights Chicago electrician service area page (a "location page", "neighbourhood page" or "electricians in X" page) for the Service Areas app at /service-areas, from just an area name, e.g. "Lincoln Park", "Logan Square", "River North", "Evanston", "Oak Park". Use this whenever the user names a Chicago neighbourhood, community area or nearby suburb and wants a service area page, area page or "best electrician X" page for Highlights Chicago, asks to add, update, refresh or re-run an area page (including West Loop and Evanston), wants a Sanity draft for an area, or says "do the same for another area". The skill researches the area, pulls City of Chicago permit data, picks matching Google reviews, and writes one area.json that fills every field of the standard template (page and collection card), then adds it to the team Google Sheet's "Service area pages" tab and pushes it to Sanity as a draft.
---

# Highlights Chicago service area page

Input: an area name. Output: `<slug>.json`, the area's content file (and its permit data), added to the team Google
Sheet "Highlightchicago Writing Pages", tab **Service area pages**, and pushed to Sanity (project `hzu8fe77`) as a
**draft**. The owner reviews and publishes it in the Studio. Nothing is ever published from here.

**The design is fixed.** Every area page renders through the same Design System v3 template in the app, and every
area appears as a card on the `/service-areas` collection page. Your job is research and writing: one content file that
is specific and true for this area and fills **every field** of that template. Never hand-build HTML.

Read before writing:
- `references/content-guide.md`: fold intents, honesty rules, voice, research checklist, quality bar.
- `references/area-config.md`: every field, its size and where it shows on the page. Use it as the checklist.
- Worked examples: `references/examples/west-loop.json` (Chicago area with permit data) and
  `references/examples/evanston.json` (suburb: `city` set, record built from neighbouring Chicago permits).

## What you need

- Editor access to the sheet (the owner adds you) and its menu **Service area pages → Sanity** (appears a few seconds
  after the sheet opens). Once per person: **Set my Sanity token**, pasting the Sanity Editor token for project
  `hzu8fe77` you were given. Google asks you to allow the script the first time.
- Python 3 for the two scripts below. No repository, command line build or `.env.local` is needed.

## Workflow

`SKILL_DIR` is this skill's folder. Work in a folder of your own, e.g. `areas/<slug>/`.

### 1. Pin down the area
Confirm which area is meant if the name is ambiguous. Decide: **Chicago neighbourhood** (leave `city` out) or
**suburb** (set `city`, e.g. "Evanston", "Oak Park"). Suburbs change the H1 ("Electricians in Evanston, IL"), the
search schema, the licence answers and the permit section, so get this right first.

### 2. Research (web search)
Follow the research checklist in `references/content-guide.md`. Keep every source URL for `research_sources`. For a
suburb, also research its contractor registration, permit office, inspections and historic-district rules.

### 3. Pull permit data
Chicago area: run on the area's bounding box and save as `areas/<slug>/permits.json`:
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
These 15 areas already have their collection card (photo, alt, credit, summary, location line) built into the app:
Evanston, Lakeview, Avondale, Lincoln Square, Wicker Park, Logan Square, Lincoln Park, Oak Park, Sauganash, West Ridge,
Edison Park, Portage Park, Glenview, Wilmette, Park Ridge. **For these, leave `card_image`, `card_summary` and
`card_region` out**, and use that spelling of the slug. For any other area, write `card_summary` and `card_region` in
the same style, and find a real photo of the area that is free to reuse (Wikimedia Commons: CC BY, CC BY-SA or public
domain). Give the owner the photo's file page, author and licence: a new card photo is added to the app by the owner,
so leave `card_image` out and say so in the handover. Never use stock or AI images.

### 6. Write `area.json`
Copy the shape of the closest example and replace every value. Fill **every** field in `references/area-config.md`.
Mark anything you could not verify with `[CONFIRM: …]` (it shows in drafts, is hidden on the live site, and FAQ
answers containing one are kept out of the FAQ schema). Nothing may be copied from another area: every district,
building card, scope row and FAQ must be wrong if pasted onto a different area page.

### 7. Check it in the sheet
Make the file to paste: for a Chicago area, `{"area": <area.json>, "permits": <permits.json>}`; for a suburb, just
the area.json. In the sheet, **Service area pages → Sanity → Add a page from Claude**, paste the file (or choose it),
press **Check only**. It runs the same build as the website: unknown keys and bad values are errors; empty or
off-size template blocks, missing card text and every `[CONFIRM]` are listed. Fix every line under "Fix these" and
every warning you can (a `[CONFIRM]` may stay only if it truly needs the client).

To change a page that already exists, first **Get a page for Claude** (type the slug), and edit what it gives you
instead; keep its `_id` and `_updatedAt`. That JSON is the page as Sanity stores it (camelCase field names), and Add
accepts it too.

### 8. Add it and push the draft
Same box, **Add to the sheet**: it writes the page's row (new at the bottom, or the page's existing row). Then select
the row, **Check selected rows**, then **Push selected rows to Sanity as drafts**. It names project `hzu8fe77` and
the draft; press **Yes** only when that is right. If it says the page was edited in Sanity after the row, use **Get a
page for Claude** again and redo the edit on the fresh copy.

### 9. Owner publishes
The owner opens the draft in the Studio (https://service-new-pages.vercel.app/service-areas/studio, the "Live page"
tab shows the result) and presses Publish.

### 10. Hand over
Say what is specific to the area (districts, building types, the permit mix or neighbouring record in one line),
list every `[CONFIRM: …]` item for the client, mention a thin or missing Highlights record, and for an area outside the 15 above, the card photo the owner needs to add.

## Shared facts

Company facts (licences, BBB, citywide permit count, rating, founder line, phone, address) are in
`assets/company.json`, and the sheet's build uses the same copy: never restate them differently in an area file.
Highlights' Google reviews are `assets/highlights-reviews.csv`; pick reviews from it by reviewer name. Emergency
electrical service runs 24/7 (confirmed by the owner, 31/10/2026); say it only about emergency service.
The service catalogue is `scripts/services.py`.
