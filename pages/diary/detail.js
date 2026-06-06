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
    isLoaded: false
  },

  onLoad(options) {
    const id = options.id
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.diaryId = id
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

      comment.add({
        diaryId: this.diaryId,
        userId: openid,
        content: this.data.commentText.trim()
      })

      this.setData({ commentText: '' })
      this.loadData()

      wx.hideLoading()
      wx.showToast({ title: '发送成功', icon: 'success' })
    } catch (error) {
      wx.hideLoading()
      console.error('发送评论失败:', error)
      wx.showToast({ title: '发送失败', icon: 'none' })
    }
  },

  focusComment() {
    const input = this.selectComponent('.comment-input')
    if (input) {
      input.focus()
    }
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
  }
})
