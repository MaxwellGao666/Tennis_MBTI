// pages/result/result.js
const MBTI = require('../../data/mbti.js')
const app = getApp()

// 想用真实收款码：把一张二维码图片放到 images/reward-qr.png，
// 再把下面这个常量设为 '/images/reward-qr.png' 即可。
const REWARD_QR_PATH = ''

// 经典 MBTI 四分类 -> 主题色（紫/黄/蓝/绿）
// 分析家(NT)=绿  外交家(NF)=黄  守护者(SJ)=蓝  探索者(SP)=紫
const ROLE_THEME = {
  analyst:  { name: '分析家', primary: '#1d6e62', bg: '#e7f3f0' },
  diplomat: { name: '外交家', primary: '#d99a1f', bg: '#fbf2dc' },
  sentinel: { name: '守护者', primary: '#2f74e0', bg: '#e7f0fc' },
  explorer: { name: '探索者', primary: '#8b5cf6', bg: '#f1eafd' }
}

// 稀有度 -> 颜色
const RARITY_COLORS = {
  '普通': '#94a3b0',
  '稀有': '#1d9e8f',
  '史诗': '#8b5cf6',
  '传说': '#d99a1f'
}

// 由 4 字母类型推导经典角色
function getRoleKey(type) {
  const n = type[1]
  const t = type[2]
  if (n === 'N' && t === 'T') return 'analyst'
  if (n === 'N' && t === 'F') return 'diplomat'
  if (n === 'S' && t === 'J') return 'sentinel'
  return 'explorer'
}

Page({
  data: {
    type: '',
    gender: 'female', // 'male' | 'female'
    info: null,
    star: null,
    starInitial: '',
    starImageOk: true,
    cardImg: '',
    showReward: false,
    rewardQr: REWARD_QR_PATH,
    // 主题相关
    themePrimary: '#1d6e62',
    themeBg: '#e7f3f0',
    themeRoleName: '分析家',
    rarityColor: '#94a3b0'
  },

  onLoad(options) {
    const type = (options.type || '').toUpperCase()
    const gender = options.gender || app.globalData.gender || 'female'
    const info = MBTI[type] || MBTI.INFP
    const star = info.stars[gender]
    const roleKey = getRoleKey(info.code || type)
    const theme = ROLE_THEME[roleKey] || ROLE_THEME.analyst
    const rarityColor = RARITY_COLORS[info.rarity] || RARITY_COLORS['普通']

    // 存到实例，供 canvas 使用
    this.theme = theme
    this.rarityColor = rarityColor

    this.setData({
      type: info.code || type,
      gender,
      info,
      star,
      starInitial: (star.name || '')[0] || '★',
      starImageOk: true,
      themePrimary: theme.primary,
      themeBg: theme.bg,
      themeRoleName: theme.name,
      rarityColor
    })
    app.globalData.gender = gender
    wx.setStorageSync('gender', gender)
  },

  onReady() {
    this.generateCard()
  },

  switchGender(e) {
    const gender = e.currentTarget.dataset.gender
    if (gender === this.data.gender) return
    const star = this.data.info.stars[gender]
    this.setData({
      gender,
      star,
      starInitial: (star.name || '')[0] || '★',
      starImageOk: true
    })
    app.globalData.gender = gender
    wx.setStorageSync('gender', gender)
    // 性别切换后重新生成卡片
    this.generateCard()
  },

  // 球星真人图加载失败 -> 用首字兜底
  onStarImgError() {
    this.setData({ starImageOk: false })
  },

  // 将项目内图片复制到本地临时路径，供 canvas 2d 的 Image 加载
  loadLocalImage(canvas, srcPath) {
    return new Promise((resolve) => {
      if (!srcPath) return resolve(null)
      const fs = wx.getFileSystemManager()
      const tmp = `${wx.env.USER_DATA_PATH}/star-card-cache-${Date.now()}.jpg`
      fs.copyFile({
        srcPath,
        destPath: tmp,
        success: () => {
          const img = canvas.createImage()
          img.onload = () => resolve(img)
          img.onerror = () => resolve(null)
          img.src = tmp
        },
        fail: (err) => {
          console.log('copy image fail', err)
          resolve(null)
        }
      })
    })
  },

  // 生成分享/保存用的卡片图（扑克牌比例竖版：上球星，下文案，右下二维码位）
  async generateCard() {
    const query = wx.createSelectorQuery()
    query.select('#cardCanvas').fields({ node: true, size: true }).exec(async (res) => {
      if (!res || !res[0] || !res[0].node) return
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio) || 2

      // 扑克牌比例 2:3，高清输出
      const W = 720, H = 1080
      const HALF = Math.floor(H / 2)
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.scale(dpr, dpr)

      const theme = this.theme || ROLE_THEME.analyst
      const rColor = this.rarityColor || RARITY_COLORS['普通']

      // 全局底色：白色底 + 主题边框感（由导出后透明无关，先铺白）
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)

      // === 上半：球星图区 ===
      const img = await this.loadLocalImage(canvas, this.data.star.image)
      ctx.save()
      this.roundRect(ctx, 0, 0, W, HALF, 0)
      ctx.clip()
      if (img && img.width) {
        // 居中裁剪填充
        const ir = img.width / img.height
        const tr = W / HALF
        let dw, dh, dx, dy
        if (ir > tr) {
          dh = HALF; dw = dh * ir; dx = (W - dw) / 2; dy = 0
        } else {
          dw = W; dh = dw / ir; dx = 0; dy = (HALF - dh) / 2
        }
        ctx.drawImage(img, dx, dy, dw, dh)
      } else {
        // 兜底：主题渐变 + 首字
        const grad = ctx.createLinearGradient(0, 0, W, HALF)
        grad.addColorStop(0, theme.primary)
        grad.addColorStop(1, this.darken(theme.primary, 0.22))
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, W, HALF)
        ctx.textAlign = 'center'
        ctx.fillStyle = 'rgba(255,255,255,0.35)'
        ctx.font = 'bold 240px sans-serif'
        ctx.fillText(this.data.starInitial, W / 2, HALF / 2 + 80)
      }
      ctx.restore()

      // 球星名浮层（底部渐变遮罩+名字）
      const nameGrad = ctx.createLinearGradient(0, HALF - 110, 0, HALF)
      nameGrad.addColorStop(0, 'rgba(0,0,0,0)')
      nameGrad.addColorStop(1, 'rgba(0,0,0,0.55)')
      ctx.fillStyle = nameGrad
      ctx.fillRect(0, HALF - 110, W, 110)
      ctx.textAlign = 'left'
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 38px sans-serif'
      ctx.fillText(this.data.star.name, 34, HALF - 30)

      // === 下半：信息区 ===
      // 头部标题块
      ctx.textAlign = 'left'

      // MBTI 类型大字
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '4px'
      ctx.fillStyle = theme.primary
      ctx.font = 'bold 86px sans-serif'
      ctx.fillText(this.data.type, 40, HALF + 110)
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0px'

      // 类型名 · 外号
      ctx.fillStyle = '#2c3e50'
      ctx.font = 'bold 34px sans-serif'
      ctx.fillText(`${this.data.info.name} · ${this.data.info.nickname}`, 40, HALF + 168)

      // 稀有度 pill
      const pillW = 110, pillH = 46, pillX = 40, pillY = HALF + 196
      ctx.fillStyle = rColor
      this.roundRect(ctx, pillX, pillY, pillW, pillH, 23)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 26px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(this.data.info.rarity, pillX + pillW / 2, pillY + 32)
      ctx.textAlign = 'left'

      // 角色标签
      ctx.strokeStyle = theme.primary
      ctx.lineWidth = 2
      ctx.fillStyle = 'rgba(255,255,255,0)'
      this.roundRect(ctx, 168, HALF + 196, 130, 46, 23)
      ctx.stroke()
      ctx.fillStyle = theme.primary
      ctx.font = 'bold 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(theme.name, 168 + 65, HALF + 227)
      ctx.textAlign = 'left'

      // 总结文案（自动换行）
      ctx.fillStyle = '#4a5568'
      ctx.font = '28px sans-serif'
      const summary = this.data.info.cardSummary || this.data.info.cardTagline
      this.wrapText(ctx, summary, 40, HALF + 288, W - 80, 50)

      // === 右下角二维码占位 ===
      const qrSize = 150
      const qrX = W - qrSize - 40
      const qrY = H - qrSize - 40
      ctx.fillStyle = '#ffffff'
      this.roundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 16)
      ctx.fill()
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 2
      this.roundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 16)
      ctx.stroke()
      // 二维码装饰点阵
      ctx.fillStyle = theme.primary
      const cell = 14, gap = 4
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if ((r * 7 + c) % 3 === 0 || r === 0 || r === 6 || c === 0 || c === 6) {
            ctx.fillRect(qrX + c * (cell + gap), qrY + r * (cell + gap), cell, cell)
          }
        }
      }
      // 三个定位角
      ctx.strokeStyle = theme.primary
      ctx.lineWidth = 4
      ;[[qrX, qrY], [qrX + qrSize - 38, qrY], [qrX, qrY + qrSize - 38]].forEach(([x, y]) => {
        ctx.strokeRect(x, y, 34, 34)
      })

      // 左下角提示
      ctx.fillStyle = '#a0aec0'
      ctx.font = '24px sans-serif'
      ctx.fillText('网球 MBTI · 扫码测你的类型', 40, H - 40)

      wx.canvasToTempFilePath({
        canvas,
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
        destWidth: canvas.width,
        destHeight: canvas.height,
        fileType: 'jpg',
        quality: 0.92,
        success: (r) => this.setData({ cardImg: r.tempFilePath }),
        fail: () => {}
      })
    })
  },

  // 把 #rrggbb 颜色压暗 ratio(0~1)
  darken(hex, ratio) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!m) return hex
    const f = (x) => Math.max(0, Math.round(parseInt(x, 16) * (1 - ratio)))
    return `rgb(${f(m[1])},${f(m[2])},${f(m[3])})`
  },

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  },

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const chars = (text || '').split('')
    let line = ''
    let yy = y
    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i]
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, yy)
        line = chars[i]
        yy += lineHeight
      } else {
        line = test
      }
    }
    if (line) ctx.fillText(line, x, yy)
  },

  saveCard() {
    if (!this.data.cardImg) {
      wx.showToast({ title: '卡片生成中…', icon: 'none' })
      return
    }
    wx.saveImageToPhotosAlbum({
      filePath: this.data.cardImg,
      success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
      fail: (err) => {
        const msg = (err && err.errMsg) || ''
        if (/auth|deny/i.test(msg)) {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中允许「保存到相册」后重试',
            confirmText: '去设置',
            success: (r) => { if (r.confirm) wx.openSetting() }
          })
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' })
        }
      }
    })
  },

  onShareAppMessage() {
    return {
      title: `我的网球 MBTI 是 ${this.data.type}·${this.data.info.name}「${this.data.info.nickname}」，本命球星 ${this.data.star.name}`,
      path: `/pages/result/result?type=${this.data.type}&gender=${this.data.gender}`,
      imageUrl: this.data.cardImg || ''
    }
  },

  showReward() { this.setData({ showReward: true }) },
  hideReward() { this.setData({ showReward: false }) },
  noop() {},

  retest() {
    wx.reLaunch({ url: '/pages/index/index' })
  }
})
