"""对 images/stars/_raw/ 的 32 张源图做面部检测，裁成脸居中的正方形，
覆盖 images/stars/{TYPE}-{gender}.jpg。输出 report.json 标记需人工复核的图。"""
import os, json, cv2, numpy as np
from PIL import Image

BASE = "D:/Porject/mbti/images/stars"
RAW = os.path.join(BASE, "_raw")
OUT = BASE
REPORT = os.path.join(BASE, "crop_report.json")

HC = cv2.data.haarcascades
frontal = cv2.CascadeClassifier(os.path.join(HC, "haarcascade_frontalface_default.xml"))
profile = cv2.CascadeClassifier(os.path.join(HC, "haarcascade_profileface.xml"))

codes = ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP",
         "ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"]

def detect(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    faces = []
    for cas, sc in ((frontal,1.05),(profile,1.05)):
        f = cas.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5,
                                 minSize=(40,40), flags=cv2.CASCADE_SCALE_IMAGE)
        for (x,y,w,h) in f:
            faces.append((x,y,w,h,sc))
    return faces

def best_face(faces, W, H):
    if not faces: return None
    # 取面积最大；若有 frontal 优先
    def score(f):
        x,y,w,h,sc = f
        return (w*h) * (2.0 if sc==1.05 and cas_is_frontal(f) else 1.0)
    def cas_is_frontal(f):
        return f[4]==1.05
    # 简单：面积最大优先
    return max(faces, key=lambda f: f[2]*f[3])

report = {"ok":[], "review":[]}
for c in codes:
    for g in ("male","female"):
        key = f"{c}-{g}"
        src = os.path.join(RAW, f"{key}.jpg")
        dst = os.path.join(OUT, f"{key}.jpg")
        if not os.path.exists(src):
            report["review"].append({"key":key,"reason":"raw_missing"}); continue
        img = cv2.imread(src)
        if img is None:
            report["review"].append({"key":key,"reason":"decode_fail"}); continue
        H, W = img.shape[:2]
        faces = detect(img)
        bf = best_face(faces, W, H) if faces else None
        if bf is None:
            report["review"].append({"key":key,"reason":"no_face","W":W,"H":H}); continue
        x,y,w,h,sc = bf
        area_ratio = (w*h)/(W*H)
        # 脸居中正方形：边长 = max(w,h)*K，中心为脸中心
        K = 2.3
        side = int(max(w,h) * K)
        cx, cy = x + w//2, y + h//2
        # 适当把中心略上移(脸偏上更自然)
        cy = int(cy - side*0.05)
        half = side//2
        x1 = max(0, cx-half); y1 = max(0, cy-half)
        x2 = min(W, x1+side); y2 = min(H, y1+side)
        # 若被裁小，重新以可用宽度居中
        cw, ch = x2-x1, y2-y1
        if cw < side:  # 宽度不足，左右补满尽量
            x1 = max(0, min(x1, W-side)); x2 = x1+side
            if x2 > W: x2=W; x1=W-side
        if ch < side:
            y1 = max(0, min(y1, H-side)); y2 = y1+side
            if y2 > H: y2=H; y1=H-side
        crop = img[y1:y2, x1:x2]
        # 若裁剪非正方(极端情况)，再补为正方
        ch2, cw2 = crop.shape[:2]
        if ch2 != cw2:
            s = min(ch2,cw2)
            crop = crop[0:s, 0:s]
        out = cv2.resize(crop, (480,480), interpolation=cv2.INTER_LANCZOS4)
        cv2.imwrite(dst, out, [cv2.IMWRITE_JPEG_QUALITY, 82])
        rec = {"key":key,"face_box":[int(x),int(y),int(w),int(h)],
               "area_ratio":round(area_ratio,4),"crop_box":[int(x1),int(y1),int(x2),int(y2)],
               "src_size":[W,H]}
        if area_ratio < 0.03:
            rec["reason"]="tiny_face"
            report["review"].append(rec)
        else:
            report["ok"].append(rec)

with open(REPORT,"w") as f:
    json.dump(report, f, indent=2, ensure_ascii=False)

print("OK:", len(report["ok"]))
print("REVIEW:", len(report["review"]))
for r in report["review"]:
    print("  ", r["key"], r.get("reason"), r.get("area_ratio",""))
