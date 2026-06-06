const App = getApp()
const { diary } = require('../../utils/db.js')

Page({
  data: {
    content: '',
    images: [],
    isSubmitting: false
  },

  goBack() {
    wx.navigateBack()
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  chooseImage() {
    const maxCount = 9 - this.data.images.length
    if (maxCount <= 0) {
      wx.showToast({ title: '最多添加9张图片', icon: 'none' })
      return
    }

    wx.chooseImage({
      count: maxCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          images: [...this.data.images, ...res.tempFilePaths]
        })
      },
      fail: (err) => {
        console.error('选择图片失败:', err)
        wx.showToast({ title: '选择图片失败', icon: 'none' })
      }
    })
  },

  deleteImage(e) {
    const index = e.currentTarget.dataset.index

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      success: (res) => {
        if (res.confirm) {
          const images = [...this.data.images]
          images.splice(index, 1)
          this.setData({ images })
        }
      }
    })
  },

  submitDiary() {
    if (this.data.isSubmitting) return

    if (!this.data.content.trim()) {
      wx.showToast({ title: '请输入日记内容', icon: 'none' })
      return
    }

    this.setData({ isSubmitting: true })
    wx.showLoading({ title: '保存中...' })

    try {
      const openid = App.getOpenid()

      diary.add({
        userId: openid,
        content: this.data.content,
        images: this.data.images
      })

      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })

      setTimeout(() => {
        wx.navigateBack()
      }, 1000)
    } catch (error) {
      wx.hideLoading()
      this.setData({ isSubmitting: false })
      console.error('保存日记失败:', error)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  }
})
