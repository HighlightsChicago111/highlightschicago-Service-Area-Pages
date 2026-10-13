# Content guide: what the page is for and how to write it

## Who the page is for

Someone searches "best electrician {area}" or "electrician {area}". They want to see quickly that Highlights does
what they need, in buildings like theirs, in their area — and then, if they're still comparing, a fair way to judge
any electrician. So the page leads with services and proof, and the educational folds sit lower down.

Think of the page as a knowledgeable local friend answering, in order:

| # | Fold (section id) | Intent | The visitor's question |
|---|---|---|---|
| 1 | Hero (`hero`) | You're in the right place | Is this a licensed electrician who does what I need, here? |
| 2 | Services (`services`) | Here's everything we do | Do they do the specific thing I need? |
| 3 | Who you're calling (`who`) | A real family business, founder-led | Who owns it, who will I talk to? |
| 4 | Value (`value`) | What clients felt they got | Was it worth it to people like me? |
| 5 | Process (`process`) | What happens next | If I call, what happens? |
| 6 | Scope and price (`scope`) | What changes the price | Why do quotes vary? |
| 7 | How to choose (`choosing`) | Checks anyone can verify | How do I tell who's best? |
| 8 | Kinds of company (`companies`) | Family firm vs franchise vs marketplace | What's the difference? |
| 9 | District by district (`area`) | We know your neighbourhood | Do they know this area? |
| 10 | Building types (`buildings`) | We know your building | Have they worked in one like mine? |
| 11 | Nearby (`nearby`) | If you're just outside | Does this still apply a block over? |
| 12 | Permit record (`permit-record`) | Public proof | Can I check their work myself? |
| 13 | FAQ, call to action | Remaining doubts; act | How do I start? |

The order is fixed by the client. Don't reorder folds.

## Positioning (Highlights Chicago)

Family-owned, founder-led (Boz usually does the walkthrough and writes the quote), salaried named crews, no lead
selling, no flat-rate price book, no commission, free estimate, written scope, permits pulled and closed in-house.
Value is shown through what reviewers say, never through published prices.

## Honesty rules (these protect the client)

- **Never invent facts.** Licences, counts, ratings and founder details come from `assets/company.json`. Area
  facts come from research or `permits.json`. Anything unverified goes in `[CONFIRM: …]`.
- **Permit data is approximate.** Say "about"; the page adds the "keyword-classified" caveat itself.
- **Block level only.** Never publish a customer's full address or link a review to an address.
- **Say where Highlights isn't the right fit** (e.g. tower base-building work). It makes everything else credible.
- **If Highlights has few or no permits in the area, say so** in `honest_context` / `no_record_text`. Don't pad.
- **Suburbs are not Chicago.** Set `city`. Their permits are not in the City of Chicago data, so never present
  Chicago permits as the suburb's own: describe them as the neighbouring Chicago record. Research the suburb's
  contractor registration and put Highlights' registration status in `[CONFIRM: …]` unless the client has confirmed it.
- **Collection-card photos** must be real, free-to-reuse photos (Wikimedia Commons) with author and licence credited.
- **Reviews are quoted, never edited.** Trim only at a sentence end with `cut_before`. Skip reviews naming competitors.
- **Photos:** the bundled crew photo is a labelled stock photo. Never present stock or AI images as the real team.
- **Don't name competitors** on the page.

## Voice

Plain, specific, local. Short sentences. Concrete nouns over adjectives: "greystone two-flats with 60-amp
services" not "charming vintage homes". British/Commonwealth spelling is used on the existing pages
("neighbourhood", "storey", "licence" as a noun) — keep it consistent. No exclamation marks, no "trusted experts",
no "we pride ourselves". Every sentence should help someone decide.

## Research checklist for a new area

Do these before writing the content file. Note every source URL for `research_sources`.

1. **Boundaries and identity** — official community area (number and name), the commonly used neighbourhood
   boundaries, sub-areas/districts people search by, ZIP codes, main streets, transit stations, landmarks, parks.
2. **Building stock** — what was built when: pre-1920 frame cottages, greystones and two-flats, 1920s bungalows,
   courtyard buildings, post-war, 1990s–2000s condo conversions, new towers. What each means electrically
   (60/100-amp services, knob-and-tube, fuse boxes, concrete slabs, condo boards, landmark districts).
3. **Permit data** — run `permits.py` on the bbox. Read the mix (what kind of work dominates), wards and community
   areas, and Highlights' own permits by block.
4. **Reviews** — run `reviews.py` with the area name and its district/building keywords. Prefer reviews that
   mention the area; otherwise choose by building type.
5. **Neighbours** — the 6–8 bordering neighbourhoods and how their stock differs.

## Quality bar before handing over

- `content:build` shows no errors and no "standard template" warnings: every field in `area-config.md` is filled, at
  the size the design expects.
- Every district, building type, scope row and FAQ is specific to this area (would be wrong if pasted onto another
  area page).
- The permit table notes match the actual mix; `record_bullets` are block level and accurate to the permit data.
- The collection card has a summary, a location line and a credited photo, and it opens the page.
- All `[CONFIRM: …]` items are listed for the user in your reply.
- The page and `/service-areas` render at 1440 and 390 px with no horizontal scroll and no console errors.
