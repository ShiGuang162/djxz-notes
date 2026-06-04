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
      console.log('首页加载数据，userId:', openid)
      
      const [diaries, goals, days] = await Promise.all([
        diary.getAll(openid),
        goal.getAll(openid),
        checkin.getContinuousDays(openid)
      ])
      
      console.log('加载的日记列表:', diaries)
      console.log('日记数量:', diaries.length)
      
      // 预处理日记数据，格式化日期
      const formattedDiaries = diaries.map(diary => {
        const date = new Date(diary.createTime)
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        const hour = date.getHours().toString().padStart(2, '0')
        const minute = date.getMinutes().toString().padStart(2, '0')
        return {
          ...diary,
          formattedTime: `${year}-${month}-${day} ${hour}:${minute}`
        }
      })
      
      console.log('格式化后的日记:', formattedDiaries)
      
      this.setData({
        diaryList: formattedDiaries,
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

  viewAllDiaries() {
    wx.showToast({
      title: '日记列表功能开发中',
      icon: 'none'
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
    console.log('formatDate 接收到的日期:', date)
    if (!date) return '未知日期'
    const dateObj = new Date(date)
    console.log('格式化后的日期对象:', dateObj)
    const year = dateObj.getFullYear()
    const month = dateObj.getMonth() + 1
    const day = dateObj.getDate()
    const hour = dateObj.getHours()
    const minute = dateObj.getMinutes()
    
    const formatNumber = n => n.toString().padStart(2, '0')
    const result = `${year}-${formatNumber(month)}-${formatNumber(day)} ${formatNumber(hour)}:${formatNumber(minute)}`
    console.log('格式化结果:', result)
    return result
  }
})