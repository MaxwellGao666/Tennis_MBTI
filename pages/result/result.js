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
  '普通': '#94a3a0',
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
    rarityColor: '#94a3a0'
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

  // 生成分享/保存用的卡片图（离屏 canvas 2d，按 dpr 高清渲染）
  generateCard() {
    const query = wx.createSelectorQuery()
    query.select('#cardCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) return
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio) || 2
      // 更大的逻辑画布，保证文字清晰
      const W = 720, H = 960
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.scale(dpr, dpr)

      const theme = this.theme || ROLE_THEME.analyst
      const rColor = this.rarityColor || RARITY_COLORS['普通']

      // 背景：主题色渐变
      const grad = ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0, theme.primary)
      grad.addColorStop(1, this.darken(theme.primary, 0.18))
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      // 网球装饰
      ctx.fillStyle = '#e8b84b'
      ctx.beginPath()
      ctx.arc(W / 2, 200, 84, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = this.darken(theme.primary, 0.3)
      ctx.lineWidth = 7
      ctx.beginPath()
      ctx.arc(W / 2, 200, 84, -0.5, 0.5)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(W / 2, 200, 84, Math.PI - 0.5, Math.PI + 0.5)
      ctx.stroke()

      ctx.textAlign = 'center'

      // 类型代码（加字距更清楚）
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '6px'
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 92px sans-serif'
      ctx.fillText(this.data.type, W / 2, 410)
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0px'

      // 类型名 + 外号
      ctx.fillStyle = '#e8b84b'
      ctx.font = 'bold 40px sans-serif'
      ctx.fillText(this.data.info.name + ' · ' + this.data.info.nickname, W / 2, 470)

      // 稀有度 pill
      ctx.fillStyle = rColor
      this.roundRect(ctx, W / 2 - 90, 500, 180, 52, 26)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 30px sans-serif'
      ctx.fillText(this.data.info.rarity, W / 2, 536)

      // 球星
      ctx.fillStyle = '#ffffff'
      ctx.font = '34px sans-serif'
      ctx.fillText('本命球星 · ' + this.data.star.name, W / 2, 624)

      // 球星简短介绍（自动换行）
      ctx.fillStyle = 'rgba(255,255,255,0.90)'
      ctx.font = '28px sans-serif'
      this.wrapText(ctx, this.data.star.intro || '', W / 2, 690, W - 150, 44)

      // 标语
      ctx.fillStyle = 'rgba(255,255,255,0.72)'
      ctx.font = '26px sans-serif'
      this.wrapText(ctx, this.data.info.cardTagline, W / 2, 812, W - 150, 40)

      // 页脚
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = '24px sans-serif'
      ctx.fillText('网球 MBTI · 扫码测你的类型', W / 2, H - 56)

      wx.canvasToTempFilePath({
        canvas,
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
        destWidth: canvas.width,
        destHeight: canvas.height,
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
