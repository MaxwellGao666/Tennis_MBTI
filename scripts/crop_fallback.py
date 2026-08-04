"""对 4 张 Haar 未检出/脸过小的源图，用「脸偏上」的通用 fallback 裁成脸可见正方形。"""
import os, json, cv2

BASE = "D:/Porject/mbti/images/stars"
RAW = os.path.join(BASE, "_raw")
REVIEW = ["INTP-female","ENFJ-male","INFP-female","ISTP-female"]
report = []

for key in REVIEW:
    src = os.path.join(RAW, f"{key}.jpg")
    dst = os.path.join(BASE, f"{key}.jpg")
    img = cv2.imread(src)
    H, W = img.shape[:2]
    ratio = W/H
    if ratio < 0.72:
        # 瘦高全身照：取顶部正方形(头+上半身)
        side = W
        x1, y1 = 0, 0
    else:
        # 偏方形肖像：中心略上，取正方形
        side = min(W, int(H*0.72))
        cx, cy = W//2, int(H*0.36)
        x1 = max(0, cx - side//2)
        y1 = max(0, cy - side//2)
    x2 = min(W, x1+side); y2 = min(H, y1+side)
    crop = img[y1:y2, x1:x2]
    out = cv2.resize(crop, (480,480), interpolation=cv2.INTER_LANCZOS4)
    cv2.imwrite(dst, out, [cv2.IMWRITE_JPEG_QUALITY, 82])
    report.append({"key":key,"mode":"fallback","crop_box":[x1,y1,x2,y2],"src_size":[W,H]})
    print(key, "fallback crop", [x1,y1,x2,y2])

with open(os.path.join(BASE,"crop_report.json"),"r",encoding="utf-8") as f:
    old = json.load(f)

# 把 review 列表里这 4 条标记为已 fallback 处理
for r in old["review"]:
    if r["key"] in REVIEW:
        r["reason"] = r.get("reason","") + "_fallback_fixed"
old["ok"].extend(report)
with open(os.path.join(BASE,"crop_report.json"),"w",encoding="utf-8") as f:
    json.dump(old, f, indent=2, ensure_ascii=False)
print("done")
