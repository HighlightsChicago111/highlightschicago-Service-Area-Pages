#!/usr/bin/env python3
"""Review statistics and candidate reviews for an area page.

Usage:
  python reviews.py --out reviews.json [--csv ../assets/highlights-reviews.csv]
                    [--area "Lincoln Park"] [--keywords "greystone,two-flat,vintage,coach house"]

Writes:
  n, stats       theme counts across all reviews (keyword-matched, approximate)
  area_mentions  reviews that name the area or any --keywords (best local proof)
  by_theme       up to 6 candidates per building-type theme (high-rise, loft, condo/HOA, house,
                 commercial, new construction, EV, panel, lighting, emergency)
Each candidate has reviewer, year, rating, link, length and the full text, so you can choose
4-8 for the page and decide where to trim. Never edit a review's words; only cut at a sentence end.
"""
import argparse, csv, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
THEMES = {
    "Name the owner (Boz) or say they dealt with the owner": r"\bboz\b|owner|president",
    "Call the price fair, reasonable or competitive": r"fair|reasonable|competitive|affordable|half the price|less than",
    "Mention punctuality or showing up on time": r"on time|punctual|prompt|early",
    "Mention cleanliness or protecting the space": r"clean|drop cloth|cover|protect|spotless|tidy",
    "Say the crew explained the work": r"explain",
    "Mention permits or inspection": r"permit|inspect",
    "Mention fast scheduling, same-day or weekend service": r"same day|same-day|next day|weekend|saturday|sunday|within 24",
}
BUILDING = {
    "high-rise": r"high.?rise|highrise|tower|building manag|elevator|doorman|concierge",
    "loft": r"\bloft",
    "condo / HOA": r"condo|\bhoa\b|association|board",
    "house": r"\bhouse\b|\bhome\b|bungalow|basement|garage|two.?flat|greystone|coach house",
    "commercial": r"office|restaurant|store|shop|business|commercial|tenant|salon|studio",
    "new construction": r"new construction|new build|gut|rehab|inspector",
    "EV": r"\bev\b|tesla|charger",
    "panel / service": r"panel|service upgrade|200 ?amp|100 ?amp|breaker",
    "lighting": r"recessed|chandelier|pendant|fixture|lighting|can lights",
    "emergency": r"emergency|power out|no power|sparks|burning|smoke",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default=os.path.join(HERE, "..", "assets", "highlights-reviews.csv"))
    ap.add_argument("--out", required=True)
    ap.add_argument("--area", default="")
    ap.add_argument("--keywords", default="")
    a = ap.parse_args()
    rows = list(csv.DictReader(open(a.csv, encoding="utf-8")))
    n = len(rows)
    stats = {k: sum(1 for r in rows if re.search(p, r["review"], re.I)) for k, p in THEMES.items()}

    def cand(r):
        return {"reviewer": r["reviewer"], "year": r["iso_date"][:4], "rating": r["rating"], "link": r["review_link"],
                "words": len(r["review"].split()), "text": r["review"]}
    good = [r for r in rows if r["rating"].startswith("5") and len(r["review"].split()) >= 35]
    terms = [t.strip() for t in ([a.area] + a.keywords.split(",")) if t.strip()]
    area_hits = [cand(r) for r in good if terms and any(re.search(re.escape(t), r["review"], re.I) for t in terms)]
    by_theme = {}
    for k, p in BUILDING.items():
        hits = sorted((r for r in good if re.search(p, r["review"], re.I)), key=lambda r: r["iso_date"], reverse=True)
        by_theme[k] = [cand(r) for r in hits[:6]]
    out = {"n": n, "five_star": sum(1 for r in rows if r["rating"].startswith("5")), "stats": stats,
           "area_terms": terms, "area_mentions": area_hits, "by_theme": by_theme}
    json.dump(out, open(a.out, "w"), indent=1, ensure_ascii=False)
    print(f"{n} reviews, {out['five_star']} five-star. Stats: {stats}")
    print(f"Area mentions ({', '.join(terms) or 'none given'}): {len(area_hits)}")
    for k, v in by_theme.items():
        print(f"  {k}: " + "; ".join(f"{c['reviewer']} ({c['year']}, {c['words']}w)" for c in v))


if __name__ == "__main__":
    main()
