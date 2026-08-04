// pages/index/index.js
const app = getApp()
const MBTI = require('../../data/mbti.js')
const { ROLE_THEME, ROLE_ORDER, getRoleKey } = require('../../utils/mbti-role.js')

Page({
  data: {
    gender: 'female', // 'male' | 'female'
    // 四大类颜色分类展示（紫、蓝、绿、黄）
    catLegend: [],
    // 快速出结果弹窗
    showQuick: false,
    groups: []
  },

  onLoad() {
    const g = (wx.getStorageSync('gender') || app.globalData.gender || 'female')
    this.setData({ gender: g })
    app.globalData.gender = g
    this.buildCategories()
  },

  // 构建「四大类」图例 + 快速出结果的分组（按四色分组全部 16 型）
  buildCategories() {
    const catLegend = ROLE_ORDER.map((key) => {
      const t = ROLE_THEME[key]
      return { key, name: t.name, letter: t.letter, color: t.color, bg: t.bg }
    })
    const groups = ROLE_ORDER.map((key) => {
      const t = ROLE_THEME[key]
      const types = Object.keys(MBTI)
        .filter((code) => getRoleKey(code) === key)
        .map((code) => ({
          code,
          name: MBTI[code].name,
          nickname: MBTI[code].nickname,
          color: t.color
        }))
      return { name: t.name, letter: t.letter, color: t.color, bg: t.bg, types }
    })
    this.setData({ catLegend, groups })
  },

  selectGender(e) {
    const gender = e.currentTarget.dataset.gender
    this.setData({ gender })
    app.globalData.gender = gender
    wx.setStorageSync('gender', gender)
  },

  startTest() {
    wx.navigateTo({ url: '/pages/quiz/quiz' })
  },

  // 快速出结果（测试）：跳过 16 题，直接看某一类型的结果
  openQuick() { this.setData({ showQuick: true }) },
  closeQuick() { this.setData({ showQuick: false }) },
  noop() {},

  quickPick(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ showQuick: false })
    wx.navigateTo({ url: `/pages/result/result?type=${type}&gender=${this.data.gender}` })
  }
})
