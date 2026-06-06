const App = getApp()
const { goal, diary } = require('../../utils/db.js')
const { formatDate, formatDateCN } = require('../../utils/util.js')

Page({
  data: {
    goal: null,
    progress: 0,
    today: '',
    isCheckedToday: false,
    showEditModal: false,
    editGoal: {
      title: '',
      description: '',
      targetDays: ''
    },
    recentCheckins: [],
    allCheckinDates: [],
    totalDiaries: 0,
    hasLoaded: false,
    isLoading: false
  },

  onLoad(options) {
    this.goalId = options.id
    this.setData({ today: formatDate(new Date()) })
    this.loadData()
  },

  onShow() {
    if (this.goalId) {
      this.loadData()
    }
  },

  loadData() {
    if (this.data.isLoading) return
    this.setData({ isLoading: true })

    try {
      const goalData = goal.getById(this.goalId)
      if (!goalData) {
        wx.showToast({ title: '目标不存在', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 1500)
        return
      }

      const checkedDates = goalData.checkinDates || []
      const sortedDates = [...checkedDates].sort((a, b) => new Date(b) - new Date(a))
      const recentDates = sortedDates.slice(0, 7).map(dateStr => ({
        date: dateStr,
        dateCN: formatDateCN(new Date(dateStr)),
        weekday: this.getWeekDay(dateStr)
      }))

      const openid = App.getOpenid()
      const diaries = diary.getAll(openid) || []

      const progress = Math.min(Math.round((goalData.completedDays / goalData.targetDays) * 100), 100)

      this.setData({
        goal: goalData,
        progress,
        isCheckedToday: checkedDates.includes(this.data.today),
        recentCheckins: recentDates,
        allCheckinDates: sortedDates,
        totalDiaries: diaries.length,
        hasLoaded: true,
        isLoading: false
      })
    } catch (error) {
      this.setData({ isLoading: false, hasLoaded: true })
      console.error('加载目标详情失败:', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  getWeekDay(dateStr) {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekDays[new Date(dateStr).getDay()]
  },

  doCheckIn() {
    if (this.data.isCheckedToday || this.data.goal.status === 'completed') {
      return
    }

    wx.showLoading({ title: '打卡中...' })

    try {
      const result = goal.checkIn(this.goalId, this.data.today)
      wx.hideLoading()

      if (result.success) {
        wx.showToast({ title: '打卡成功', icon: 'success' })
        this.loadData()
      } else {
        wx.showToast({ title: result.message || '打卡失败', icon: 'none' })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('打卡失败:', error)
      wx.showToast({ title: '打卡失败', icon: 'none' })
    }
  },

  undoCheckIn(e) {
    const dateStr = e.currentTarget.dataset.date

    wx.showModal({
      title: '确认撤销',
      content: `确定要撤销 ${formatDateCN(new Date(dateStr))} 的打卡吗？`,
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          try {
            const result = goal.undoCheckIn(this.goalId, dateStr)
            wx.hideLoading()
            if (result.success) {
              wx.showToast({ title: '已撤销', icon: 'success' })
              this.loadData()
            } else {
              wx.showToast({ title: '撤销失败', icon: 'none' })
            }
          } catch (error) {
            wx.hideLoading()
            console.error('撤销失败:', error)
            wx.showToast({ title: '撤销失败', icon: 'none' })
          }
        }
      }
    })
  },

  showEditModal() {
    this.setData({
      showEditModal: true,
      editGoal: {
        title: this.data.goal.title,
        description: this.data.goal.description || '',
        targetDays: this.data.goal.targetDays.toString()
      }
    })
  },

  hideEditModal() {
    this.setData({ showEditModal: false })
  },

  onEditTitleInput(e) {
    this.setData({ 'editGoal.title': e.detail.value })
  },

  onEditDescInput(e) {
    this.setData({ 'editGoal.description': e.detail.value })
  },

  onEditDaysInput(e) {
    this.setData({ 'editGoal.targetDays': e.detail.value })
  },

  saveEdit() {
    if (!this.data.editGoal.title.trim()) {
      wx.showToast({ title: '请输入目标名称', icon: 'none' })
      return
    }

    const targetDays = parseInt(this.data.editGoal.targetDays)
    if (!targetDays || targetDays <= 0) {
      wx.showToast({ title: '请输入有效的天数', icon: 'none' })
      return
    }

    if (targetDays < this.data.goal.completedDays) {
      wx.showToast({ title: `天数不能小于已完成的 ${this.data.goal.completedDays} 天`, icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    try {
      goal.update(this.goalId, {
        title: this.data.editGoal.title,
        description: this.data.editGoal.description,
        targetDays: targetDays
      })

      wx.hideLoading()
      this.setData({ showEditModal: false })
      wx.showToast({ title: '保存成功', icon: 'success' })
      this.loadData()
    } catch (error) {
      wx.hideLoading()
      console.error('保存失败:', error)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  deleteGoal() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个目标吗？所有打卡记录将被清除，此操作不可撤销。',
      confirmText: '删除',
      confirmColor: '#FF6B6B',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          try {
            goal.delete(this.goalId)
            wx.hideLoading()
            wx.showToast({ title: '已删除', icon: 'success' })
            setTimeout(() => wx.navigateBack(), 1000)
          } catch (error) {
            wx.hideLoading()
            console.error('删除失败:', error)
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  goWriteDiary() {
    wx.navigateTo({
      url: '/pages/diary/edit'
    })
  },

  goBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({
          url: '/pages/checkin/index'
        })
      }
    })
  },

  stopPropagation() {}
})
