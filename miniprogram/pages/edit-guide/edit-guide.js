// 编辑攻略页
const db = wx.cloud.database()

Page({
  data: {
    title: '',
    content: '',
    foods: [],
    imageList: [],
    originalImages: [],
    saving: false
  },

  onLoad(options) {
    if (options.id) {
      this.guideId = options.id
      this.loadGuide()
    }
  },

  loadGuide() {
    wx.showLoading({ title: '加载中' })
    db.collection('guides').doc(this.guideId).get()
      .then(res => {
        const guide = res.data
        this.setData({
          title: guide.title || '',
          content: guide.content || '',
          foods: (guide.foods || []).map(f => ({ name: f.name || '', reason: f.reason || '' })),
          imageList: guide.images || [],
          originalImages: guide.images || []
        })
        wx.hideLoading()
      })
      .catch(err => {
        wx.hideLoading()
        console.error('加载失败', err)
        wx.showToast({ title: '加载失败', icon: 'none' })
      })
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  // 美食操作
  addFood() {
    this.setData({ foods: this.data.foods.concat({ name: '', reason: '' }) })
  },

  deleteFood(e) {
    const foods = this.data.foods
    foods.splice(e.currentTarget.dataset.index, 1)
    this.setData({ foods })
  },

  onFoodNameInput(e) {
    const foods = this.data.foods
    foods[e.currentTarget.dataset.index].name = e.detail.value
    this.setData({ foods })
  },

  onFoodReasonInput(e) {
    const foods = this.data.foods
    foods[e.currentTarget.dataset.index].reason = e.detail.value
    this.setData({ foods })
  },

  // 图片操作
  chooseImage() {
    const remaining = 9 - this.data.imageList.length
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: res => {
        const tempFiles = res.tempFiles.map(f => f.tempFilePath)
        this.setData({ imageList: this.data.imageList.concat(tempFiles) })
      }
    })
  },

  previewImage(e) {
    wx.previewImage({
      current: this.data.imageList[e.currentTarget.dataset.index],
      urls: this.data.imageList
    })
  },

  deleteImage(e) {
    const imageList = this.data.imageList
    imageList.splice(e.currentTarget.dataset.index, 1)
    this.setData({ imageList })
  },

  // 上传新图片（非云存储的本地图片）
  uploadNewImages() {
    const { imageList, originalImages } = this.data
    // 找出新加的本地图片（非 cloud:// 开头）
    const newImages = imageList.filter(img => !img.startsWith('cloud://'))
    if (newImages.length === 0) return Promise.resolve([])

    const tasks = newImages.map((filePath, index) => {
      const cloudPath = 'guide-images/' + Date.now() + '-' + index + filePath.match(/\.\w+$/)[0]
      return wx.cloud.uploadFile({ cloudPath, filePath }).then(res => res.fileID)
    })
    return Promise.all(tasks)
  },

  // 保存
  onSave() {
    const { title } = this.data
    if (!title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' })
      return
    }
    if (this.data.saving) return
    this.setData({ saving: true })

    this.uploadNewImages().then(newFileIds => {
      // 合并图片：保留原有的云图片 + 新上传的
      const { imageList, originalImages } = this.data
      const keptOriginals = imageList.filter(img => img.startsWith('cloud://'))
      const allImages = keptOriginals.concat(newFileIds)

      const validFoods = this.data.foods.filter(f => f.name.trim())

      return db.collection('guides').doc(this.guideId).update({
        data: {
          title: this.data.title.trim(),
          content: this.data.content.trim(),
          foods: validFoods,
          images: allImages
        }
      })
    }).then(() => {
      this.setData({ saving: false })
      wx.showToast({ title: '保存成功 ♡', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }).catch(err => {
      console.error('保存失败', err)
      this.setData({ saving: false })
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  }
})
