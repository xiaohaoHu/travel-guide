// 个人中心
const db = wx.cloud.database()
const { formatDate } = require('../../utils/util')

Page({
  data: {
    userInfo: null,
    currentTab: 'my',
    guides: [],
    myGuideCount: 0,
    totalLikes: 0,
    loading: false,
    noMore: false,
    page: 0,
    pageSize: 10
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    if (this.data.userInfo) {
      this.loadGuides(true)
    }
  },

  // 检查登录状态
  checkLogin() {
    const app = getApp()
    app.getOpenId().then(openId => {
      return db.collection('users').where({ openId }).get()
    }).then(res => {
      if (res.data.length > 0) {
        this.setData({ userInfo: res.data[0] })
        this.loadGuides(true)
        this.loadStats()
      }
    })
  },

  // 登录
  onLogin() {
    const app = getApp()
    let openId = ''

    app.getOpenId().then(id => {
      openId = id
      return db.collection('users').where({ openId: id }).get()
    }).then(res => {
      if (res.data.length > 0) {
        this.setData({ userInfo: res.data[0] })
        this.loadGuides(true)
        this.loadStats()
        return
      }
      // 创建新用户
      db.collection('users').add({
        data: {
          openId,
          nickName: '旅行者',
          avatarUrl: '',
          myGuides: [],
          likedGuides: [],
          createTime: db.serverDate()
        }
      }).then(() => {
        this.checkLogin()
      })
    })
  },

  // 加载统计数据
  loadStats() {
    const userInfo = this.data.userInfo
    if (!userInfo) return

    // 我的攻略数
    db.collection('guides')
      .where({ 'author.openId': userInfo.openId })
      .count()
      .then(res => {
        this.setData({ myGuideCount: res.total })
      })

    // 获赞总数
    db.collection('guides')
      .where({ 'author.openId': userInfo.openId })
      .get()
      .then(res => {
        const total = res.data.reduce((sum, g) => sum + (g.likes || 0), 0)
        this.setData({ totalLikes: total })
      })
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.currentTab) return
    this.setData({ currentTab: tab })
    this.loadGuides(true)
  },

  // 加载攻略列表
  loadGuides(reset) {
    if (this.data.loading) return
    const userInfo = this.data.userInfo
    if (!userInfo) return

    this.setData({ loading: true })
    const page = reset ? 0 : this.data.page
    const { currentTab, pageSize } = this.data

    let query
    if (currentTab === 'my') {
      query = db.collection('guides')
        .where({ 'author.openId': userInfo.openId })
        .orderBy('createTime', 'desc')
    } else {
      const likedGuides = userInfo.likedGuides || []
      if (likedGuides.length === 0) {
        this.setData({
          guides: [],
          loading: false,
          noMore: true
        })
        return
      }
      query = db.collection('guides')
        .where({ _id: db.command.in(likedGuides) })
        .orderBy('createTime', 'desc')
    }

    query = query.skip(page * pageSize).limit(pageSize)

    query.get()
      .then(res => {
        const guides = res.data.map(g => ({
          ...g,
          createTimeText: formatDate(g.createTime)
        }))
        this.setData({
          guides: reset ? guides : this.data.guides.concat(guides),
          page: page + 1,
          noMore: guides.length < pageSize,
          loading: false
        })
      })
      .catch(err => {
        console.error('加载攻略失败', err)
        this.setData({ loading: false })
      })
  },

  onReachBottom() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadGuides(false)
    }
  }
})
