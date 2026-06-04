const App = getApp()
const { diary } = require('../../utils/db.js')

Page({
  data: {
    content: '',
    images: []
  },

  onContentInput(e) {
    this.setData({
      content: e.detail.value
    })
  },

  chooseImage() {
    const maxCount = 9 - this.data.images.length
    
    wx.chooseImage({
      count: maxCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths
        
        this.setData({
          images: [...this.data.images, ...tempFilePaths]
        })
      },
      fail: (err) => {
        console.error('选择图片失败:', err)
      }
    })
  },

  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      success: (res) => {
        if (res.confirm) {
          images.splice(index, 1)
          this.setData({ images })
        }
      }
    })
  },

  async submitDiary() {
    if (!this.data.content.trim()) {
      wx.showToast({
        title: '请输入日记内容',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '保存中...'
    })

    try {
      const openid = await App.getOpenid()
      
      await diary.add({
        userId: openid,
        content: this.data.content,
        images: this.data.images
      })

      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (error) {
      wx.hideLoading()
      console.error('保存日记失败:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  }
})