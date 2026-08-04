// pages/index/index.js
const app = getApp()

Page({
  data: {
    gender: 'female' // 'male' | 'female'
  },

  onLoad() {
    const g = (wx.getStorageSync('gender') || app.globalData.gender || 'female')
    this.setData({ gender: g })
    app.globalData.gender = g
  },

  selectGender(e) {
    const gender = e.currentTarget.dataset.gender
    this.setData({ gender })
    app.globalData.gender = gender
    wx.setStorageSync('gender', gender)
  },

  startTest() {
    wx.navigateTo({ url: '/pages/quiz/quiz' })
  }
})
