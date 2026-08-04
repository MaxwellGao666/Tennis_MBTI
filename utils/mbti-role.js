// utils/mbti-role.js
// 经典 MBTI 四分类 -> 主题色（紫 / 蓝 / 绿 / 黄）
//   分析家 Analysts (NT) = 紫
//   外交家 Diplomats (NF) = 蓝
//   守护者 Sentinels (SJ) = 绿
//   探索者 Explorers  (SP) = 黄
// 作为「四色分类」的单一数据源，首页分类展示与结果页主题色都引用这里。

const ROLE_THEME = {
  analyst:  { key: 'analyst',  name: '分析家', en: 'Analysts',  letter: 'NT', color: '#9b59b6', bg: '#f3e8f7' },
  diplomat: { key: 'diplomat', name: '外交家', en: 'Diplomats', letter: 'NF', color: '#3498db', bg: '#e8f4fc' },
  sentinel: { key: 'sentinel', name: '守护者', en: 'Sentinels', letter: 'SJ', color: '#27ae60', bg: '#e8f6ef' },
  explorer: { key: 'explorer', name: '探索者', en: 'Explorers', letter: 'SP', color: '#d4a017', bg: '#fbf3dc' }
}

// 分类展示顺序（按需求：紫、蓝、绿、黄）
const ROLE_ORDER = ['analyst', 'diplomat', 'sentinel', 'explorer']

// 由 4 字母类型推导经典角色
function getRoleKey(type) {
  const n = (type || '')[1]
  const t = (type || '')[2]
  const j = (type || '')[3]
  if (n === 'N' && t === 'T') return 'analyst'
  if (n === 'N' && t === 'F') return 'diplomat'
  if (n === 'S' && j === 'J') return 'sentinel'
  return 'explorer'
}

module.exports = { ROLE_THEME, ROLE_ORDER, getRoleKey }
