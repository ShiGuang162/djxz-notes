const App = getApp()
const { diary } = require('../../utils/db.js')

Page({
  data: {
    years: [],
    currentYear: 0,
    monthGroups: [],
    isLoading: false,
    totalDiaries: 0,
    totalWords: 0,
    totalDays: 0,
    activePercent: 0
  },

  onLoad() {
    const now = new Date()
    const currentYear = now.getFullYear()
    // 生成年份列表：当前年份和上一年
    const years = [currentYear, currentYear - 1]
    this.setData({ years, currentYear })
    this.loadArchive(currentYear)
  },

  onShow() {
    this.loadArchive(this.data.currentYear)
  },

  // 选择年份
  selectYear(e) {
    const year = e.currentTarget.dataset.year
    if (year === this.data.currentYear) return
    this.setData({ currentYear: year })
    this.loadArchive(year)
  },

  // 加载归档数据
  loadArchive(year) {
    if (this.data.isLoading) return
    this.setData({ isLoading: true })

    try {
      const openid = App.getOpenid()
      const allDiaries = diary.getAll(openid) || []

      // 筛选指定年份的日记
      const yearDiaries = allDiaries.filter(d => {
        const date = new Date(d.createTime)
        return date.getFullYear() === year
      })

      // 按月份分组
      const monthMap = {}
      yearDiaries.forEach(d => {
        const date = new Date(d.createTime)
        const month = date.getMonth() + 1
        if (!monthMap[month]) {
          monthMap[month] = []
        }

        // 提取标题（第一行或前20字）
        const content = d.content || ''
        const lines = content.split('\n').filter(l => l.trim())
        const title = lines.length > 0 ? lines[0].substring(0, 20) : '无标题'

        // 提取预览（去掉第一行后的前50字）
        const remainingContent = lines.length > 1 ? lines.slice(1).join(' ') : content
        const preview = remainingContent.substring(0, 50) + (remainingContent.length > 50 ? '...' : '')

        // 格式化日期 MM/dd
        const monthStr = (month).toString().padStart(2, '0')
        const dayStr = date.getDate().toString().padStart(2, '0')

        monthMap[month].push({
          ...d,
          title,
          preview,
          displayDate: `${monthStr}/${dayStr}`
        })
      })

      // 转换为数组并按月份倒序排列
      const monthGroups = Object.keys(monthMap)
        .map(month => ({
          month: parseInt(month),
          diaries: monthMap[month]
        }))
        .sort((a, b) => b.month - a.month)

      // 计算统计数据
      const totalWords = yearDiaries.reduce((sum, d) => sum + (d.content || '').length, 0)

      // 计算活跃天数（去重）
      const uniqueDays = new Set()
      yearDiaries.forEach(d => {
        const date = new Date(d.createTime)
        const dayStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
        uniqueDays.add(dayStr)
      })
      const totalDays = uniqueDays.size

      // 计算活跃百分比（活跃天数/当年已过天数）
      const now = new Date()
      const startOfYear = new Date(year, 0, 1)
      const daysInYear = Math.ceil((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1
      const activePercent = daysInYear > 0 ? Math.round((totalDays / daysInYear) * 100) : 0

      this.setData({
        monthGroups,
        totalDiaries: yearDiaries.length,
        totalWords,
        totalDays,
        activePercent: Math.min(activePercent, 100),
        isLoading: false
      })
    } catch (error) {
      console.error('加载归档数据失败:', error)
      this.setData({
        monthGroups: [],
        totalDiaries: 0,
        isLoading: false
      })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 跳转日记详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/diary/detail?id=${id}`
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 分享
  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 转发配置
  onShareAppMessage() {
    return {
      title: '时光归档 - 记录生活点滴',
      path: '/pages/archive/index'
    }
  }
})

