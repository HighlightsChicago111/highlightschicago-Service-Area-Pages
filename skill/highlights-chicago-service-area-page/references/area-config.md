# Area content file (area.json): every field of the standard template

One JSON file per area (`area.json`). The sheet's **Add a page from Claude** runs the website's build on it and turns it
into the Sanity page; the app renders every area with the same template. Open `examples/west-loop.json` (Chicago) or
`examples/evanston.json` (suburb) alongside this file and copy its shape.

Anywhere a string can't be verified, write `[CONFIRM: what needs checking]` inside it. It shows as a yellow chip in
drafts, is hidden on the live site, and FAQ answers containing one are kept out of the FAQ schema.

## Checklist: every field, its size, and where it shows

| Field | Required | Size | Shows on the page |
|---|---|---|---|
| `area`, `area_the`, `area_in`, `slug` | yes | | everywhere; URL `/service-areas/<slug>` |
| `city` | suburbs only | | H1 and title ("…, IL"), schema, licence FAQs, permit section |
| `meta_description` | yes | 150 to 160 chars | search result |
| `title`, `h1` | no | | leave empty: defaults are correct |
| `eyebrow` | yes | area + 2 to 3 sub-areas | hero |
| `hero_lede` | yes | 2 to 3 sentences | hero |
| `address_placeholder` | yes | under 25 chars | hero form |
| `form_districts`, `form_buildings` | no | | hero form (default: district and building names) |
| `boundary_text` | yes | 1 to 2 sentences | district section lede |
| `bbox`, `bbox_text` | yes | | permit pull; data-source note |
| `facts` | yes | 4 to 6 rows | fact strip next to the map |
| `zips` | yes | | schema, FAQ |
| `map_desc`, `map` | yes | up to 6 districts | schematic map |
| `districts` | yes | 4 to 6 | district cards and form options |
| `buildings` | yes | 4 to 6 | building cards and form options |
| `scope_lede`, `scope_rows` | yes | 8 to 11 rows | scope and price table |
| `hourly_answer` | yes | 3 sentences | "What's your hourly rate?" card |
| `choosing_building_why`, `choosing_building_answer`, `choosing_paperwork_why` | yes | 1 sentence each | "How to choose" table |
| `where_we_fit` | yes | 2 to 3 sentences | kinds-of-company section |
| `mix_notes` | Chicago | one per mix row | permit table |
| `record_bullets` | yes | 3 to 6 | "Our record" card |
| `no_record_text` | suburbs, or no Highlights permits | 1 to 2 sentences | "Our record" lead |
| `honest_context` | yes | 2 paragraphs | "The honest context" card |
| `reviews_heading`, `reviews` | yes | 6 to 8 reviews | review carousel |
| `nearby` | yes | 6 to 8 | nearby neighbourhoods |
| `faq` | yes | 4 to 6 (6 generic are added) | FAQ and FAQ schema |
| `cta_ready` | yes | 5 to 6 | "Have these ready when you call" |
| `card_summary` | yes, unless in the card library | 70 to 110 chars, 1 sentence | collection card |
| `card_region` | yes, unless in the card library | e.g. "Chicago · North Side" | collection card |
| `card_image` | yes, unless in the card library | 800 x 600 webp + credit | collection card and photo credits |
| `service_overrides` | no | | service catalogue lines |
| `research_sources` | yes | every page used | Studio only |

The sheet's **Check only** (Add a page from Claude) checks all of this: unknown keys and invalid values are errors; any empty standard field, wrong
count, missing photo or missing record is a warning. Hand over only when there are no errors and no template warnings.

---

## 1. Naming

| Field | Example | Notes |
|---|---|---|
| `area` | `"Lincoln Park"` | The name people search. |
| `area_the` | `"Lincoln Park"` / `"the West Loop"` | How it reads mid-sentence. |
| `area_in` | `"in Lincoln Park"` / `"in the West Loop"` | Used in headings. |
| `city` | `"Evanston"` | **Suburbs only.** Leave it out for a Chicago neighbourhood. |
| `slug` | `"lincoln-park"` | Lowercase words with hyphens; the folder name must match. |

## 2. Hero and meta

- `meta_description`: lead with family-owned + licensed, name 2 to 3 building types, cite the area permit count if
  Highlights has one, end with the phone number.
- `eyebrow`: the area plus 2 to 3 sub-areas people search by, separated by " · ".
- `hero_lede`: services first, then this area's building types, then who Highlights is.
- `address_placeholder`: a realistic street and block in the area, short enough for the form field.
- `team_photo` (optional): only a real photo the client supplies; otherwise the labelled stock photo is used.

## 3. Facts, boundary and map

- `boundary_text`: the four boundaries, then what kind of place it is.
- `bbox`: `{north, south, west, east}` in decimal degrees; `bbox_text`: the boundaries in words.
- `facts`: `[[label, value], ...]`, 4 to 6 rows. Chicago: Community area (with number), ZIP codes, City wards,
  Transit, Utility (ComEd), Permits (City of Chicago Department of Buildings); wards and community areas from
  `permits.json`. Suburb: City (and that it is its own municipality), ZIP codes, the suburb's own wards, Transit,
  Utility, Permits (the suburb's building department, with contractor registration).
- `zips`: list; the first goes into the schema.
- `map_desc`: one sentence for screen readers.
- `map`: `height` (about 900 × lat-span / lon-span × 1.34), `ew_streets` `[[label, lat]]` and `ns_streets`
  `[[label, lon]]` (5 to 9 each), `districts` `[[name, north, south, west, east]]` (up to 6), `landmarks`
  `[[name, lat, lon]]` (3 to 6), `features` (`expressway_ns {lon,label}`, `expressway_ew {lat,label}`,
  `water_east|water_west {lon,label}`, `water_north|water_south {lat,label}`, `park {north,south,west,east,label}`).
  Permit dots come from `permits.json` automatically.

## 4. Districts (4 to 6)

`{name, intro, work}`: `intro` is one concrete sentence (streets, landmarks, building stock); `work` is what the
electrical work looks like there. Names become the form's "Where in …?" options, so keep them short.

## 5. Buildings (4 to 6)

`{illus, title, where, changes, services}`.
- `illus`: one of `b-loft`, `b-highrise`, `b-midrise`, `b-townhome`, `b-restaurant`, `b-office`, `b-bungalow`,
  `b-twoflat`, `b-cottage`, `b-courtyard` (sets the card icon).
- `title`: also a form option, so keep it short.
- `changes`: what changes the electrical work in this building type here.
- `services`: 2 to 3 `[link label, category id]`; ids `svc-repair`, `svc-panels`, `svc-wiring`, `svc-lighting`,
  `svc-energy`, `svc-safety`, `svc-lowvoltage`, `svc-commercial`.

## 6. Scope and price

- `scope_lede`: one or two sentences naming this area's building types.
- `scope_rows`: 8 to 11 `[factor, why it changes the work, who settles it]`. "Who" sets the chip colour: starts with
  "Us" = green, "You and us" = grey, anything else (the building, the board, the City) = blue. Mix area factors
  with the universal ones; include working hours ("agree the hours before the job is scheduled"), and state no after-hours rate unless the client confirms one.
- `hourly_answer`: the "what's your hourly rate?" answer with one area example.

## 7. "How to choose" and "where we fit"

- `choosing_building_why`: why building-type experience matters here (name the building types).
- `choosing_building_answer`: Highlights' answer from its permits and reviews in or near the area.
- `choosing_paperwork_why`: what paperwork buildings here ask for.
- `where_we_fit`: what Highlights is the right call for here, and what it isn't.

## 8. Permit record

The section always shows two cards: **Our record** (a lead line plus bullets) and **The honest context**.
- Chicago area with `permits.json`: the lead is written from the data; `mix_notes` explain the permit table rows from
  the actual mix; `record_bullets` (3 to 6) summarise Highlights' permits in the box from `permits.json` →
  `highlights.blocks`.
- Suburb (no `permits.json`): `no_record_text` is the lead (e.g. "41 City of Chicago permits since 2012 in Rogers Park
  and West Ridge, the two Chicago neighbourhoods on Evanston's southern border…"), and `record_bullets` (3 to 6) come
  from `permits.py` run on those neighbouring Chicago areas. A Data source note explains this automatically.
- Chicago area where Highlights has no permits: say so in `no_record_text`, and use `record_bullets` for the nearest
  record you can verify.
- Bullets are **block level only** ("the 1400 block of W Howard St"), never an address or a customer name.
- `honest_context`: 2 paragraphs: where Highlights' work is concentrated (top wards in company.json) and how this
  area compares; who dominates this area's permits if it isn't Highlights' kind of work.

## 9. Reviews

- `reviews_heading`: e.g. "Reviews from greystone, bungalow and condo jobs".
- `reviews`: 6 to 8 `{reviewer, label, cut_before?}`. `reviewer` must match the CSV exactly; `label` is a short job
  description in your words; `cut_before` trims only at a sentence boundary. Never change a review's words.

## 10. Nearby, FAQ, call to action

- `nearby`: 6 to 8 `[name, one-line difference in building stock]`.
- `faq`: 4 to 6 area-specific `[id, question, answer]`, ids starting `faq-`. Six generic FAQs are added
  automatically (handyman, licence check, estimates, weekends and emergencies, owner, cost), worded for the suburb when
  `city` is set. Don't repeat them.
- `cta_ready`: 5 to 6 things to have ready when calling, specific to the area's buildings.

## 11. Collection card (`/service-areas`)

**Template areas:** if the slug is in `src/lib/area/card-library.json` (the 15 areas of the approved collection
template), leave all three card fields out. The build fills them with the template's exact photo, alt, credit,
summary and location line, and the collection page uses them even before Sanity has them. Write them only to replace
the template's card on purpose.

**Other areas:**

- `card_summary`: one sentence, 70 to 110 characters, what the place is (e.g. "Lakefront city directly north of
  Chicago, with Northwestern, a downtown of towers and streets of older houses."). No claims needing a CONFIRM.
- `card_region`: "Chicago · North Side", "Chicago · Near West Side", "North Shore city", "Village west of Chicago".
- `card_image`: `{src, alt, credit, credit_url}`. `src` is `/service-areas/images/areas/<slug>.webp` (800 x 600, 4:3,
  saved in `public/images/areas/`); `alt` describes the photo; `credit` is "Author · Licence · Wikimedia Commons";
  `credit_url` is the file page. Alt and credit are required whenever `src` is set.

## 12. Service overrides and research sources

- `service_overrides`: optional `{service name or category id: replacement line}`; names must match
  `scripts/services.py` exactly.
- `research_sources`: `[[title, url, type]]` for every page used.
