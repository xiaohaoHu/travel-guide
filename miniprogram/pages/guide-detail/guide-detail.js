// 攻略详情页
const db = wx.cloud.database()
const { formatDate } = require('../../utils/util')

Page({
  data: {
    guide: null,
    createTimeText: '',
    hasLiked: false,
    authorGuides: []
  },

  onLoad(options) {
    if (options.id) {
      this.guideId = options.id
      this.loadGuide()
    }
  },

  // 分享
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
        // 非公开攻略只有作者能看
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
        // 增加浏览量
        this.incrementView()
        // 检查是否已点赞
        this.checkLike()
        // 加载作者其他攻略
        this.loadAuthorGuides(guide)
      })
      .catch(err => {
        wx.hideLoading()
        console.error('加载攻略失败', err)
        wx.showToast({ title: '加载失败', icon: 'none' })
      })
  },

  // 增加浏览量
  incrementView() {
    db.collection('guides').doc(this.guideId).update({
      data: {
        viewCount: db.command.inc(1)
      }
    })
  },

  // 检查是否已点赞
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

  // 点赞/取消点赞
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
          // 取消点赞
          const newLiked = likedGuides.filter(id => id !== this.guideId)
          db.collection('users').doc(user._id).update({
            data: { likedGuides: newLiked }
          })
          db.collection('guides').doc(this.guideId).update({
            data: { likes: db.command.inc(-1) }
          })
          const guide = this.data.guide
          guide.likes = (guide.likes || 1) - 1
          this.setData({ hasLiked: false, guide })
        } else {
          // 点赞
          likedGuides.push(this.guideId)
          db.collection('users').doc(user._id).update({
            data: { likedGuides }
          })
          db.collection('guides').doc(this.guideId).update({
            data: { likes: db.command.inc(1) }
          })
          const guide = this.data.guide
          guide.likes = (guide.likes || 0) + 1
          this.setData({ hasLiked: true, guide })
        }
      })
    })
  },

  // 预览图片
  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      current: url,
      urls: this.data.guide.images
    })
  },

  // 分享按钮
  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    wx.showToast({ title: '点击右上角分享', icon: 'none' })
  },

  // 加载作者其他攻略
  loadAuthorGuides(guide) {
    if (!guide.author || !guide.author.openId) return
    db.collection('guides')
      .where({
        'author.openId': guide.author.openId,
        _id: db.command.neq(this.guideId)
      })
      .orderBy('createTime', 'desc')
      .limit(3)
      .get()
      .then(res => {
        this.setData({ authorGuides: res.data })
      })
  }
})
