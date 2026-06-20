const App = getApp()
const { diary, checkin, goal } = require('../../utils/db.js')

Page({
  data: {
    userInfo: {},
    diaryCount: 0,
    checkinCount: 0,
    goalCount: 0,
    isLoading: false,
    motivation: {
      title: '今日寄语',
      text: '每一天都是新的开始，用心记录生活的点滴。'
    }
  },

  onLoad() {
    this.initUser()
    this.loadStats()
    this.setMotivation()
  },

  onShow() {
    this.loadStats()
  },

  initUser() {
    try {
      // 先尝试从本地缓存读取用户信息
      const cachedUserInfo = this.loadUserInfoFromCache()
      if (cachedUserInfo) {
        this.setData({ userInfo: cachedUserInfo })
        return
      }

      const userInfo = App.getUserInfo()
      // getUserInfo 返回 Promise
      if (userInfo && typeof userInfo.then === 'function') {
        userInfo.then(info => {
          const finalInfo = info || { nickName: '用户', avatarUrl: '' }
          this.setData({ userInfo: finalInfo })
          this.saveUserInfo(finalInfo)
        }).catch(() => {
          const defaultInfo = { nickName: '用户', avatarUrl: '' }
          this.setData({ userInfo: defaultInfo })
          this.saveUserInfo(defaultInfo)
        })
      } else {
        const finalInfo = userInfo || { nickName: '用户', avatarUrl: '' }
        this.setData({ userInfo: finalInfo })
        this.saveUserInfo(finalInfo)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      const defaultInfo = { nickName: '用户', avatarUrl: '' }
      this.setData({ userInfo: defaultInfo })
      this.saveUserInfo(defaultInfo)
    }
  },

  loadStats() {
    if (this.data.isLoading) return
    this.setData({ isLoading: true })

    try {
      const openid = App.getOpenid()

      const diaries = diary.getAll(openid) || []
      const checkins = checkin.getAll(openid) || []
      const goals = goal.getAll(openid) || []

      this.setData({
        diaryCount: diaries.length,
        checkinCount: checkins.length,
        goalCount: goals.length,
        isLoading: false
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
      this.setData({
        diaryCount: 0,
        checkinCount: 0,
        goalCount: 0,
        isLoading: false
      })
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
  },

  // 选择头像
  chooseAvatar() {
    wx.showActionSheet({
      itemList: ['从相册选择', '拍照'],
      success: (res) => {
        const sourceType = res.tapIndex === 0 ? ['album'] : ['camera']
        wx.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: sourceType,
          success: (chooseRes) => {
            const tempFilePath = chooseRes.tempFilePaths[0]
            // 更新本地用户信息
            const userInfo = this.data.userInfo
            userInfo.avatarUrl = tempFilePath
            this.setData({ userInfo })
            // 保存到本地存储
            this.saveUserInfo(userInfo)
            wx.showToast({ title: '头像已更新', icon: 'success' })
          },
          fail: (err) => {
            console.error('选择头像失败:', err)
            wx.showToast({ title: '选择失败', icon: 'none' })
          }
        })
      }
    })
  },

  // 编辑昵称
  editNickname() {
    wx.showModal({
      title: '修改昵称',
      content: '',
      editable: true,
      placeholderText: '请输入昵称',
      success: (res) => {
        if (res.confirm && res.content.trim()) {
          const newNickname = res.content.trim()
          if (newNickname.length > 20) {
            wx.showToast({ title: '昵称不能超过20个字符', icon: 'none' })
            return
          }
          const userInfo = this.data.userInfo
          userInfo.nickName = newNickname
          this.setData({ userInfo })
          this.saveUserInfo(userInfo)
          wx.showToast({ title: '昵称已更新', icon: 'success' })
        }
      }
    })
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
  }
})
