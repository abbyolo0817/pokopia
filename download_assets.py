#!/usr/bin/env python3
"""下載所有圖示資源 (type/specialty/time/weather/environment/habitat icons)"""

import json, os, time, urllib.request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_URL = "https://pokopiaguide.com"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Referer": "https://pokopiaguide.com/",
}

def download(url, path, retries=3):
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return True
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()
            with open(path, 'wb') as f:
                f.write(data)
            return True
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1)
            else:
                print(f"  ✗ FAILED: {url} ({e})")
    return False

def dl(label, url, path):
    ok = download(url, path)
    size = os.path.getsize(path) if ok and os.path.exists(path) else 0
    status = f"✓ {size}B" if ok else "✗"
    print(f"  [{status}] {label}")
    return ok

TYPES = ['normal','fire','water','grass','electric','ice','fighting',
         'poison','ground','flying','psychic','bug','rock','ghost',
         'dragon','dark','steel','fairy']

SPECIALTIES = ['grow','burn','water','build','chop','gather','gather-honey',
               'mine','bulldoze','crush','explode','fly','search','litter',
               'paint','generate','recycle','storage','collector','hype',
               'appraise','rarify','trade','teleport','transform','yawn',
               'dream-island']
# Also try with spaces
SPECIALTIES_ALT = {
    'gather-honey': 'gather honey',
    'dream-island': 'dream island',
}

TIMES = ['dawn','day','dusk','night']
WEATHERS = ['sunny','cloudy','rainy']
ENVIRONMENTS = ['bright','dark','warm','cool','moist','dry']

def main():
    print("=" * 50)
    print("下載圖示資源")
    print("=" * 50)

    # Types
    print("\n[屬性圖示]")
    for t in TYPES:
        url = f"{BASE_URL}/images/types/{t}.png"
        path = os.path.join(BASE_DIR, "images", "types", f"{t}.png")
        dl(t, url, path)
        time.sleep(0.1)

    # Specialties
    print("\n[特長圖示]")
    for sp in SPECIALTIES:
        # Try with hyphen first, then space
        url = f"{BASE_URL}/images/specialties/{sp}.png"
        path = os.path.join(BASE_DIR, "images", "specialties", f"{sp}.png")
        ok = dl(sp, url, path)
        if not ok and sp in SPECIALTIES_ALT:
            alt = SPECIALTIES_ALT[sp]
            url2 = f"{BASE_URL}/images/specialties/{alt}.png"
            dl(f"{sp} (alt)", url2, path)
        time.sleep(0.1)

    # Time
    print("\n[時間圖示]")
    for t in TIMES:
        url = f"{BASE_URL}/images/time/{t}.svg"
        path = os.path.join(BASE_DIR, "images", "time", f"{t}.svg")
        dl(t, url, path)
        time.sleep(0.1)

    # Weather
    print("\n[天氣圖示]")
    for w in WEATHERS:
        url = f"{BASE_URL}/images/weather/{w}.svg"
        path = os.path.join(BASE_DIR, "images", "weather", f"{w}.svg")
        dl(w, url, path)
        time.sleep(0.1)

    # Environment
    print("\n[環境圖示]")
    for e in ENVIRONMENTS:
        url = f"{BASE_URL}/images/environment/{e}.svg"
        path = os.path.join(BASE_DIR, "images", "environment", f"{e}.svg")
        dl(e, url, path)
        time.sleep(0.1)

    # Habitats
    print("\n[棲息地圖片]")
    with open(os.path.join(BASE_DIR, "data", "pokemon.json"), encoding='utf-8') as f:
        pokemon = json.load(f)

    habitat_ids = set()
    for p in pokemon:
        for h in (p.get('pokopia') or {}).get('habitats') or []:
            habitat_ids.add(h['id'])

    print(f"  共 {len(habitat_ids)} 個棲息地圖片")
    success = 0
    for hid in sorted(habitat_ids):
        url = f"https://assets.pokopiaguide.com/habitats/habitat_{hid}.png"
        path = os.path.join(BASE_DIR, "images", "habitats", f"habitat_{hid}.png")
        ok = download(url, path)
        if ok:
            success += 1
        else:
            # Try alternative URL
            url2 = f"{BASE_URL}/images/habitats/habitat_{hid}.png"
            ok = download(url2, path)
            if ok: success += 1
        time.sleep(0.08)

    print(f"  棲息地: {success}/{len(habitat_ids)}")

    print("\n完成！")

if __name__ == "__main__":
    main()
