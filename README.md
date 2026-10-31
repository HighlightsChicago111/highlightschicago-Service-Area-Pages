# Highlights Chicago Service Areas

Electrician service area pages ("Electricians in Evanston, IL", "Electricians in the West Loop, Chicago"), one per
area, at `/service-areas/<slug>`, with a card collection at `/service-areas`. Content lives in Sanity; the design is
the approved Design System v3 template in this repo.

This README is the setup guide for anyone joining the project: get access, pull the code into a new folder, connect
Sanity, check everything works, then write drafts, make design changes and publish. The last section has prompts to
paste into Claude so it does the work with you.

| | |
|---|---|
| Code | [HighlightsChicago111/highlightschicago-Service-Area-Pages](https://github.com/HighlightsChicago111/highlightschicago-Service-Area-Pages) |
| Sanity | project `hzu8fe77`, dataset `production` |
| Hosting | Vercel project `service-new-pages` (team `highlights-chicago`) |
| Live collection | https://service-new-pages.vercel.app/service-areas |
| Studio | https://service-new-pages.vercel.app/service-areas/studio |

## Contents

0. [How it fits together](#0-how-it-fits-together)
1. [Access you need](#1-access-you-need)
2. [Pull the project into a new folder](#2-pull-the-project-into-a-new-folder)
3. [Connect Sanity](#3-connect-sanity)
4. [Check that everything works](#4-check-that-everything-works)
5. [Install the writing skill](#5-install-the-writing-skill)
6. [Write a new area as a Sanity draft](#6-write-a-new-area-as-a-sanity-draft)
7. [Make a design change](#7-make-a-design-change)
8. [Publish](#8-publish)
9. [Rules](#9-rules)
10. [If something goes wrong](#10-if-something-goes-wrong)
11. [Prompts for Claude](#11-prompts-for-claude)
12. [Where things are in the code](#12-where-things-are-in-the-code)

## 0. How it fits together

Each service area page is one Sanity document. The design is code in this repo, and Vercel builds that code into
the site. Content and design travel separately:

| You change | Where | How it goes live |
|---|---|---|
| Words, facts, reviews, photos of an area page | `content/areas/<slug>/area.json`, written to Sanity as a draft | Press Publish in the Studio. Live within about a minute. |
| Layout, styles, components, new fields | Code in this repo, on a branch | Pull request, approved review, merge to `main`. Vercel deploys in a few minutes. |

Useful links: the live collection and Studio above, and [sanity.io/manage](https://www.sanity.io/manage) → project
`hzu8fe77` for members, API tokens and CORS origins.

## 1. Access you need

Ask the project owner for these before starting.

| Access | Role | Needed for |
|---|---|---|
| GitHub repo HighlightsChicago111/highlightschicago-Service-Area-Pages | Write | Pulling the code, pushing branches, opening pull requests |
| Vercel team `highlights-chicago`, project `service-new-pages` | Member | Seeing deploys and opening pull-request preview links (they sit behind a Vercel sign-in) |
| Sanity project `hzu8fe77` | Editor | Signing in to the Studio, publishing, creating your own API tokens |
| claude.ai with the skill `highlights-chicago-service-area-page` | Your account | Writing area pages to the standard template (step 5) |

On your computer: **Git**, **Node.js 24** (includes corepack, which provides pnpm), and optionally the
**GitHub CLI** (`gh`) for pull requests and **Python 3** for the skill's research scripts.

> **Merging needs a second person.** The `main` branch requires one approving review from someone other than the
> person who pushed. Plan for the owner (or another admin) to approve and merge your pull requests.

## 2. Pull the project into a new folder

Pick a folder with no spaces in its path. Commands are for PowerShell on Windows; they work the same in macOS or
Linux terminals with `/` paths.

```powershell
New-Item -ItemType Directory -Force C:\work | Out-Null
cd C:\work
git clone https://github.com/HighlightsChicago111/highlightschicago-Service-Area-Pages.git service-areas
cd service-areas
corepack enable
corepack pnpm install
```

If `corepack enable` asks for administrator rights, skip it and keep typing `corepack pnpm …` as shown here.

## 3. Connect Sanity

The connection lives in `.env.local` in the project folder. It holds secrets, so it is never committed (git already
ignores it).

```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

| Line | Value | Where it comes from |
|---|---|---|
| `NEXT_SANITY_PROJECT_ID` | `hzu8fe77` | Public identifier, safe to share |
| `NEXT_SANITY_DATASET` | `production` | Already filled |
| `NEXT_SANITY_STUDIO_URL` | `/service-areas/studio` | Already filled |
| `NEXT_SITE_URL` | `http://localhost:3008` | Already filled |
| `SANITY_API_READ_TOKEN` | A Viewer token | sanity.io/manage → hzu8fe77 → API → Tokens → Add API token, permission **Viewer** |
| `SANITY_API_WRITE_TOKEN` | An Editor token | Same page, permission **Editor**. Only used on your computer to write drafts. Never add it to Vercel. |
| `LEAD_…`, `RESEND_…` | Leave empty | Filling them makes test form submissions send real leads and emails |

Name your tokens after yourself (for example "service-areas, &lt;your name&gt; laptop") so they can be revoked on their
own. Don't paste tokens into chat channels, tickets or commits.

## 4. Check that everything works

**Sanity is connected** (read-only):

```powershell
corepack pnpm sanity:check
```

It should print `Project hzu8fe77, dataset production`, `Token: present (drafts visible)` and the area pages in the
dataset (for example `area-evanston`). Anything else means `.env.local` is wrong; see step 10.

**The project builds and its checks pass:**

```powershell
corepack pnpm content:build   # checks every area file, lists anything missing
corepack pnpm test:content    # content tests; expect "checks passed"
corepack pnpm typecheck
corepack pnpm lint
```

**The site runs on your computer:**

```powershell
# Reads content from the repo files, no Sanity needed:
$env:AREA_CONTENT_SOURCE = "local"; corepack pnpm dev

# Or reads live Sanity content (in a new terminal):
corepack pnpm dev
```

Open http://localhost:3008/service-areas and http://localhost:3008/service-areas/evanston. Yellow **[CONFIRM]** chips
show only on your computer and in drafts, never on the live site.

- [ ] `sanity:check` shows project hzu8fe77 and a token
- [ ] `test:content`, `typecheck` and `lint` pass
- [ ] The collection page and an area page load on localhost:3008
- [ ] You can sign in to the Studio at https://service-new-pages.vercel.app/service-areas/studio

## 5. Install the writing skill

Area pages are written by the Claude skill `highlights-chicago-service-area-page`. It fills every field of the
standard template, uses the approved card photos, and asks before writing to Sanity. The current version is in this
repo at `skill/highlights-chicago-service-area-page/`.

```powershell
Compress-Archive -Force -Path skill\highlights-chicago-service-area-page -DestinationPath highlights-chicago-service-area-page.zip
```

1. In claude.ai open **Settings → Capabilities → Skills**, upload `highlights-chicago-service-area-page.zip` and switch
   it on. If your organisation already shares the skill, skip this.
2. The Claude desktop app picks it up automatically. For the Claude Code terminal instead, copy the folder to
   `%USERPROFILE%\.claude\skills\`.
3. When the skill changes in the repo, upload the new version again.

## 6. Write a new area as a Sanity draft

1. **Ask Claude** with prompt B below and the area name.
2. **Research and write:** the skill writes `content/areas/<slug>/area.json`.
3. **Check:** `corepack pnpm content:build` with no errors and no standard-template warnings.
4. **Preview:** http://localhost:3008/service-areas/<slug> at desktop and phone width.
5. **Draft:** Claude shows the target, you say yes, it writes a draft.
6. **Commit:** a branch and pull request for the new area files.

The draft write is `corepack pnpm content:push --only <slug> --yes`. Run it without `--yes` first: that dry run lists
exactly what would be written. Drafts never go live by themselves.

Answer the **[CONFIRM]** items the skill lists (licences, registrations, hours) with the owner before publishing. On
the live site they are hidden, not answered.

### The Google Sheet copy of every page

Every published area page is also kept as one row of the team's Google Sheet, in the tab **Service area pages**
(the **Service pages** tab belongs to the service pages project; never use "Replace spreadsheet"). The headings are the exact Sanity field names, so
each cell maps to one field:

| Heading | Means |
|---|---|
| `area`, `heroLede`, `slug` | a single field |
| `bbox.north`, `cardImage.credit` | a part of a field |
| `zips[1]`, `ctaReady[3]` | item 1, item 3 of a list of text |
| `districts[2].name`, `faq[4].answer` | a part of item 2, item 4 of a list |
| `buildings[1].services[2].label` | a list inside a list item |
| `map`, `permits` | generated data, kept as one JSON cell; don't hand-edit |
| `_id`, `_status`, `_updatedAt` | bookkeeping, ignored on import |

The columns come from the Sanity schema, so a field added later gets its columns automatically (export a fresh sheet).

**Straight from the sheet:** the tab has an Apps Script menu, **Service area pages → Sanity**, that checks the
selected rows and pushes them to Sanity as drafts after you confirm. Set-up and daily use: `apps-script/README.md`.
The commands below do the same from a computer with this repo.

**Sanity to sheet** (after writing or publishing pages):

```powershell
corepack pnpm sheet:export                     # published pages -> exports/service-area-pages.csv
corepack pnpm sheet:export -- --include-drafts  # also pages not published yet
```

Then open the **Service area pages** tab and use **File → Import → Upload**, "Replace current sheet" (or let Claude
write the rows when a Google Sheets connector is connected). Each row is the page as it is live; unpublished draft
changes are left out. The export stops if any value would be lost.

**Sheet to Sanity** (after editing cells in the sheet):

```powershell
# In Google Sheets: File -> Download -> Comma-separated values (.csv)
corepack pnpm sheet:import -- --file "$HOME\Downloads\service-area-pages.csv"                          # dry run
corepack pnpm sheet:import -- --file "$HOME\Downloads\service-area-pages.csv" --only evanston --yes    # write drafts
```

The dry run checks every row (misspelled headings, bad numbers, broken JSON, missing required fields, an `_id` that
does not match the slug, template gaps) and lists which fields differ from Sanity. A row is refused when its page was
edited in Sanity after the sheet was exported (its `_updatedAt` is older): export a fresh sheet and redo the edit. A
new page's row needs no `_id` or `_updatedAt`. `--yes` writes only the changed
pages, as **drafts** of the existing pages (never duplicates, never published). Review and publish them in the Studio.

## 7. Make a design change

```powershell
git checkout main
git pull origin main
git checkout -b design/short-description
# make the change, then check it on localhost:3008 at desktop and phone width
corepack pnpm test:content; corepack pnpm typecheck; corepack pnpm lint; corepack pnpm build
git add -A
git commit -m "Describe the change"
git push -u origin design/short-description
gh pr create --base main --fill
```

1. Vercel builds a preview of the pull request and links it on the PR (sign in to Vercel to open it).
2. The owner reviews, approves and merges. Vercel then deploys to the live site in a few minutes.
3. A new content field needs four places: the Sanity schema (`src/sanity/schemaTypes/areaPage.ts`), the type
   (`src/types/area.ts`), the import mapping (`scripts/lib/area-transform.ts`) and the skill's field list
   (`skill/highlights-chicago-service-area-page/references/area-config.md`). The tests fail if one is missing.

## 8. Publish

1. Open the Studio, choose **Service area pages**, then the area.
2. Review the draft. Press **Publish** (bottom right).
3. Open the **Live page** tab and press **Reload** after about a minute. The area also gets its card on
   `/service-areas`.

> **Live address.** Pages are served at www.highlightschicago.com/service-areas by the Cloudflare Worker in
> [`cloudflare/service-areas-worker.js`](cloudflare/service-areas-worker.js), the same way /services is served. The
> direct address service-new-pages.vercel.app/service-areas still works but sends `X-Robots-Tag: noindex`, so only the
> main domain is indexed. The sitemap is www.highlightschicago.com/service-areas/sitemap.xml (published pages only);
> it is submitted in Google Search Console and picks up newly published areas within an hour.

### One-time Cloudflare setup (owner)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Create Worker**, name it `service-areas-proxy`,
   **Deploy**, then **Edit code**, replace everything with `cloudflare/service-areas-worker.js` and **Deploy**.
2. Zone **highlightschicago.com** → **Workers Routes** → **Add route**: `www.highlightschicago.com/service-areas*`,
   worker `service-areas-proxy`. (It doesn't overlap the existing `/services*` route.)
3. sanity.io/manage → `hzu8fe77` → **API** → **CORS origins** → add `https://www.highlightschicago.com` with
   credentials allowed, so the Studio also works at www.highlightschicago.com/service-areas/studio.
4. Check: `https://www.highlightschicago.com/service-areas/west-loop` loads, the response has no `X-Robots-Tag`, and
   `/service-areas/sitemap.xml` lists every published area on www.highlightschicago.com.

## 9. Rules

- Sanity writes go only to project **hzu8fe77**, dataset production. Prove it with `sanity:check` first, dry-run,
  then write.
- Write drafts, not published documents (`content:push --publish` only when the owner asks). Publishing is a person
  pressing Publish in the Studio.
- Never commit `.env.local` or any token. Never add the Editor token to Vercel.
- All code reaches `main` through a pull request with an approving review.
- Facts come from research, the permit data or `content/company.json`. Anything unverified gets `[CONFIRM: …]`.
- Card photos are real, free-to-reuse photos with their author and licence credited.

## 10. If something goes wrong

| You see | Do this |
|---|---|
| `NEXT_SANITY_PROJECT_ID is empty` or the wrong project in `sanity:check` | Fix `.env.local` in the project folder (not `.env.example`), save, run again. |
| `Token: missing` or "Unauthorized" | Paste the Viewer token into `SANITY_API_READ_TOKEN`; check the token was not revoked. |
| Studio says CORS or "origin not allowed" | In sanity.io/manage → hzu8fe77 → API → CORS origins, add the address you are on (for example `http://localhost:3008`) with credentials allowed. |
| A published page shows 404 | Wait a minute and reload: pages refresh every 60 seconds. Check the slug in the Studio. |
| "Unknown field found" in the Studio | The field's code is not on `main` yet. Merge the pull request that adds it; don't press "Remove field". |
| `content:build` errors or template warnings | Read the line: it names the area, the field and what it expects. Fix `area.json` and run again. |
| Merge button is greyed out | The pull request needs an approving review from someone else. |
| PR preview link asks for a Vercel login | Expected: sign in with your Vercel account in the `highlights-chicago` team. |

## 11. Prompts for Claude

Open Claude Code (desktop app Code tab, or the terminal) and paste one of these. Prompt A does steps 2 to 4 with you.
Prompts B and C are for daily work.

### A. Set up and verify the project

```text
Set up the Highlights Chicago Service Areas project on this computer and verify it works. Work step by step and tell me the result of each step.

1. Check the tools: git, Node.js (24 or newer), corepack, and gh if installed. Tell me what is missing and how to install it; don't install system software without asking.
2. Create the folder C:\work if it doesn't exist, then clone https://github.com/HighlightsChicago111/highlightschicago-Service-Area-Pages.git into C:\work\service-areas (if that folder already exists, stop and ask me). Run `corepack pnpm install` there.
3. Create .env.local from .env.example. Set NEXT_SANITY_PROJECT_ID=hzu8fe77 and keep the other defaults. Then ask me for my Sanity Viewer token (SANITY_API_READ_TOKEN) and Editor token (SANITY_API_WRITE_TOKEN) and write them into .env.local. Never print the tokens back, never commit .env.local, and leave the LEAD_ and RESEND_ lines empty.
4. Run `corepack pnpm sanity:check` and confirm it shows project hzu8fe77, dataset production, a token present, and the area pages in Sanity.
5. Run `corepack pnpm content:build`, `corepack pnpm test:content`, `corepack pnpm typecheck` and `corepack pnpm lint`. All must pass.
6. Add a preview configuration in .claude/launch.json for the dev server on port 3008 (and one that sets AREA_CONTENT_SOURCE=local), start it, and check that /service-areas and /service-areas/evanston load without console errors at desktop and phone width.
7. Check that the skill highlights-chicago-service-area-page is available to you. If it isn't, tell me how to install it from skill/highlights-chicago-service-area-page in the repo.

Rules: do not write to Sanity, push, or open pull requests during setup. Finish with a checklist of what passed, what failed and what I need to do.
```

### B. Write a new area as a Sanity draft

```text
In C:\work\service-areas, use the highlights-chicago-service-area-page skill to write the service area page for: [AREA NAME].

- Follow the skill exactly: research, permit data, reviews, card photo (check src/lib/area/card-library.json first), and an area.json that fills every field of the standard template.
- Run `corepack pnpm content:build` until it shows no errors and no standard-template warnings, then `corepack pnpm test:content`.
- Preview /service-areas/[slug] and /service-areas at desktop and phone width and show me screenshots.
- Before writing to Sanity: run `corepack pnpm sanity:check`, show me the target (project hzu8fe77, dataset production), run the dry run `corepack pnpm content:push --only [slug]`, and wait for my clear yes. Write drafts only, never publish.
- Then create a branch, commit the new area files, push and open a pull request.
- After I publish it, run `corepack pnpm sheet:export` and update the "Service area pages" tab of the team's Google Sheet (or tell me to import the CSV there).
- Finish with what is specific to the area and every [CONFIRM] question I need answered before publishing.
```

### C. Make a design change

```text
In C:\work\service-areas, make this design change to the service area pages: [DESCRIBE THE CHANGE, OR PASTE A SCREENSHOT OR REFERENCE LINK].

- Start from the latest main: `git checkout main`, `git pull origin main`, then a new branch.
- Keep to the existing design system (src/app/design-system-v3.css and src/app/area-ds.css) and don't remove any field or content.
- Check it in the browser at 1440 px and 390 px: no horizontal scroll, no console errors. Show me before and after screenshots.
- Run `corepack pnpm test:content`, `corepack pnpm typecheck`, `corepack pnpm lint` and `corepack pnpm build`.
- Ask me before committing. Then commit, push the branch and open a pull request with a clear description. Don't merge: the owner reviews and merges.
- If the change needs a new Sanity field, add it to the schema, the type, scripts/lib/area-transform.ts, the tests and the skill's field list, and tell me which drafts need rewriting after the merge.
```

## 12. Where things are in the code

| Part | Where |
|---|---|
| Area page sections | `src/components/area/` (one file per section; `area-page.tsx` puts them in order) |
| Collection page | `src/app/page.tsx`; template card photos in `src/lib/area/card-library.json` and `public/images/areas/` |
| Header, footer, hero form | `src/components/ds/chrome.tsx`, `src/components/ds/area-quote-form.tsx` |
| Styles | `src/app/area-ds.css` (area page and collection), `src/app/design-system-v3.css` (shared) |
| Sanity fields | `src/sanity/schemaTypes/areaPage.ts` (one document per area), `areaSettings.ts` (company facts) |
| Studio setup | `sanity.config.ts`, `src/sanity/structure.ts` (incl. the "Live page" tab), `src/sanity/presentation.ts` |
| Content | `content/areas/<slug>/area.json` (+ `permits.json` for Chicago areas), `content/company.json`, `content/highlights-reviews.csv` |
| Import pipeline | `scripts/build-area-documents.ts`, `scripts/push-area-documents.ts`, `scripts/lib/area-transform.ts`, tests in `scripts/test-area-documents.ts` |
| Google Sheet sync | `scripts/area-sheet.ts` (`sheet:export`, `sheet:import`), `scripts/lib/sheet.ts`, `scripts/lib/sheet-rules.ts`; the sheet's Apps Script in `apps-script/` (`apps-script:build`); tests in `scripts/test-area-sheet.ts` and `scripts/test-apps-script.ts` |
| Writing skill | `skill/highlights-chicago-service-area-page/` |

Vercel environment variables: `NEXT_SANITY_PROJECT_ID`, `NEXT_SANITY_DATASET`, `NEXT_SANITY_API_VERSION`,
`NEXT_SANITY_STUDIO_URL=/service-areas/studio`, `NEXT_SITE_URL`, `SANITY_API_READ_TOKEN`. Never the write token.
