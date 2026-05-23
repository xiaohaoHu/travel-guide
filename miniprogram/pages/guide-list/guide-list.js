// 攻略列表页
const db = wx.cloud.database()
const { formatDate } = require('../../utils/util')

Page({
  data: {
    city: '',
    currentSort: 'latest',
    guides: [],
    loading: false,
    noMore: false,
    page: 0,
    pageSize: 10
  },

  onLoad(options) {
    if (options.city) {
      this.setData({ city: decodeURIComponent(options.city) })
    }
    this.loadGuides(true)
  },

  onPullDownRefresh() {
    this.loadGuides(true)
  },

  onReachBottom() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadGuides(false)
    }
  },

  loadGuides(reset) {
    if (this.data.loading) return
    this.setData({ loading: true })

    const page = reset ? 0 : this.data.page
    const { currentSort, city, pageSize } = this.data

    let where = { isPublic: true }
    if (city) {
      where.city = city
    }

    const sortField = currentSort === 'hot' ? 'likes' : 'createTime'

    db.collection('guides')
      .where(where)
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

  switchSort(e) {
    const sort = e.currentTarget.dataset.sort
    if (sort === this.data.currentSort) return
    this.setData({ currentSort: sort })
    this.loadGuides(true)
  },

  clearCity() {
    this.setData({ city: '' })
    this.loadGuides(true)
  }
})
