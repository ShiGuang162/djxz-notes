const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()

  return `${year}-${formatNumber(month)}-${formatNumber(day)} ${formatNumber(hour)}:${formatNumber(minute)}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

const formatDate = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}-${formatNumber(month)}-${formatNumber(day)}`
}

const formatDateCN = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}年${month}月${day}日`
}

const getDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

const isToday = dateStr => {
  const today = formatDate(new Date())
  return dateStr === today
}

const getWeekDay = date => {
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return weekDays[dateObj.getDay()]
}

const debounce = (func, wait) => {
  let timeout = null
  return function () {
    const context = this
    const args = arguments
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      func.apply(context, args)
    }, wait)
  }
}

const throttle = (func, limit) => {
  let inThrottle = false
  return function () {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

module.exports = {
  formatTime,
  formatNumber,
  formatDate,
  formatDateCN,
  getDaysBetween,
  isToday,
  getWeekDay,
  debounce,
  throttle
}