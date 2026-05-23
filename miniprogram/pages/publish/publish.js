// 发布攻略页
const db = wx.cloud.database()

Page({
  data: {
    title: '',
    region: '',
    regionArray: [],
    regionLevel: 'district',
    displayRegion: '',
    province: '',
    city: '',
    district: '',
    content: '',
    spotName: '',
    isPublic: true,
    foods: [],
    imageList: [],
    publishing: false
  },

  onLoad() { },

  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  onSpotNameInput(e) {
    this.setData({ spotName: e.detail.value })
  },

  togglePublic(e) {
    this.setData({ isPublic: e.detail.value })
  },

  // 省市区选择
  onRegionChange(e) {
    const values = e.detail.value
    const province = values[0]
    const city = values[1]
    const district = values[2]
    const region = province + ' ' + city + ' ' + district
    this.setData({
      regionArray: values,
      province,
      city,
      district,
      region,
      regionLevel: 'district',
      displayRegion: province + ' · ' + city + ' · ' + district
    })
  },

  // 切换精确度
  setRegionLevel(e) {
    const level = e.currentTarget.dataset.level
    const { province, city, district } = this.data
    let displayRegion
    if (level === 'city') {
      displayRegion = province + ' · ' + city
    } else {
      displayRegion = province + ' · ' + city + ' · ' + district
    }
    this.setData({ regionLevel: level, displayRegion })
  },

  // 添加美食推荐
  addFood() {
    const foods = this.data.foods.concat({ name: '', reason: '' })
    this.setData({ foods })
  },

  deleteFood(e) {
    const index = e.currentTarget.dataset.index
    const foods = this.data.foods
    foods.splice(index, 1)
    this.setData({ foods })
  },

  onFoodNameInput(e) {
    const index = e.currentTarget.dataset.index
    const foods = this.data.foods
    foods[index].name = e.detail.value
    this.setData({ foods })
  },

  onFoodReasonInput(e) {
    const index = e.currentTarget.dataset.index
    const foods = this.data.foods
    foods[index].reason = e.detail.value
    this.setData({ foods })
  },

  chooseImage() {
    const remaining = 9 - this.data.imageList.length
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: res => {
        const tempFiles = res.tempFiles.map(f => f.tempFilePath)
        this.setData({
          imageList: this.data.imageList.concat(tempFiles)
        })
      }
    })
  },

  previewImage(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.imageList[index],
      urls: this.data.imageList
    })
  },

  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    const imageList = this.data.imageList
    imageList.splice(index, 1)
    this.setData({ imageList })
  },

  validate() {
    const { title, region } = this.data
    if (!title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' })
      return false
    }
    if (!region) {
      wx.showToast({ title: '请选择目的地', icon: 'none' })
      return false
    }
    return true
  },

  uploadImages() {
    const { imageList } = this.data
    if (imageList.length === 0) return Promise.resolve([])

    const tasks = imageList.map((filePath, index) => {
      const cloudPath = 'guide-images/' + Date.now() + '-' + index + filePath.match(/\.\w+$/)[0]
      return wx.cloud.uploadFile({
        cloudPath,
        filePath
      }).then(res => res.fileID)
    })

    return Promise.all(tasks)
  },

  onPublish() {
    if (!this.validate()) return
    if (this.data.publishing) return
    this.setData({ publishing: true })

    const app = getApp()
    app.getOpenId().then(openId => {
      return this.getUserInfo(openId)
    }).then(({ openId, userInfo }) => {
      return this.uploadImages().then(imageIds => {
        const { title, content, spotName, isPublic, foods, province, city, district, regionLevel, displayRegion } = this.data
        const validFoods = foods.filter(f => f.name.trim())
        return db.collection('guides').add({
          data: {
            title: title.trim(),
            content: content.trim(),
            spotName: spotName.trim(),
            isPublic,
            region: displayRegion,
            province,
            city,
            district,
            regionLevel,
            foods: validFoods,
            images: imageIds,
            author: {
              openId,
              nickName: userInfo.nickName || '旅行者',
              avatarUrl: userInfo.avatarUrl || ''
            },
            likes: 0,
            viewCount: 0,
            createTime: db.serverDate()
          }
        })
      })
    }).then(res => {
      this.setData({ publishing: false })
      wx.showToast({ title: '发布成功 ♡', icon: 'success' })
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/guide-detail/guide-detail?id=' + res._id
        })
      }, 1500)
    }).catch(err => {
      console.error('发布失败', err)
      this.setData({ publishing: false })
      wx.showToast({ title: '发布失败，请重试', icon: 'none' })
    })
  },

  getUserInfo(openId) {
    return db.collection('users').where({ openId }).get().then(res => {
      if (res.data.length > 0) {
        return { openId, userInfo: res.data[0] }
      }
      const userInfo = { nickName: '旅行者', avatarUrl: '' }
      return db.collection('users').add({
        data: {
          openId,
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          myGuides: [],
          likedGuides: [],
          createTime: db.serverDate()
        }
      }).then(() => ({ openId, userInfo }))
    })
  }
})
