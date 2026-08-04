// pages/result/result.js
const MBTI = require('../../data/mbti.js')
const app = getApp()

// 想用真实收款码：把一张二维码图片放到 images/reward-qr.png，
// 再把下面这个常量设为 '/images/reward-qr.png' 即可。
const REWARD_QR_PATH = ''

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
    rewardQr: REWARD_QR_PATH
  },

  onLoad(options) {
    const type = (options.type || '').toUpperCase()
    const gender = options.gender || app.globalData.gender || 'female'
    const info = MBTI[type] || MBTI.INFP
    const star = info.stars[gender]
    this.setData({
      type: info.code || type,
      gender,
      info,
      star,
      starInitial: (star.name || '')[0] || '★',
      starImageOk: true
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

      // 背景
      const grad = ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0, '#14534a')
      grad.addColorStop(1, '#0d3a33')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      // 网球
      ctx.fillStyle = '#e8b84b'
      ctx.beginPath()
      ctx.arc(W / 2, 210, 96, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#0d3a33'
      ctx.lineWidth = 8
      ctx.beginPath()
      ctx.arc(W / 2, 210, 96, -0.5, 0.5)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(W / 2, 210, 96, Math.PI - 0.5, Math.PI + 0.5)
      ctx.stroke()

      ctx.textAlign = 'center'

      // 类型代码（加字距更清楚）
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '6px'
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 92px sans-serif'
      ctx.fillText(this.data.type, W / 2, 430)
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0px'

      // 类型名
      ctx.fillStyle = '#e8b84b'
      ctx.font = '38px sans-serif'
      ctx.fillText(this.data.info.name, W / 2, 486)

      // 球星
      ctx.fillStyle = '#ffffff'
      ctx.font = '30px sans-serif'
      ctx.fillText('本命球星 · ' + this.data.star.name, W / 2, 556)

      // 标语（自动换行）
      ctx.fillStyle = 'rgba(255,255,255,0.88)'
      ctx.font = '30px sans-serif'
      this.wrapText(ctx, this.data.info.cardTagline, W / 2, 640, W - 150, 46)

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
      title: `我的网球 MBTI 是 ${this.data.type}·${this.data.info.name}，本命球星 ${this.data.star.name}`,
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
