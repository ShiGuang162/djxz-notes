App({
  onLaunch: function () {
    this.globalData = {}
  },

  globalData: {
    userInfo: null,
    openid: null
  },

  getUserInfo: function() {
    return new Promise((resolve, reject) => {
      if (this.globalData.userInfo) {
        resolve(this.globalData.userInfo)
      } else {
        // wx.getUserProfile 已废弃，使用默认用户信息
        const defaultUserInfo = {
          nickName: '用户',
          avatarUrl: ''
        }
        this.globalData.userInfo = defaultUserInfo
        resolve(defaultUserInfo)
      }
    })
  },

  getOpenid: function() {
    if (!this.globalData.openid) {
      this.globalData.openid = 'mock_openid'
    }
    return this.globalData.openid
  }
})