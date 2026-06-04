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
        wx.getUserProfile({
          desc: '用于完善会员资料',
          success: (res) => {
            this.globalData.userInfo = res.userInfo
            resolve(res.userInfo)
          },
          fail: (err) => {
            console.log('用户未授权，使用默认用户信息')
            resolve({
              nickName: '用户',
              avatarUrl: ''
            })
          }
        })
      }
    })
  },

  getOpenid: function() {
    return new Promise((resolve) => {
      if (this.globalData.openid) {
        resolve(this.globalData.openid)
      } else {
        this.globalData.openid = 'mock_openid'
        resolve('mock_openid')
      }
    })
  }
})