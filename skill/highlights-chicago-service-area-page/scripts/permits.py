#!/usr/bin/env python3
"""Pull City of Chicago building-permit data for one area's bounding box.

Usage:
  python permits.py [--community-area 7] --north 41.8915 --south 41.8755 --west -87.6667 --east -87.6375 \
      --out permits.json [--months 24] [--contractor HIGHLIGHTS]

Writes a JSON file with:
  window            issue-date window used for the area mix
  electrical_total  permits in the window that involve electrical work
  contractors       number of distinct electrical contractors named on them
  mix               counts by keyword category (a permit can count in more than one)
  wards, community_areas   most common values in the box (for the fact strip)
  highlights        every permit in the box naming the contractor (all years):
                    count, by_type, by_year, blocks (block-level, never full addresses), points
Source: data.cityofchicago.org dataset ydr8-5enu (Building Permits). No API key needed.
Counts are keyword-classified from the City's free-text work descriptions: treat them as approximate.
"""
import argparse, collections, datetime as dt, json, re, sys, urllib.parse, urllib.request

API = "https://data.cityofchicago.org/resource/ydr8-5enu.json"

CATS = [
    ("Low voltage, data and communications", r"LOW VOLTAGE|COMMUNICATION|\bDATA\b|CABL"),
    ("Interior build-outs and alterations", r"BUILD.?OUT|INTERIOR (ALTERATION|RENOVATION)|TENANT"),
    ("Lighting", r"LIGHT|FIXTURE"),
    ("Outlets and receptacles", r"RECEPTACLE|OUTLET"),
    ("Work inside a specific unit or condo", r"\bUNITS?\b|\bAPT\b|\bCONDO"),
    ("Fire alarm", r"FIRE ALARM|SMOKE"),
    ("Electrical service", r"\bSERVICE\b|\d+\s?AMP"),
    ("Panels", r"\bPANEL"),
    ("Restaurants", r"RESTAURANT"),
    ("EV charging", r"CHARGER|EVSE|ELECTRIC VEHICLE"),
    ("Solar", r"SOLAR|PHOTOVOLT"),
    ("Generators", r"GENERATOR"),
    ("Signs", r"\bSIGN"),
]
ELEC = r"ELECTRIC|WIRING|LIGHT|AMP|PANEL|RECEPTACLE|OUTLET|CIRCUIT|CHARGER|LOW VOLTAGE"


def q(soql, tries=5):
    """Query the City's data portal, retrying temporary errors (503s and timeouts are common)."""
    import time
    url = API + "?" + urllib.parse.urlencode({"$query": soql})
    req = urllib.request.Request(url, headers={"User-Agent": "highlights-area-page/1.0"})
    for n in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.load(r)
        except Exception as e:  # noqa: BLE001
            code = getattr(e, "code", None)
            if n == tries - 1 or (code and code < 500 and code != 429):
                raise
            wait = 5 * (n + 1)
            print(f"City data portal error ({code or e}); retrying in {wait}s...", file=sys.stderr)
            time.sleep(wait)


def block(num, d, name):
    try:
        n = int(re.sub(r"\D", "", num or "0"))
    except ValueError:
        n = 0
    return f"{(n // 100) * 100} block of {d or ''} {name or ''}".replace("  ", " ").strip()


def main():
    ap = argparse.ArgumentParser()
    for k in ("north", "south", "west", "east"):
        ap.add_argument("--" + k, type=float, required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--months", type=int, default=24)
    ap.add_argument("--contractor", default="HIGHLIGHTS")
    ap.add_argument("--community-area", type=int, action="append", default=[],
                    help="Keep only permits in these official community area numbers (repeatable). Use when the area is, or sits inside, a community area.")
    a = ap.parse_args()

    box = f"latitude between {a.south} and {a.north} and longitude between {a.west} and {a.east}"
    if a.community_area:
        box += " AND community_area in (" + ",".join(f'\'{n}\'' for n in a.community_area) + ")"
    since = (dt.date.today() - dt.timedelta(days=round(a.months * 30.44))).isoformat()
    cols = "issue_date, permit_type, work_description, ward, community_area, " + ", ".join(
        f"contact_{i}_type, contact_{i}_name" for i in range(1, 6))
    rows = q(f"SELECT {cols} WHERE {box} AND issue_date >= '{since}' LIMIT 50000")

    def is_elec(r):
        return any("ELECTRIC" in (r.get(f"contact_{i}_type") or "") for i in range(1, 6)) or \
            re.search(ELEC, r.get("work_description", ""), re.I)
    el = [r for r in rows if is_elec(r)]
    mix = []
    for label, pat in CATS:
        n = sum(1 for r in el if re.search(pat, r.get("work_description", ""), re.I))
        if n:
            mix.append([label, n])
    mix.sort(key=lambda x: -x[1])
    contractors = {r.get(f"contact_{i}_name") for r in el for i in range(1, 6)
                   if "ELECTRIC" in (r.get(f"contact_{i}_type") or "") and r.get(f"contact_{i}_name")}
    wards = collections.Counter(r.get("ward") for r in rows if r.get("ward")).most_common(6)
    cas = collections.Counter(r.get("community_area") for r in rows if r.get("community_area")).most_common(6)

    name = a.contractor.upper().replace("'", "''")
    who = " OR ".join(f"upper(contact_{i}_name) like '%{name}%'" for i in range(1, 9))
    hl = q("SELECT issue_date, street_number, street_direction, street_name, permit_type, work_description, "
           f"latitude, longitude WHERE {box} AND ({who}) ORDER BY issue_date DESC LIMIT 1000")
    blocks = collections.defaultdict(list)
    for r in hl:
        blocks[block(r.get("street_number"), r.get("street_direction"), r.get("street_name"))].append({
            "year": r["issue_date"][:4], "type": r["permit_type"].replace("PERMIT - ", "").title().replace("Permit – ", ""),
            "work": (r.get("work_description") or "")[:220]})
    pts = collections.Counter((round(float(r["latitude"]), 3), round(float(r["longitude"]), 3))
                              for r in hl if r.get("latitude"))
    out = {
        "source": "City of Chicago building permits (data.cityofchicago.org, ydr8-5enu)",
        "bbox": {"north": a.north, "south": a.south, "west": a.west, "east": a.east},
        "community_area_filter": a.community_area,
        "window": {"from": since, "to": dt.date.today().isoformat(), "months": a.months},
        "permits_in_window": len(rows),
        "electrical_total": len(el),
        "contractors": len(contractors),
        "mix": mix,
        "wards": wards,
        "community_areas": cas,
        "highlights": {
            "count": len(hl),
            "addresses": len({(r.get('street_number'), r.get('street_name')) for r in hl}),
            "by_type": collections.Counter(r["permit_type"].replace("PERMIT - ", "").title().replace("Permit – ", "") for r in hl).most_common(),
            "by_year": sorted(collections.Counter(r["issue_date"][:4] for r in hl).items()),
            "first_year": min((r["issue_date"][:4] for r in hl), default=None),
            "blocks": blocks,
            "points": [[lat, lon, c] for (lat, lon), c in pts.items()],
        },
    }
    json.dump(out, open(a.out, "w"), indent=1)
    print(f"{len(el)} electrical permits in {a.months} months, {len(contractors)} electrical contractors; "
          f"{len(hl)} {a.contractor} permits in the box on {len(blocks)} blocks. Wards {wards[:3]}, community areas {cas[:3]}.")
    print("Mix:", mix)


if __name__ == "__main__":
    sys.exit(main())
