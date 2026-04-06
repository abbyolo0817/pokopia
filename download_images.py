#!/usr/bin/env python3
"""下載所有 Pokopia 寶可夢圖片"""

import json, os, time, urllib.request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(BASE_DIR, "images", "pokemon")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Referer": "https://pokopiaguide.com/",
}

def download(url, path, retries=3):
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return True  # 已存在跳過
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
    return False

def main():
    with open(os.path.join(BASE_DIR, "data", "pokemon.json"), encoding='utf-8') as f:
        pokemon = json.load(f)

    total = len(pokemon)
    success = 0
    failed = []

    for i, p in enumerate(pokemon, 1):
        slug = p['slug']
        url = p.get('image') or f"https://assets.pokopiaguide.com/pokemon/{slug}.png"
        path = os.path.join(IMG_DIR, f"{slug}.png")

        ok = download(url, path)
        if ok:
            success += 1
            size = os.path.getsize(path)
            print(f"[{i:3}/{total}] ✓ #{p['id']:03} {p['name']} ({size//1024}KB)")
        else:
            failed.append(p)
            print(f"[{i:3}/{total}] ✗ #{p['id']:03} {p['name']} FAILED")

        time.sleep(0.15)  # 避免太頻繁請求

    print(f"\n完成！成功: {success}/{total}")
    if failed:
        print(f"失敗 ({len(failed)}):")
        for p in failed:
            print(f"  #{p['id']} {p['name']}")

if __name__ == "__main__":
    main()
