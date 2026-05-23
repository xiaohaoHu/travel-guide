// 攻略详情页
const db = wx.cloud.database()
const { formatDate } = require('../../utils/util')

Page({
  data: {
    guide: null,
    createTimeText: '',
    hasLiked: false,
    hasFavorited: false,
    isAuthor: false
  },

  onLoad(options) {
    if (options.id) {
      this.guideId = options.id
      this.loadGuide()
    }
  },

  onShareAppMessage() {
    const guide = this.data.guide
    return {
      title: guide ? guide.title : '旅行攻略',
      path: '/pages/guide-detail/guide-detail?id=' + this.guideId
    }
  },

  loadGuide() {
    wx.showLoading({ title: '加载中' })
    db.collection('guides').doc(this.guideId).get()
      .then(res => {
        const guide = res.data
        if (guide.isPublic === false) {
          const app = getApp()
          const openId = app.globalData.openId
          if (!openId || guide.author.openId !== openId) {
            wx.hideLoading()
            wx.showToast({ title: '该攻略未公开', icon: 'none' })
            setTimeout(() => wx.navigateBack(), 1500)
            return
          }
        }
        this.setData({
          guide,
          createTimeText: formatDate(guide.createTime)
        })
        wx.hideLoading()
        wx.setNavigationBarTitle({ title: guide.region || '攻略详情' })
        this.checkIsAuthor(guide)
        this.incrementView()
        this.checkLike()
        this.checkFavorite()
      })
      .catch(err => {
        wx.hideLoading()
        console.error('加载攻略失败', err)
        wx.showToast({ title: '加载失败', icon: 'none' })
      })
  },

  checkIsAuthor(guide) {
    const app = getApp()
    app.getOpenId().then(openId => {
      if (guide.author && guide.author.openId === openId) {
        this.setData({ isAuthor: true })
      }
    })
  },

  togglePublic(e) {
    const isPublic = e.detail.value
    db.collection('guides').doc(this.guideId).update({
      data: { isPublic }
    }).then(() => {
      const guide = this.data.guide
      guide.isPublic = isPublic
      this.setData({ guide })
      wx.showToast({ title: isPublic ? '已公开 ♡' : '已设为私密 🔒', icon: 'none' })
    }).catch(err => {
      console.error('更新失败：', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
      const guide = this.data.guide
      guide.isPublic = !isPublic
      this.setData({ guide })
    })
  },

  // 跳转编辑页
  goEdit() {
    wx.navigateTo({
      url: '/pages/edit-guide/edit-guide?id=' + this.guideId
    })
  },

  // 删除攻略
  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除这篇攻略吗？',
      confirmText: '删除',
      confirmColor: '#FF4444',
      success: res => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中' })
          db.collection('guides').doc(this.guideId).remove()
            .then(() => {
              wx.hideLoading()
              wx.showToast({ title: '已删除', icon: 'success' })
              setTimeout(() => {
                wx.navigateBack()
              }, 1500)
            })
            .catch(err => {
              wx.hideLoading()
              console.error('删除失败', err)
              wx.showToast({ title: '删除失败', icon: 'none' })
            })
        }
      }
    })
  },

  incrementView() {
    db.collection('guides').doc(this.guideId).update({
      data: { viewCount: db.command.inc(1) }
    })
  },

  checkLike() {
    const app = getApp()
    app.getOpenId().then(openId => {
      db.collection('users').where({ openId }).get().then(res => {
        if (res.data.length > 0) {
          const likedGuides = res.data[0].likedGuides || []
          this.setData({ hasLiked: likedGuides.includes(this.guideId) })
        }
      })
    })
  },

  // 检查是否已收藏
  checkFavorite() {
    const app = getApp()
    app.getOpenId().then(openId => {
      db.collection('users').where({ openId }).get().then(res => {
        if (res.data.length > 0) {
          const favoritedGuides = res.data[0].favoritedGuides || []
          this.setData({ hasFavorited: favoritedGuides.includes(this.guideId) })
        }
      })
    })
  },

  // 收藏/取消收藏
  toggleFavorite() {
    const app = getApp()
    app.getOpenId().then(openId => {
      db.collection('users').where({ openId }).get().then(res => {
        if (res.data.length === 0) {
          wx.showToast({ title: '请先登录', icon: 'none' })
          return
        }
        const user = res.data[0]
        let favoritedGuides = user.favoritedGuides || []
        const hasFavorited = this.data.hasFavorited

        if (hasFavorited) {
          favoritedGuides = favoritedGuides.filter(id => id !== this.guideId)
          db.collection('users').doc(user._id).update({ data: { favoritedGuides } })
          this.setData({ hasFavorited: false })
          wx.showToast({ title: '已取消收藏', icon: 'none' })
        } else {
          favoritedGuides.push(this.guideId)
          db.collection('users').doc(user._id).update({ data: { favoritedGuides } })
          this.setData({ hasFavorited: true })
          wx.showToast({ title: '收藏成功 ♡', icon: 'none' })
        }
      })
    })
  },

  toggleLike() {
    const app = getApp()
    app.getOpenId().then(openId => {
      db.collection('users').where({ openId }).get().then(res => {
        if (res.data.length === 0) {
          wx.showToast({ title: '请先登录', icon: 'none' })
          return
        }
        const user = res.data[0]
        const likedGuides = user.likedGuides || []
        const hasLiked = this.data.hasLiked

        if (hasLiked) {
          const newLiked = likedGuides.filter(id => id !== this.guideId)
          db.collection('users').doc(user._id).update({ data: { likedGuides: newLiked } })
          db.collection('guides').doc(this.guideId).update({ data: { likes: db.command.inc(-1) } })
          const guide = this.data.guide
          guide.likes = (guide.likes || 1) - 1
          this.setData({ hasLiked: false, guide })
        } else {
          likedGuides.push(this.guideId)
          db.collection('users').doc(user._id).update({ data: { likedGuides } })
          db.collection('guides').doc(this.guideId).update({ data: { likes: db.command.inc(1) } })
          const guide = this.data.guide
          guide.likes = (guide.likes || 0) + 1
          this.setData({ hasLiked: true, guide })
        }
      })
    })
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      current: url,
      urls: this.data.guide.images
    })
  },

  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    wx.showToast({ title: '点击右上角分享', icon: 'none' })
  }
})
