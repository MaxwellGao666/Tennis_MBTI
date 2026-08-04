"""重抓 32 张维基百科球星图的高清源(1000px)到 images/stars/_raw/，供面部检测与裁剪。
带 429 重试退避 + 断点续传(跳过已存在)。"""
import urllib.request, urllib.parse, os, json, time, sys

BASE = "D:/Porject/mbti/images/stars"
RAW = os.path.join(BASE, "_raw")
os.makedirs(RAW, exist_ok=True)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
REFERER = "https://en.wikipedia.org/"

M = {
 "INTJ-male":"Novak Djokovic","INTJ-female":"Maria Sharapova",
 "INTP-male":"Daniil Medvedev","INTP-female":"Iga Swiatek",
 "ENTJ-male":"Roger Federer","ENTJ-female":"Serena Williams",
 "ENTP-male":"Carlos Alcaraz","ENTP-female":"Coco Gauff",
 "INFJ-male":"Bjorn Borg","INFJ-female":"Billie Jean King",
 "INFP-male":"Gael Monfils","INFP-female":"Ana Ivanovic",
 "ENFJ-male":"Andre Agassi","ENFJ-female":"Venus Williams",
 "ENFP-male":"Jo-Wilfried Tsonga","ENFP-female":"Ons Jabeur",
 "ISTJ-male":"Andy Murray","ISTJ-female":"Simona Halep",
 "ISFJ-male":"Rafael Nadal","ISFJ-female":"Naomi Osaka",
 "ESTJ-male":"Pete Sampras","ESTJ-female":"Steffi Graf",
 "ESFJ-male":"Gustavo Kuerten","ESFJ-female":"Caroline Wozniacki",
 "ISTP-male":"Stan Wawrinka","ISTP-female":"Martina Hingis",
 "ISFP-male":"Boris Becker","ISFP-female":"Ashleigh Barty",
 "ESTP-male":"Jimmy Connors","ESTP-female":"Monica Seles",
 "ESFP-male":"Andy Roddick","ESFP-female":"Anna Kournikova",
}

def api_get_one(url, title):
    for i in range(6):
        try:
            req = urllib.request.Request(url, headers={"User-Agent":UA})
            d = json.load(urllib.request.urlopen(req, timeout=20))
            for pid,pg in d.get("query",{}).get("pages",{}).items():
                th = pg.get("thumbnail",{}).get("source")
                if th: return th
            return None
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 5 * (i+1)
                print(f"  api 429, wait {wait}s"); time.sleep(wait); continue
            else:
                print("  api err", title, e); return None
        except Exception as e:
            print("  api err", title, e); time.sleep(2)
    return None

def api_get(title):
    q = urllib.parse.urlencode({"action":"query","titles":title,
        "prop":"pageimages","piprop":"thumbnail","pithumbsize":"1000",
        "format":"json"})
    url = "https://en.wikipedia.org/w/api.php?"+q
    r = api_get_one(url, title)
    if r: return r
    q = urllib.parse.urlencode({"action":"query","generator":"search",
        "gsrsearch":title,"gsrlimit":"1","prop":"pageimages",
        "piprop":"thumbnail","pithumbsize":"1000","format":"json"})
    url = "https://en.wikipedia.org/w/api.php?"+q
    return api_get_one(url, title)

def download(url, dest, tries=5):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent":UA,"Referer":REFERER})
            data = urllib.request.urlopen(req, timeout=40).read()
            with open(dest,"wb") as f: f.write(data)
            return len(data)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 3 * (i+1)
                print(f"    429, wait {wait}s")
                time.sleep(wait); continue
            else:
                raise
        except Exception as e:
            print("  dl err", e); time.sleep(2)
    return 0

ok=0; fail=[]
for key,title in M.items():
    dest = os.path.join(RAW, f"{key}.jpg")
    if os.path.exists(dest) and os.path.getsize(dest) > 3000:
        print("skip", key); ok+=1; continue
    print("=>", key, title)
    img_url = api_get(title)
    if not img_url:
        print("   NO IMAGE"); fail.append(key); continue
    n = download(img_url, dest)
    if n < 3000:
        print("   BAD/SMALL", n); fail.append(key); continue
    ok+=1
    print(f"   OK {n}B")
    time.sleep(1.2)

print(f"\n=== DONE ok={ok}/32 fail={len(fail)} ===")
if fail: print("FAILED:", fail)
