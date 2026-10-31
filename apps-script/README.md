# Google Sheet → Sanity: the "Service area pages" tab

The team's spreadsheet has one tab per project: **Service pages**, **Service area pages**, and later **Brand service
pages**. This folder connects only the **Service area pages** tab to this project's Sanity (project `hzu8fe77`,
dataset `production`). It never reads or writes the other tabs.

Each row is one area page. Row 1 holds the exact Sanity field paths (`area`, `heroLede`, `districts[2].name`,
`buildings[1].services[2].label`, …), the same headings `pnpm sheet:export` writes. The menu in the sheet checks the
rows you select and writes them to Sanity as **drafts**. Nothing is ever published from the sheet: review and publish
in the Studio.

## Files

| File | What it is |
|---|---|
| `ServiceAreaPages.gs` | The script for this tab. **Generated**: `pnpm apps-script:build`. Never edit it in the sheet. |
| `Menu.gs` | A simple `onOpen` that adds this tab's menu (and a future brand service pages menu) by name, so tab scripts never overwrite each other. One copy per spreadsheet. The Service pages menu has its own trigger and is not listed. |
| `src/service-area-pages.ts` | Source of the script. Column list and row checks come from `scripts/lib/sheet.ts` and `scripts/lib/sheet-rules.ts`, the same code as `pnpm sheet:import`. |
| `config.json` | Sanity project, dataset, API version, tab name, Studio link. |

## One-time set-up (owner)

1. **Add the script.** In the spreadsheet, **Extensions → Apps Script**.
   The project is already there: the Service pages tab's script (`Code.gs`, project "Highlights page sheet") lives in
   it. Leave that file alone and add two **new** files with the **+** next to "Files":
   - `Menu`: paste `apps-script/Menu.gs` (if a `Menu.gs` already exists, check it lists `'serviceAreaPagesMenu'`).
   - `ServiceAreaPages`: paste all of `apps-script/ServiceAreaPages.gs`.
   - Save. Don't add another `function onOpen` anywhere. The Service pages menu comes from its own trigger and is
     deliberately not listed in `Menu.gs`.
2. Reload the spreadsheet. The menu **Service area pages → Sanity** appears (it may take a few seconds). The first
   time you use it, Google asks you to authorise the script (it needs: this spreadsheet, and external requests to
   Sanity).
3. **Set my Sanity token** (below), then **Load published pages from Sanity**. It creates the `Service area pages`
   tab if needed and fills it with every published page, one row each, row 1 holding the exact field names, all
   cells as plain text. It only reads Sanity. Use it again any time to refresh the tab; it first lists any rows
   whose edits are not in Sanity yet, because those would be replaced.

(Instead of the Load action, `corepack pnpm sheet:export` writes the same rows to a CSV you can import into the tab
with **File → Import → Replace current sheet**, unticking "Convert text to numbers, dates, and formulas".)

## Each person, once

**Service area pages → Sanity → Set my Sanity token.** Paste an **Editor** token for project `hzu8fe77`
(sanity.io/manage → hzu8fe77 → API → Tokens). It is saved for your Google account only, after Sanity accepts it, and
is never shown again.

## Daily use

1. Write or edit a page row in the **Service area pages** tab (a new page: a new row, leave `_id`, `_status` and
   `_updatedAt` empty; fill at least `area`, `areaThe`, `areaIn`, `slug`, `metaDescription`, `eyebrow`, `heroLede`,
   `boundaryText`).
2. Click any cell in each row you want, then **Service area pages → Sanity → Check selected rows**. It lists, per
   row, what is not ready (missing required fields, a bad number or JSON cell, a misspelled heading, an `_id` that
   doesn't match the slug, two rows with the same slug) and which fields differ from Sanity.
3. **Push selected rows to Sanity as drafts.** It runs the same checks, names the Sanity project and the drafts, and
   writes only after you press **Yes**. Then it fills the row's `_id`, `_status` ("draft pushed …") and `_updatedAt`.
4. Open the Studio, review the draft (the **Preview (draft)** tab shows the page), press **Publish**.

A row is refused when its page was edited in Sanity after the row's `_updatedAt` (someone published or changed it
since): export a fresh sheet, or copy the newer content into the row, and push again. This stops an old row from
overwriting newer work.

## After a schema change

A field added to the `areaPage` schema gets its columns automatically: run `corepack pnpm apps-script:build`, paste
the new `ServiceAreaPages.gs` into the sheet, and add the new headings to row 1 (or re-export the sheet).
`pnpm test:content` fails while the committed `ServiceAreaPages.gs` is out of date.
