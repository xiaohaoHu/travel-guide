// 工具函数

/**
 * 格式化时间
 */
function formatTime(date) {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute].map(formatNumber).join(':')
}

/**
 * 格式化日期（简短）
 */
function formatDate(date) {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  const now = new Date()
  const diff = now - date
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return Math.floor(diff / minute) + '分钟前'
  if (diff < day) return Math.floor(diff / hour) + '小时前'
  if (diff < 7 * day) return Math.floor(diff / day) + '天前'
  const month = date.getMonth() + 1
  const d = date.getDate()
  return month + '月' + d + '日'
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

/**
 * 数值格式化（如 1200 -> 1.2k）
 */
function formatCount(count) {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w'
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k'
  }
  return count.toString()
}

module.exports = {
  formatTime,
  formatDate,
  formatCount
}
