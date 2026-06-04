const App = getApp()
const { diary, comment } = require('../../utils/db.js')
const { formatDate, formatTime } = require('../../utils/util.js')

Page({
  data: {
    diary: null,
    commentList: [],
    commentText: '',
    liked: false
  },

  async onLoad(options) {
    const id = options?.id
    if (!id) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      return
    }
    
    await this.loadDiary(id)
    await this.loadComments(id)
  },

  async loadDiary(id) {
    try {
      const diaryData = await diary.getById(id)
      const openid = await App.getOpenid()
      
      this.setData({
        diary: diaryData,
        liked: diaryData.likedUsers?.includes(openid) || false
      })
    } catch (error) {
      console.error('加载日记失败:', error)
    }
  },

  async loadComments(diaryId) {
    try {
      const comments = await comment.getByDiaryId(diaryId)
      this.setData({ commentList: comments })
    } catch (error) {
      console.error('加载评论失败:', error)
    }
  },

  onCommentInput(e) {
    this.setData({
      commentText: e.detail.value
    })
  },

  async handleLike() {
    if (!this.data.diary) return

    wx.showLoading({
      title: '处理中...'
    })

    try {
      const openid = await App.getOpenid()
      const result = await diary.like(this.data.diary._id, openid)
      
      this.setData({
        liked: result.liked,
        'diary.likes': result.liked ? this.data.diary.likes + 1 : this.data.diary.likes - 1
      })

      wx.hideLoading()
    } catch (error) {
      wx.hideLoading()
      console.error('点赞失败:', error)
    }
  },

  async submitComment() {
    if (!this.data.commentText.trim()) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '发送中...'
    })

    try {
      const openid = await App.getOpenid()
      
      await comment.add({
        diaryId: this.data.diary._id,
        userId: openid,
        content: this.data.commentText
      })

      this.setData({
        commentText: ''
      })

      await this.loadComments(this.data.diary._id)

      wx.hideLoading()
      wx.showToast({
        title: '发送成功',
        icon: 'success'
      })
    } catch (error) {
      wx.hideLoading()
      console.error('发送评论失败:', error)
      wx.showToast({
        title: '发送失败',
        icon: 'none'
      })
    }
  },

  focusComment() {
    const input = this.selectComponent('.comment-input')
    if (input) {
      input.focus()
    }
  },

  handleShare() {
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none'
    })
  },

  previewImage(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.diary.images[index],
      urls: this.data.diary.images
    })
  },

  formatDate(date) {
    return formatDate(new Date(date))
  },

  formatTime(date) {
    return formatTime(new Date(date))
  }
})