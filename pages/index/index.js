const App = getApp()
const { diary, checkin, goal, user } = require('../../utils/db.js')
const { formatDate } = require('../../utils/util.js')

Page({
  data: {
    userInfo: {},
    diaryList: [],
    goalList: [],
    continuousDays: 0,
    greeting: '早上好'
  },

  async onLoad() {
    await this.initUser()
    await this.loadData()
    this.setGreeting()
  },

  onShow() {
    this.loadData()
  },

  setGreeting() {
    const hour = new Date().getHours()
    let greeting = '早上好'
    if (hour >= 12 && hour < 18) {
      greeting = '下午好'
    } else if (hour >= 18) {
      greeting = '晚上好'
    }
    this.setData({ greeting })
  },

  async initUser() {
    try {
      const openid = await App.getOpenid()
      const userInfo = await App.getUserInfo()
      
      let existingUser = await user.get(openid)
      if (!existingUser) {
        await user.add({
          _openid: openid,
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl
        })
      }
      
      this.setData({ userInfo })
    } catch (error) {
      console.error('用户初始化失败:', error)
    }
  },

  async loadData() {
    try {
      const openid = await App.getOpenid()
      
      const [diaries, goals, days] = await Promise.all([
        diary.getAll(openid),
        goal.getAll(openid),
        checkin.getContinuousDays(openid)
      ])
      
      this.setData({
        diaryList: diaries,
        goalList: goals.slice(0, 5),
        continuousDays: days
      })
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  },

  goToWrite() {
    wx.navigateTo({
      url: '/pages/diary/edit'
    })
  },

  goToCheckin() {
    wx.switchTab({
      url: '/pages/checkin/index'
    })
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/diary/detail?id=${id}`
    })
  },

  goToGoals() {
    wx.switchTab({
      url: '/pages/checkin/index'
    })
  },

  goToGoalDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({
      title: '目标详情功能开发中',
      icon: 'none'
    })
  },

  formatDate(date) {
    return formatDate(new Date(date))
  }
})