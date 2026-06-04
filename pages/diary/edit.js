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
      success: async (res) => {
        const tempFilePaths = res.tempFilePaths
        const cloudPaths = []
        
        for (let i = 0; i < tempFilePaths.length; i++) {
          const filePath = tempFilePaths[i]
          const cloudPath = `diary/${Date.now()}-${i}.png`
          
          try {
            const uploadResult = await wx.cloud.uploadFile({
              cloudPath,
              filePath
            })
            cloudPaths.push(uploadResult.fileID)
          } catch (error) {
            console.error('图片上传失败:', error)
            wx.showToast({
              title: '图片上传失败',
              icon: 'none'
            })
            return
          }
        }
        
        this.setData({
          images: [...this.data.images, ...cloudPaths]
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
    const deletedImage = images[index]
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await wx.cloud.deleteFile({
              fileList: [deletedImage]
            })
            
            images.splice(index, 1)
            this.setData({ images })
          } catch (error) {
            console.error('删除图片失败:', error)
          }
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