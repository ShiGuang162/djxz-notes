const App = getApp()
const { diary, checkin, goal } = require('../../utils/db.js')

Page({
  data: {
    userInfo: {},
    diaryCount: 0,
    checkinCount: 0,
    goalCount: 0,
    motivation: {
      title: '今日寄语',
      text: '每一天都是新的开始，用心记录生活的点滴。'
    }
  },

  async onLoad() {
    await this.initUser()
    await this.loadStats()
    this.setMotivation()
  },

  onShow() {
    this.loadStats()
  },

  async initUser() {
    try {
      const userInfo = await App.getUserInfo()
      this.setData({ userInfo })
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  },

  async loadStats() {
    try {
      const openid = await App.getOpenid()
      
      const [diaries, checkins, goals] = await Promise.all([
        diary.getAll(openid),
        checkin.getAll(openid),
        goal.getAll(openid)
      ])
      
      this.setData({
        diaryCount: diaries.length,
        checkinCount: checkins.length,
        goalCount: goals.length
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  },

  setMotivation() {
    const motivations = [
      { title: '今日寄语', text: '每一天都是新的开始，用心记录生活的点滴。' },
      { title: '今日寄语', text: '坚持就是胜利，每一天的努力都值得被记录。' },
      { title: '今日寄语', text: '生活不止眼前的苟且，还有诗和远方。' },
      { title: '今日寄语', text: '记录生活，让美好永不褪色。' },
      { title: '今日寄语', text: '每一天都是独一无二的，珍惜当下。' },
      { title: '今日寄语', text: '相信自己，你比想象中更强大。' },
      { title: '今日寄语', text: '小目标积累成大成就，加油！' }
    ]
    
    const today = new Date().getDate()
    const index = (today - 1) % motivations.length
    this.setData({ motivation: motivations[index] })
  },

  goToDiaryList() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  goToArchive() {
    wx.showToast({
      title: '归档功能开发中',
      icon: 'none'
    })
  },

  goToSettings() {
    wx.showToast({
      title: '设置功能开发中',
      icon: 'none'
    })
  },

  goToAbout() {
    wx.showModal({
      title: '关于我们',
      content: '我的博客 v1.0.0\n\n一个记录生活点滴的小程序，支持日记、打卡和目标管理功能。',
      showCancel: false
    })
  }
})