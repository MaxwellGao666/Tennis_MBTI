// data/questions.js
// 16 道 MBTI 测试题（E/I、S/N、T/F、J/P 各 4 题），二选一。
// 每题 options 中 value 为该选项所倾向的维度字母。
// 计分：累加各字母出现次数，每对取较多者；平局时回退默认 I / N / F / P。

const questions = [
  // ===== E / I =====
  {
    id: 1,
    dimension: 'EI',
    question: '一场比赛输掉之后，你更可能怎么调整？',
    options: [
      { text: '找队友一起复盘、聊聊感受', value: 'E' },
      { text: '自己安静地想想哪里出了问题', value: 'I' }
    ]
  },
  {
    id: 2,
    dimension: 'EI',
    question: '休息日你更偏好的安排是？',
    options: [
      { text: '约朋友打球、参加活动', value: 'E' },
      { text: '一个人在家看比赛或练练技术', value: 'I' }
    ]
  },
  {
    id: 3,
    dimension: 'EI',
    question: '面对陌生的对手，你通常会？',
    options: [
      { text: '主动搭话，很快热络起来', value: 'E' },
      { text: '先观察，等熟悉了再交流', value: 'I' }
    ]
  },
  {
    id: 4,
    dimension: 'EI',
    question: '给自己「充电」的方式更接近？',
    options: [
      { text: '和人待在一起就有劲', value: 'E' },
      { text: '独处、远离喧嚣才恢复', value: 'I' }
    ]
  },

  // ===== S / N =====
  {
    id: 5,
    dimension: 'SN',
    question: '学一个新发球动作，你更关注？',
    options: [
      { text: '具体的手感、步点和肌肉记忆', value: 'S' },
      { text: '背后的发力原理和整体战术意义', value: 'N' }
    ]
  },
  {
    id: 6,
    dimension: 'SN',
    question: '看一场比赛，你更容易记住？',
    options: [
      { text: '每一个比分和关键分的细节', value: 'S' },
      { text: '选手之间的节奏变化和战术意图', value: 'N' }
    ]
  },
  {
    id: 7,
    dimension: 'SN',
    question: '你更相信？',
    options: [
      { text: '经验和已经验证过的打法', value: 'S' },
      { text: '直觉和可能的新思路', value: 'N' }
    ]
  },
  {
    id: 8,
    dimension: 'SN',
    question: '描述一件事时你更偏向？',
    options: [
      { text: '讲清楚具体发生了什么', value: 'S' },
      { text: '讲它意味着什么、未来会怎样', value: 'N' }
    ]
  },

  // ===== T / F =====
  {
    id: 9,
    dimension: 'TF',
    question: '双打搭档失误导致丢分，你第一反应是？',
    options: [
      { text: '理性分析配合哪里出了问题', value: 'T' },
      { text: '先安抚对方情绪，别让气氛尴尬', value: 'F' }
    ]
  },
  {
    id: 10,
    dimension: 'TF',
    question: '做是否参赛的决策，你更看重？',
    options: [
      { text: '胜负概率和排名收益', value: 'T' },
      { text: '自己是否享受、对团队有没有意义', value: 'F' }
    ]
  },
  {
    id: 11,
    dimension: 'TF',
    question: '别人向你请教，你通常？',
    options: [
      { text: '直接给改进方案', value: 'T' },
      { text: '先共情，再给建议', value: 'F' }
    ]
  },
  {
    id: 12,
    dimension: 'TF',
    question: '你更希望被评价为？',
    options: [
      { text: '逻辑清晰、就事论事', value: 'T' },
      { text: '体贴、善于理解人', value: 'F' }
    ]
  },

  // ===== J / P =====
  {
    id: 13,
    dimension: 'JP',
    question: '比赛前一晚，你更可能？',
    options: [
      { text: '提前列好战术清单和作息', value: 'J' },
      { text: '顺其自然，到时候看状态', value: 'P' }
    ]
  },
  {
    id: 14,
    dimension: 'JP',
    question: '你对待训练计划的态度是？',
    options: [
      { text: '按计划执行，不喜欢被打乱', value: 'J' },
      { text: '保持灵活，随时调整', value: 'P' }
    ]
  },
  {
    id: 15,
    dimension: 'JP',
    question: '你更喜欢？',
    options: [
      { text: '把事情早早定下来', value: 'J' },
      { text: '保留多种可能，最后再决定', value: 'P' }
    ]
  },
  {
    id: 16,
    dimension: 'JP',
    question: '遇到比赛因雨暂停，你？',
    options: [
      { text: '有点烦躁，希望尽快恢复秩序', value: 'J' },
      { text: '无所谓，趁机放松一下', value: 'P' }
    ]
  }
]

module.exports = questions
