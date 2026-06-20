const App = getApp()
const { diary, comment } = require('../../utils/db.js')
const { formatTime } = require('../../utils/util.js')

Page({
  data: {
    diary: null,
    commentList: [],
    formattedComments: [],
    commentText: '',
    liked: false,
    diaryTime: '',
    isLoaded: false,
    userInfo: {}
  },

  onLoad(options) {
    const id = options.id
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.diaryId = id
    this.initUser()
    this.loadData()
  },

  onShow() {
    if (this.diaryId) {
      this.loadData()
    }
  },

  loadData() {
    try {
      const diaryData = diary.getById(this.diaryId)
      if (!diaryData) {
        wx.showToast({ title: '日记不存在', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 1500)
        return
      }

      const openid = App.getOpenid()
      const comments = comment.getByDiaryId(this.diaryId) || []
      const formattedComments = (comments || []).map(c => ({
        ...c,
        formattedTime: formatTime(new Date(c.createTime))
      }))

      this.setData({
        diary: diaryData,
        liked: diaryData.likedUsers && diaryData.likedUsers.includes(openid),
        formattedComments,
        commentList: comments,
        diaryTime: formatTime(new Date(diaryData.createTime)),
        isLoaded: true
      })
    } catch (error) {
      console.error('加载数据失败:', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value })
  },

  handleLike() {
    if (!this.data.diary) return

    try {
      const openid = App.getOpenid()
      const result = diary.like(this.data.diary._id, openid)

      const currentLikes = this.data.diary.likes || 0
      const newLikes = result.liked ? currentLikes + 1 : Math.max(0, currentLikes - 1)

      this.setData({
        liked: result.liked,
        'diary.likes': newLikes
      })
    } catch (error) {
      console.error('点赞失败:', error)
    }
  },

  submitComment() {
    if (!this.data.commentText.trim()) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' })
      return
    }

    wx.showLoading({ title: '发送中...' })

    try {
      const openid = App.getOpenid()

      const result = comment.add({
        diaryId: this.diaryId,
        userId: openid,
        content: this.data.commentText.trim()
      })

      if (result.success) {
        this.setData({ commentText: '' })
        this.loadData()
        wx.hideLoading()
        wx.showToast({ title: '发送成功', icon: 'success' })
      } else {
        wx.hideLoading()
        wx.showToast({ title: result.message || '发送失败', icon: 'none' })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('发送评论失败:', error)
      wx.showToast({ title: '发送失败', icon: 'none' })
    }
  },

  focusComment() {
    // 使用 wx.createSelectorQuery 获取 input 节点并聚焦
    const query = wx.createSelectorQuery().in(this)
    query.select('.comment-input').boundingClientRect()
    query.selectViewport().scrollOffset()
    query.exec((res) => {
      if (res[0]) {
        // 滚动到输入框位置
        wx.pageScrollTo({
          selector: '.comment-input',
          duration: 300
        })
      }
    })
  },

  handleShare() {
    wx.showToast({ title: '分享功能开发中', icon: 'none' })
  },

  previewImage(e) {
    const index = e.currentTarget.dataset.index
    if (!this.data.diary || !this.data.diary.images || this.data.diary.images.length === 0) return

    wx.previewImage({
      current: this.data.diary.images[index],
      urls: this.data.diary.images
    })
  },

  initUser() {
    try {
      const cachedUserInfo = this.loadUserInfoFromCache()
      if (cachedUserInfo) {
        this.setData({ userInfo: cachedUserInfo })
        return
      }

      const userInfo = App.getUserInfo()
      if (userInfo && typeof userInfo.then === 'function') {
        userInfo.then(info => {
          const finalInfo = info || { nickName: '记录者', avatarUrl: '' }
          this.setData({ userInfo: finalInfo })
          this.saveUserInfo(finalInfo)
        }).catch(() => {
          const defaultInfo = { nickName: '记录者', avatarUrl: '' }
          this.setData({ userInfo: defaultInfo })
          this.saveUserInfo(defaultInfo)
        })
      } else {
        const finalInfo = userInfo || { nickName: '记录者', avatarUrl: '' }
        this.setData({ userInfo: finalInfo })
        this.saveUserInfo(finalInfo)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      const defaultInfo = { nickName: '记录者', avatarUrl: '' }
      this.setData({ userInfo: defaultInfo })
      this.saveUserInfo(defaultInfo)
    }
  },

  saveUserInfo(userInfo) {
    try {
      const key = 'user_info_cache'
      wx.setStorageSync(key, JSON.stringify(userInfo))
    } catch (error) {
      console.error('保存用户信息失败:', error)
    }
  },

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
