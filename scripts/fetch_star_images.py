import urllib.request, urllib.parse, os, json, time, re
from io import BytesIO
from PIL import Image

BASE = "D:/Porject/mbti/images/stars"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
REFERER = "https://en.wikipedia.org/"
OUT_LONGEST = 500  # 输出最长边像素，控制小程序包体

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

PAT = re.compile(r"^(INTJ|INTP|ENTJ|ENTP|INFJ|INFP|ENFJ|ENFP|ISTJ|ISFJ|ESTJ|ESFJ|ISTP|ISFP|ESTP|ESFP)-(male|female)\.jpg$", re.I)

def clean_placeholders():
    # 删除所有 type-gender 图（大小写都删），只保留 README/对比样图
    removed = 0
    for name in os.listdir(BASE):
        if PAT.match(name):
            try:
                os.remove(os.path.join(BASE, name))
                removed += 1
            except Exception as e:
                print("  clean warn", name, e)
    print("cleaned %d old type-gender images" % removed)

def fetch_bytes(url, retries=5):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent":UA, "Referer":REFERER})
            return urllib.request.urlopen(req, timeout=30).read()
        except Exception as e:
            print("    retry %d after %ds: %s" % (i + 1, 2 * (i + 1), e))
            time.sleep(2 * (i + 1))
    return None

def api_get(title):
    q = urllib.parse.urlencode({"action":"query","titles":title,
        "prop":"pageimages","piprop":"thumbnail","pithumbsize":str(OUT_LONGEST),
        "format":"json"})
    d = json.loads(fetch_bytes("https://en.wikipedia.org/w/api.php?" + q) or "{}")
    for pg in d.get("query", {}).get("pages", {}).values():
        th = pg.get("thumbnail", {}).get("source")
        if th:
            return th
    q = urllib.parse.urlencode({"action":"query","generator":"search",
        "gsrsearch":title,"gsrlimit":"1","prop":"pageimages",
        "piprop":"thumbnail","pithumbsize":str(OUT_LONGEST),"format":"json"})
    d = json.loads(fetch_bytes("https://en.wikipedia.org/w/api.php?" + q) or "{}")
    for pg in d.get("query", {}).get("pages", {}).values():
        th = pg.get("thumbnail", {}).get("source")
        if th:
            return th
    return None

def normalize_to_jpeg(raw):
    try:
        im = Image.open(BytesIO(raw)).convert("RGB")
        im.thumbnail((OUT_LONGEST, OUT_LONGEST), Image.LANCZOS)
        buf = BytesIO()
        im.save(buf, "JPEG", quality=85)
        return buf.getvalue()
    except Exception as e:
        print("    normalize fail:", e)
        return None

clean_placeholders()
ok = 0
fail = []
for key, title in M.items():
    code, gender = key.split("-")
    target = os.path.join(BASE, code + "-" + gender + ".jpg")   # 小写，匹配 app
    print("=>", key, title)
    img_url = api_get(title)
    if not img_url:
        print("   NO IMAGE"); fail.append(key); continue
    raw = fetch_bytes(img_url)
    if not raw:
        print("   DL FAIL"); fail.append(key); continue
    jpg = normalize_to_jpeg(raw)
    if not jpg:
        print("   NOT A VALID IMAGE"); fail.append(key); continue
    with open(target, "wb") as f:
        f.write(jpg)
    ok += 1
    print("   OK", len(jpg), "B")
    time.sleep(1.0)

print("\n=== DONE ok=%d fail=%d (of 32) ===" % (ok, len(fail)))
if fail:
    print("FAILED:", fail)
