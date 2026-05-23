// 首页
const db = wx.cloud.database()
const { formatDate } = require('../../utils/util')

Page({
  data: {
    hotCities: [],
    currentSort: 'latest',
    guides: [],
    loading: false,
    noMore: false,
    page: 0,
    pageSize: 30
  },

  onLoad() {
    this.loadHotCities()
    this.loadGuides(true)
  },

  onPullDownRefresh() {
    this.loadHotCities()
    this.loadGuides(true)
  },

  onReachBottom() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadGuides(false)
    }
  },

  loadHotCities() {
    db.collection('guides')
      .where({ isPublic: true })
      .field({ province: true, city: true })
      .limit(100)
      .get()
      .then(res => {
        const cityMap = {}
        res.data.forEach(g => {
          const key = (g.province || '') + '-' + (g.city || '')
          if (!cityMap[key]) {
            cityMap[key] = { province: g.province, city: g.city, count: 0 }
          }
          cityMap[key].count++
        })
        const cities = Object.values(cityMap)
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)
        this.setData({ hotCities: cities })
      })
  },

  loadGuides(reset) {
    if (this.data.loading) return
    this.setData({ loading: true })

    const page = reset ? 0 : this.data.page
    const { currentSort, pageSize } = this.data
    const sortField = currentSort === 'hot' ? 'likes' : 'createTime'

    db.collection('guides')
      .where({ isPublic: true })
      .orderBy(sortField, 'desc')
      .skip(page * pageSize)
      .limit(pageSize)
      .get()
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
        if (reset) wx.stopPullDownRefresh()
      })
      .catch(err => {
        console.error('加载攻略失败', err)
        this.setData({ loading: false })
        wx.stopPullDownRefresh()
      })
  },

  // 切换排序
  switchSort(e) {
    const sort = e.currentTarget.dataset.sort
    if (sort === this.data.currentSort) return
    this.setData({ currentSort: sort })
    this.loadGuides(true)
  },

  onSearchTap() {
    wx.showToast({ title: '搜索功能开发中', icon: 'none' })
  },

  goRegionList() {
    wx.navigateTo({ url: '/pages/region/region' })
  },

  goGuideList(e) {
    const city = e.currentTarget.dataset.city
    wx.navigateTo({
      url: '/pages/guide-list/guide-list?city=' + encodeURIComponent(city)
    })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/guide-detail/guide-detail?id=' + id
    })
  }
})
