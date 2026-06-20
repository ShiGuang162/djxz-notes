const App = getApp()
const { diary, checkin, goal, user } = require('../../utils/db.js')
const { formatTime } = require('../../utils/util.js')

Page({
  data: {
    userInfo: {},
    diaryList: [],
    goalList: [],
    continuousDays: 0,
    greeting: '早上好',
    isLoading: false
  },

  onLoad() {
    this.initUser()
    this.loadData()
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

  initUser() {
    try {
      const openid = App.getOpenid()
      
      // 先尝试从本地缓存读取用户信息
      const cachedUserInfo = this.loadUserInfoFromCache()
      if (cachedUserInfo) {
        this.setData({ userInfo: cachedUserInfo })
        return
      }
      
      // getUserInfo 返回 Promise，需要正确处理
      App.getUserInfo().then(userInfo => {
        const existingUser = user.get(openid)
        if (!existingUser || existingUser._openid === 'mock_openid') {
          user.add({
            _openid: openid,
            nickName: userInfo.nickName || '记录者',
            avatarUrl: userInfo.avatarUrl || ''
          })
        }
        this.setData({ userInfo })
        this.saveUserInfo(userInfo)
      }).catch(() => {
        const defaultInfo = { nickName: '记录者', avatarUrl: '' }
        this.setData({ userInfo: defaultInfo })
        this.saveUserInfo(defaultInfo)
      })
    } catch (error) {
      console.error('获取用户信息失败:', error)
      const defaultInfo = { nickName: '记录者', avatarUrl: '' }
      this.setData({ userInfo: defaultInfo })
      this.saveUserInfo(defaultInfo)
    }
  },

  // 保存用户信息到本地存储
  saveUserInfo(userInfo) {
    try {
      const key = 'user_info_cache'
      wx.setStorageSync(key, JSON.stringify(userInfo))
    } catch (error) {
      console.error('保存用户信息失败:', error)
    }
  },

  // 从本地存储读取用户信息
  loadUserInfoFromCache() {
    try {
      const key = 'user_info_cache'
      const cached = wx.getStorageSync(key)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (error) {
      console.error('读取用户信息缓存失败:', error)
    }
    return null
  },

  loadData() {
    if (this.data.isLoading) return
    this.setData({ isLoading: true })

    try {
      const openid = App.getOpenid()
      const diaries = diary.getAll(openid) || []
      const goals = goal.getAll(openid) || []
      const days = checkin.getContinuousDays(openid) || 0

      const formattedDiaries = (diaries || []).map(d => ({
        ...d,
        formattedTime: formatTime(new Date(d.createTime))
      }))

      this.setData({
        diaryList: formattedDiaries,
        goalList: (goals || []).slice(0, 5),
        continuousDays: days
      })
    } catch (error) {
      console.error('加载数据失败:', error)
      this.setData({
        diaryList: [],
        goalList: [],
        continuousDays: 0
      })
    } finally {
      this.setData({ isLoading: false })
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
    wx.navigateTo({
      url: `/pages/goal/detail?id=${id}`
    })
  }
})
