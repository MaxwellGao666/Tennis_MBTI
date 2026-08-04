// pages/quiz/quiz.js
const questions = require('../../data/questions.js')
const { computeType } = require('../../utils/quiz.js')
const app = getApp()

Page({
  data: {
    list: questions,
    index: 0,
    total: questions.length,
    answers: new Array(questions.length).fill(null),
    selected: null // 当前题已选（但未提交）的值，用于显示「确认按下态」
  },

  // 点选项：仅标记为已选，显示确认态，不自动跳题
  selectOption(e) {
    const value = e.currentTarget.dataset.value
    this.setData({ selected: value })
  },

  // 上一题：回退并恢复该题已选答案
  prev() {
    if (this.data.index === 0) return
    const i = this.data.index - 1
    this.setData({ index: i, selected: this.data.answers[i] })
  },

  // 下一题 / 出结果：先校验已选，再提交并前进（每题都会重置选中态）
  next() {
    const i = this.data.index
    if (this.data.selected == null) {
      wx.showToast({ title: '请先选择一个选项', icon: 'none' })
      return
    }
    const answers = this.data.answers.slice()
    answers[i] = this.data.selected
    if (i < this.data.total - 1) {
      // 前进到下一题，并把 selected 重置为该题已存答案（首次为 null = 未选）
      this.setData({ answers, index: i + 1, selected: answers[i + 1] || null })
    } else {
      this.setData({ answers })
      this.finish(answers)
    }
  },

  finish(answers) {
    const type = computeType(answers)
    const gender = app.globalData.gender || 'female'
    wx.redirectTo({
      url: `/pages/result/result?type=${type}&gender=${gender}`
    })
  }
})
