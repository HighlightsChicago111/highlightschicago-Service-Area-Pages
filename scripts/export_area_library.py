"""Export the area-page skill's service catalogue, icons and illustrations to JSON for the app.

The highlights-chicago-service-area-page skill is the source of truth for these. Re-run after the skill
changes them:  python -I scripts/export_area_library.py --skill "<skill folder>"
"""
import argparse
import json
import os
import sys


# The skill's titles were written for the West Loop page; these must read true on every area page.
TITLE_FIXES = {"walk": "The founder with a clipboard looks over a Chicago loft building"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--skill", required=True, help="Folder of the highlights-chicago-service-area-page skill")
    a = ap.parse_args()
    sys.path.insert(0, os.path.join(a.skill, "scripts"))
    import icons  # noqa: E402
    import illus  # noqa: E402
    import services  # noqa: E402

    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "lib", "area")
    catalog = {"servicesUrl": services.U, "categories": [
        {"id": cid, "title": title, "intro": intro, "items": [{"name": n, "slug": s, "line": l} for n, s, l in items]}
        for cid, title, intro, items in services.CATS]}
    missing = [i["name"] for c in catalog["categories"] for i in c["items"] if i["name"] not in icons.SVC_ICON]
    if missing:
        raise SystemExit(f"Services without an icon: {missing}")
    files = {
        "catalog.json": catalog,
        "icons.json": {"glyphs": icons.G, "serviceIcon": icons.SVC_ICON, "categoryIcon": icons.CAT_ICON, "short": icons.SHORT},
        "illustrations.json": {k: {"title": TITLE_FIXES.get(k, t), "body": b.strip()} for k, (t, b) in illus.ILL.items()},
    }
    for name, data in files.items():
        with open(os.path.join(out, name), "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
    total = sum(len(c["items"]) for c in catalog["categories"])
    print(f"Exported {total} services in {len(catalog['categories'])} categories, {len(icons.G)} icons, {len(illus.ILL)} illustrations")


if __name__ == "__main__":
    main()
