import urllib.request, urllib.parse, os, time, json, io
import numpy as np
from PIL import Image
import cv2

BASE = "D:/Porject/mbti/images/stars"
API = "https://en.wikipedia.org/w/api.php?"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
REFERER = "https://en.wikipedia.org/"

# 16 张问题图：type-gender -> 维基条目
PROBLEM = {
    "INTJ-male":   "Novak Djokovic",
    "INTJ-female": "Maria Sharapova",
    "ENTJ-male":   "Roger Federer",
    "ENTP-male":   "Carlos Alcaraz",
    "ENFJ-female": "Venus Williams",
    "ENFP-female": "Ons Jabeur",
    "ISTJ-male":   "Andy Murray",
    "ISFJ-male":   "Rafael Nadal",
    "ESTJ-female": "Steffi Graf",
    "ESFJ-male":   "Gustavo Kuerten",
    "ESFJ-female": "Caroline Wozniacki",
    "ISFP-male":   "Boris Becker",
    "ISFP-female": "Ashleigh Barty",
    "ESTP-male":   "Jimmy Connors",
    "ESTP-female": "Monica Seles",
    "ESFP-male":   "Andy Roddick",
}

cas1 = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml")
cas2 = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

def net_get(url, retries=5):
    last = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": REFERER})
            return urllib.request.urlopen(req, timeout=30).read()
        except urllib.error.HTTPError as e:
            last = e
            if e.code == 429:
                time.sleep(3 * (2 ** i) + 1)
            else:
                time.sleep(1.5)
        except Exception as e:
            last = e
            time.sleep(1.5)
    print("   NET FAIL", url, last)
    return None

def detect_faces(img_bytes):
    arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return [], None
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = []
    for cas in (cas1, cas2):
        for sf in (1.05, 1.15):
            for mn in (4, 6):
                fs = cas.detectMultiScale(gray, scaleFactor=sf, minNeighbors=mn, minSize=(50, 50))
                for (x, y, w, h) in fs:
                    faces.append((int(x), int(y), int(w), int(h)))
    H, W = img.shape[:2]
    # 去重：合并重叠 >50% 的框，保留较大者
    uniq = []
    for f in sorted(faces, key=lambda f: -(f[2] * f[3])):
        if any(_iou(f, u) > 0.5 for u in uniq):
            continue
        uniq.append(f)
    return uniq, (W, H)

def _iou(a, b):
    xa, ya, wa, ha = a; xb, yb, wb, hb = b
    ix = max(0, min(xa + wa, xb + wb) - max(xa, xb))
    iy = max(0, min(ya + ha, yb + hb) - max(ya, yb))
    inter = ix * iy
    return inter / max(1, (wa * ha + wb * hb - inter))

def crop_to_face(img_bytes, face, out_path, size=480):
    arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    x, y, w, h = face
    cx, cy = x + w / 2, y + h / 2
    side = max(w, h) * 2.2
    side = int(side)
    left = int(cx - side / 2); top = int(cy - side / 2)
    if left < 0: left = 0
    if top < 0: top = 0
    right = left + side; bottom = top + side
    H, W = img.shape[:2]
    if right > W:
        right = W; left = max(0, right - side)
    if bottom > H:
        bottom = H; top = max(0, bottom - side)
    if left < 0: left = 0
    if top < 0: top = 0
    crop = img[top:bottom, left:right]
    out = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)).resize((size, size), Image.LANCZOS)
    out.save(out_path, "JPEG", quality=86)

report = {"chosen": [], "failed": []}

for key, title in PROBLEM.items():
    code, gender = key.split("-")
    out = os.path.join(BASE, f"{code}-{gender}.jpg")
    print("=>", key, title)
    # 拉取该词条全部图片候选（带 600px 缩略图）
    q = urllib.parse.urlencode({
        "action": "query", "generator": "images", "titles": title,
        "gimlimit": "30", "prop": "imageinfo", "iiprop": "url",
        "iiurlwidth": "600", "format": "json"
    })
    d = net_get(API + q)
    if not d:
        print("   NO API"); report["failed"].append(key); continue
    try:
        pages = json.loads(d).get("query", {}).get("pages", {})
    except Exception as e:
        print("   JSON ERR", e); report["failed"].append(key); continue
    best = None  # (area, face, bytes, src_title)
    for pid, pg in pages.items():
        ii = pg.get("imageinfo")
        t = pg.get("title", "")
        if not ii:
            continue
        if not t.lower().endswith((".jpg", ".jpeg")):
            continue
        thumb = ii[0].get("thumburl")
        if not thumb:
            continue
        b = net_get(thumb)
        if not b or len(b) < 2000:
            continue
        faces, dims = detect_faces(b)
        # 只接受「脸占图面积适中」的候选，避免误检到小球/大物体
        for f in faces:
            area = f[2] * f[3]
            W, H = dims
            ratio = area / (W * H)
            if 0.02 <= ratio <= 0.55:
                score = area
                if best is None or score > best[0]:
                    best = (score, f, b, t)
        time.sleep(0.35)
    if best:
        crop_to_face(best[2], best[1], out)
        print(f"   OK face {best[1]} from {best[3]}")
        report["chosen"].append({"key": key, "src": best[3], "face_box": best[1]})
    else:
        print("   NO FACE in any candidate -> manual")
        report["failed"].append(key)

with open(os.path.join(BASE, "refetch_report.json"), "w") as f:
    json.dump(report, f, indent=2)
print("\n=== DONE chosen=%d failed=%d ===" % (len(report["chosen"]), len(report["failed"])))
print("FAILED:", report["failed"])
