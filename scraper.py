#!/usr/bin/env python3
"""
Pokopia 圖鑑資料爬蟲
抓取 pokopiaguide.com 的寶可夢資料及圖片
"""

import json
import re
import os
import time
import urllib.request
import urllib.error
from html.parser import HTMLParser

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
IMG_DIR = os.path.join(BASE_DIR, "images", "pokemon")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8",
}

def fetch_url(url, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as resp:
                return resp.read()
        except Exception as e:
            print(f"  [錯誤] {url}: {e} (第{i+1}次)")
            time.sleep(2)
    return None

def extract_next_data(html_bytes):
    html = html_bytes.decode("utf-8", errors="replace")
    # Find __NEXT_DATA__ script tag
    match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    return None

def extract_pokemon_data_from_page(next_data):
    """Extract all pokemon data from the __NEXT_DATA__ JSON"""
    try:
        props = next_data.get("props", {})
        page_props = props.get("pageProps", {})

        # Try different paths
        pokemon_list = (
            page_props.get("pokemon") or
            page_props.get("pokemons") or
            page_props.get("pokemonList") or
            props.get("pokemon") or
            None
        )

        if pokemon_list:
            return pokemon_list

        # Try to find orderedSlugs and pokedex data
        ordered_slugs = page_props.get("orderedSlugs") or page_props.get("slugs")
        pokedex = page_props.get("pokedex") or page_props.get("pokemonData")

        return {
            "orderedSlugs": ordered_slugs,
            "pokedex": pokedex,
            "pageProps": page_props,
        }
    except Exception as e:
        print(f"  [解析錯誤] {e}")
        return None

def main():
    print("=" * 60)
    print("Pokopia 圖鑑爬蟲啟動")
    print("=" * 60)

    # Step 1: Fetch main pokedex page
    print("\n[1] 抓取主頁面...")
    url = "https://pokopiaguide.com/zh/pokedex"
    html = fetch_url(url)
    if not html:
        print("  [失敗] 無法取得主頁面")
        return
    print(f"  [成功] 頁面大小: {len(html):,} bytes")

    # Save raw HTML for inspection
    with open(os.path.join(DATA_DIR, "page_raw.html"), "wb") as f:
        f.write(html)
    print(f"  [儲存] page_raw.html")

    # Step 2: Extract __NEXT_DATA__
    print("\n[2] 解析 __NEXT_DATA__...")
    next_data = extract_next_data(html)
    if not next_data:
        print("  [失敗] 找不到 __NEXT_DATA__")
        # Try to find any JSON in script tags
        html_str = html.decode("utf-8", errors="replace")
        scripts = re.findall(r'<script[^>]*>(.*?)</script>', html_str, re.DOTALL)
        print(f"  找到 {len(scripts)} 個 script 標籤")
        for i, s in enumerate(scripts[:5]):
            print(f"  Script {i}: {s[:200]}")
        return

    print(f"  [成功] 解析到 __NEXT_DATA__")

    # Save full next data
    with open(os.path.join(DATA_DIR, "next_data.json"), "w", encoding="utf-8") as f:
        json.dump(next_data, f, ensure_ascii=False, indent=2)
    print(f"  [儲存] next_data.json ({os.path.getsize(os.path.join(DATA_DIR, 'next_data.json')):,} bytes)")

    # Step 3: Explore structure
    print("\n[3] 分析資料結構...")
    def print_keys(obj, prefix="", depth=0):
        if depth > 3:
            return
        if isinstance(obj, dict):
            for k, v in list(obj.items())[:20]:
                vtype = type(v).__name__
                vlen = f"[{len(v)}]" if isinstance(v, (list, dict)) else ""
                print(f"  {prefix}{k}: {vtype}{vlen}")
                if isinstance(v, dict) and depth < 2:
                    print_keys(v, prefix + "  ", depth + 1)
                elif isinstance(v, list) and len(v) > 0 and depth < 2:
                    print(f"  {prefix}  [0]: {type(v[0]).__name__}")
                    if isinstance(v[0], dict):
                        print_keys(v[0], prefix + "    ", depth + 2)

    print_keys(next_data)

    # Step 4: Extract pokemon data
    print("\n[4] 提取寶可夢資料...")
    data = extract_pokemon_data_from_page(next_data)

    with open(os.path.join(DATA_DIR, "extracted_data.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  [儲存] extracted_data.json")

    print("\n完成！請查看 data/ 目錄中的檔案來確認資料結構。")

if __name__ == "__main__":
    main()
