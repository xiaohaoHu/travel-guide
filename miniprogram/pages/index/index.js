// 首页
const db = wx.cloud.database()
const { formatDate } = require('../../utils/util')

Page({
  data: {
    hotCities: [],
    guides: [],
    loading: false,
    noMore: false,
    page: 0,
    pageSize: 10
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

  // 从已发布的攻略中提取热门城市
  loadHotCities() {
    db.collection('guides')
      .where({ isPublic: true })
      .field({ province: true, city: true })
      .limit(100)
      .get()
      .then(res => {
        // 统计每个城市出现的次数
        const cityMap = {}
        res.data.forEach(g => {
          const key = (g.province || '') + '-' + (g.city || '')
          if (!cityMap[key]) {
            cityMap[key] = {
              province: g.province,
              city: g.city,
              count: 0
            }
          }
          cityMap[key].count++
        })
        // 转为数组，按数量排序
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
    const { pageSize } = this.data

    db.collection('guides')
      .where({ isPublic: true })
      .orderBy('createTime', 'desc')
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
        if (reset) {
          wx.stopPullDownRefresh()
        }
      })
      .catch(err => {
        console.error('加载攻略失败', err)
        this.setData({ loading: false })
        wx.stopPullDownRefresh()
      })
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
  }
})
