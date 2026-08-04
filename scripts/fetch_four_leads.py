import urllib.request, urllib.parse, os, time, json
import numpy as np
import cv2
from PIL import Image

BASE = "D:/Porject/mbti/images/stars"
RAW = os.path.join(BASE, "_raw")
os.makedirs(RAW, exist_ok=True)
API = "https://en.wikipedia.org/w/api.php?"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
REFERER = "https://en.wikipedia.org/"

FOUR = {
    "ENFJ-female": "Venus Williams",
    "ISFJ-male":   "Rafael Nadal",
    "ESTJ-female": "Steffi Graf",
    "ESFP-male":   "Andy Roddick",
}

cas = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml")

def net_get(url, retries=6):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": REFERER})
            return urllib.request.urlopen(req, timeout=30).read()
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(4 * (2 ** i) + 1)
            else:
                time.sleep(1.5)
        except Exception:
            time.sleep(1.5)
    return None

def faces_of(b):
    arr = np.frombuffer(b, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return [], (0, 0)
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    fs = cas.detectMultiScale(g, scaleFactor=1.05, minNeighbors=3, minSize=(40, 40))
    return [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in fs], img.shape[1::-1]

for key, title in FOUR.items():
    print("=>", key, title)
    # 主图 800px
    q = urllib.parse.urlencode({"action": "query", "titles": title,
        "prop": "pageimages", "piprop": "thumbnail", "pithumbsize": "800",
        "format": "json"})
    d = net_get(API + q)
    saved = 0
    if d:
        try:
            pages = json.loads(d).get("query", {}).get("pages", {})
            for pid, pg in pages.items():
                th = pg.get("thumbnail", {}).get("source")
                if th:
                    b = net_get(th)
                    if b and len(b) > 3000:
                        p = os.path.join(RAW, f"{key}_lead.jpg")
                        open(p, "wb").write(b)
                        fs, dims = faces_of(b)
                        print(f"   lead saved {len(b)}B dims={dims} faces={fs}")
                        saved += 1
        except Exception as e:
            print("   err", e)
    # 再拉几张候选
    q = urllib.parse.urlencode({"action": "query", "generator": "images",
        "titles": title, "gimlimit": "12", "prop": "imageinfo",
        "iiprop": "url", "iiurlwidth": "600", "format": "json"})
    d = net_get(API + q)
    if d:
        try:
            pages = json.loads(d).get("query", {}).get("pages", {})
            n = 0
            for pid, pg in pages.items():
                ii = pg.get("imageinfo")
                t = pg.get("title", "")
                if not ii or not t.lower().endswith((".jpg", ".jpeg")):
                    continue
                th = ii[0].get("thumburl")
                if not th:
                    continue
                b = net_get(th)
                if not b or len(b) < 3000:
                    continue
                fs, dims = faces_of(b)
                if fs:
                    p = os.path.join(RAW, f"{key}_c{n}.jpg")
                    open(p, "wb").write(b)
                    print(f"   cand{n} {t} faces={fs}")
                    saved += 1
                n += 1
                time.sleep(0.3)
        except Exception as e:
            print("   err2", e)
    print(f"   saved={saved}")
    time.sleep(0.5)
print("DONE")
