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
      
      // getUserInfo 返回 Promise，需要正确处理
      App.getUserInfo().then(userInfo => {
        const existingUser = user.get(openid)
        if (!existingUser || existingUser._openid === 'mock_openid') {
          user.add({
            _openid: openid,
            nickName: userInfo.nickName || '用户',
            avatarUrl: userInfo.avatarUrl || ''
          })
        }
        this.setData({ userInfo })
      }).catch(() => {
        // 用户未授权，使用默认信息
        this.setData({
          userInfo: { nickName: '用户', avatarUrl: '' }
        })
      })
    } catch (error) {
      console.error('用户初始化失败:', error)
      this.setData({
        userInfo: { nickName: '用户', avatarUrl: '' }
      })
    }
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
