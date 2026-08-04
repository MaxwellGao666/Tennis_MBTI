网球 MBTI · 球星真人图放置说明
================================

每个 MBTI 类型在 data/mbti.js 里都给男女球星预留了 image 字段，
路径统一为： /images/stars/{类型}-{性别}.jpg
注意：文件名性别部分必须小写（male / female），与 data/mbti.js 中
IMG() 生成的路径完全一致；否则在微信云构建（Linux，大小写敏感）会 404。

例如（共 32 张）：
  INTJ-male.jpg      INTJ-female.jpg
  INTP-male.jpg      INTP-female.jpg
  ENTJ-male.jpg      ENTJ-female.jpg
  ...（对照 data/mbti.js 里的 stars.male / stars.female）

当前状态
--------
32 张已全部替换为真实球星照片，由脚本 scripts/fetch_star_images.py
从英文维基百科（Wikimedia Commons）自动抓取主图，统一转 JPEG、
最长边压缩到 500px，单张约 25–65KB，总计约 1.16MB。
没放或文件名对不上的球星，结果页会自动用「姓名首字」的圆形头像兜底。

图片来源与授权
--------------
- 来源：英文维基百科条目主图（多为 Wikimedia Commons 自由授权，如
  CC BY-SA / CC BY / 公有领域）。抓取脚本见 scripts/fetch_star_images.py。
- 仅供学习/娱乐演示使用。若要正式发布上线，请逐张核对每张图的许可协议，
  必要时替换为已获授权的图片或自行拍摄，避免肖像权与版权风险。
- 替换方式：用你自己的真实球星图覆盖同名文件即可，命名保持不变。

图片建议
--------
- 正方形或接近正方形，建议 400x400 以上、人脸居中。
- 32 张总大小需留意主包 2MB 上限（含本目录球星图 + 背景图）。
  当前球星图约 1.16MB；若再加上背景图超出上限，建议：
  ① 把结果页拆成 分包(subpackage)；② 或把图片放 CDN 并在小程序后台
  配置 downloadFile 合法域名。
