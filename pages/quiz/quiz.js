// pages/quiz/quiz.js
const questions = require('../../data/questions.js')
const { computeType } = require('../../utils/quiz.js')
const app = getApp()

Page({
  data: {
    list: questions,
    index: 0,
    total: questions.length,
    answers: new Array(questions.length).fill(null)
  },

  // 选择某选项：记录答案并自动进入下一题，最后一题则出结果
  selectOption(e) {
    const value = e.currentTarget.dataset.value
    const i = this.data.index
    const answers = this.data.answers.slice()
    answers[i] = value
    this.setData({ answers })

    if (i < this.data.total - 1) {
      this.setData({ index: i + 1 })
    } else {
      this.finish()
    }
  },

  prev() {
    if (this.data.index > 0) {
      this.setData({ index: this.data.index - 1 })
    }
  },

  finish() {
    const type = computeType(this.data.answers)
    const gender = app.globalData.gender || 'female'
    wx.redirectTo({
      url: `/pages/result/result?type=${type}&gender=${gender}`
    })
  }
})
