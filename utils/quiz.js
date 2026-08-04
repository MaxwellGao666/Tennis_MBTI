// utils/quiz.js
// 计分逻辑：根据 16 个选项值（字母）推算 4 字母 MBTI 类型。
// 平局时回退默认：I / N / F / P（更常见、偏内向直觉情感感知的取向）。

function computeType(answers) {
  const counts = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
  answers.forEach(v => {
    if (counts[v] !== undefined) counts[v]++
  })
  const pick = (a, b, def) => {
    if (counts[a] > counts[b]) return a
    if (counts[b] > counts[a]) return b
    return def
  }
  const e = pick('E', 'I', 'I')
  const s = pick('S', 'N', 'N')
  const t = pick('T', 'F', 'F')
  const j = pick('J', 'P', 'P')
  return `${e}${s}${t}${j}`
}

module.exports = { computeType }
