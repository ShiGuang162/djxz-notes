const App = getApp()
const { checkin, goal } = require('../../utils/db.js')
const { formatDate } = require('../../utils/util.js')

Page({
  data: {
    continuousDays: 0,
    totalDays: 0,
    monthDays: 0,
    hasCheckedIn: false,
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    calendarDays: [],
    goalList: [],
    showGoalModal: false,
    newGoal: {
      title: '',
      description: '',
      targetDays: ''
    },
    isLoading: false
  },

  onLoad() {
    this.loadData()
    this.generateCalendar()
  },

  onShow() {
    if (!this.data.showGoalModal) {
      this.loadData()
      this.generateCalendar()
    }
  },

  loadData() {
    if (this.data.isLoading) return
    this.setData({ isLoading: true })

    try {
      const openid = App.getOpenid()
      const today = formatDate(new Date())

      const continuous = checkin.getContinuousDays(openid) || 0
      const allCheckins = checkin.getAll(openid) || []
      const monthCheckins = checkin.getMonthCheckins(openid, this.data.currentYear, this.data.currentMonth) || []
      const goals = goal.getAll(openid) || []
      const todayCheckin = checkin.getByDate(openid, today)

      this.setData({
        continuousDays: continuous || 0,
        totalDays: (allCheckins || []).length,
        monthDays: (monthCheckins || []).length,
        hasCheckedIn: !!todayCheckin,
        goalList: goals || [],
        checkedDates: (monthCheckins || []).map(c => c.checkDate)
      })
    } catch (error) {
      console.error('加载数据失败:', error)
      this.setData({
        continuousDays: 0,
        totalDays: 0,
        monthDays: 0,
        hasCheckedIn: false,
        goalList: [],
        checkedDates: []
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  generateCalendar() {
    const year = this.data.currentYear
    const month = this.data.currentMonth

    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()
    const startWeekDay = firstDay.getDay()

    const today = new Date()
    const todayStr = formatDate(today)
    const checkedDates = this.data.checkedDates || []

    const calendarDays = []

    for (let i = 0; i < startWeekDay; i++) {
      calendarDays.push({ day: '', date: '', checked: false, isToday: false })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`
      calendarDays.push({
        day: i,
        date: dateStr,
        checked: checkedDates.includes(dateStr),
        isToday: dateStr === todayStr
      })
    }

    this.setData({ calendarDays })
  },

  prevMonth() {
    let { currentYear, currentMonth } = this.data
    if (currentMonth === 1) {
      currentYear--
      currentMonth = 12
    } else {
      currentMonth--
    }
    this.setData({ currentYear, currentMonth })
    this.loadData()
  },

  nextMonth() {
    let { currentYear, currentMonth } = this.data
    if (currentMonth === 12) {
      currentYear++
      currentMonth = 1
    } else {
      currentMonth++
    }
    this.setData({ currentYear, currentMonth })
    this.loadData()
  },

  selectDay(e) {
    const date = e.currentTarget.dataset.date
    if (!date) return
    wx.showToast({
      title: date,
      icon: 'none'
    })
  },

  doCheckin() {
    if (this.data.hasCheckedIn) return

    wx.showLoading({ title: '打卡中...' })

    try {
      const openid = App.getOpenid()
      const today = formatDate(new Date())

      checkin.add({
        userId: openid,
        checkDate: today
      })

      wx.hideLoading()
      wx.showToast({ title: '打卡成功', icon: 'success' })
      this.loadData()
      this.generateCalendar()
    } catch (error) {
      wx.hideLoading()
      console.error('打卡失败:', error)
      wx.showToast({ title: '打卡失败', icon: 'none' })
    }
  },

  showAddGoalModal() {
    this.setData({ showGoalModal: true })
  },

  hideAddGoalModal() {
    this.setData({
      showGoalModal: false,
      newGoal: { title: '', description: '', targetDays: '' }
    })
  },

  handleCloseModal() {
    this.hideAddGoalModal()
  },

  stopPropagation() {},

  onGoalTitleInput(e) {
    this.setData({ 'newGoal.title': e.detail.value })
  },

  onGoalDescInput(e) {
    this.setData({ 'newGoal.description': e.detail.value })
  },

  onGoalDaysInput(e) {
    this.setData({ 'newGoal.targetDays': e.detail.value })
  },

  addGoal() {
    if (!this.data.newGoal.title.trim()) {
      wx.showToast({ title: '请输入目标名称', icon: 'none' })
      return
    }

    const days = parseInt(this.data.newGoal.targetDays)
    if (!days || days <= 0) {
      wx.showToast({ title: '请输入有效的天数', icon: 'none' })
      return
    }

    wx.showLoading({ title: '添加中...' })

    try {
      const openid = App.getOpenid()

      goal.add({
        userId: openid,
        title: this.data.newGoal.title,
        description: this.data.newGoal.description,
        targetDays: days
      })

      wx.hideLoading()
      this.hideAddGoalModal()
      wx.showToast({ title: '添加成功', icon: 'success' })
      this.loadData()
    } catch (error) {
      wx.hideLoading()
      console.error('添加目标失败:', error)
      wx.showToast({ title: '添加失败', icon: 'none' })
    }
  },

  completeGoalDay(e) {
    const goalId = e.currentTarget.dataset.id

    wx.showLoading({ title: '打卡中...' })

    try {
      const today = formatDate(new Date())
      const result = goal.checkIn(goalId, today)

      wx.hideLoading()
      if (result.success) {
        wx.showToast({ title: '打卡成功', icon: 'success' })
      } else {
        wx.showToast({ title: result.message || '打卡失败', icon: 'none' })
      }
      this.loadData()
    } catch (error) {
      wx.hideLoading()
      console.error('目标打卡失败:', error)
      wx.showToast({ title: '打卡失败', icon: 'none' })
    }
  },

  goToGoalDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/goal/detail?id=${id}`
    })
  }
})
