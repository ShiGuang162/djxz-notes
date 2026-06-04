App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'your-env-id',
        traceUser: true,
      })
    }

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
            reject(err)
          }
        })
      }
    })
  },

  getOpenid: function() {
    return new Promise((resolve, reject) => {
      if (this.globalData.openid) {
        resolve(this.globalData.openid)
      } else {
        wx.cloud.callFunction({
          name: 'login',
          success: (res) => {
            this.globalData.openid = res.result.openid
            resolve(res.result.openid)
          },
          fail: (err) => {
            reject(err)
          }
        })
      }
    })
  }
})