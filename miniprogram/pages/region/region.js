// 地区列表页 - 从攻略数据动态生成
const db = wx.cloud.database()

Page({
  data: {
    provinceList: [],
    loading: false
  },

  onLoad() {
    this.loadCities()
  },

  loadCities() {
    this.setData({ loading: true })
    db.collection('guides')
      .where({ isPublic: true })
      .field({ province: true, city: true })
      .limit(1000)
      .get()
      .then(res => {
        // 按省份分组
        const provMap = {}
        res.data.forEach(g => {
          const prov = g.province || '未知'
          if (!provMap[prov]) {
            provMap[prov] = {}
          }
          const city = g.city || '未知'
          if (!provMap[prov][city]) {
            provMap[prov][city] = 0
          }
          provMap[prov][city]++
        })

        // 转为数组
        const provinceList = Object.keys(provMap).map(prov => {
          const cities = Object.keys(provMap[prov]).map(city => ({
            name: city,
            count: provMap[prov][city]
          }))
          return {
            province: prov,
            cities,
            totalCount: cities.reduce((s, c) => s + c.count, 0)
          }
        }).sort((a, b) => b.totalCount - a.totalCount)

        this.setData({ provinceList, loading: false })
      })
      .catch(err => {
        console.error('加载地区失败', err)
        this.setData({ loading: false })
      })
  },

  goGuideList(e) {
    const city = e.currentTarget.dataset.city
    wx.navigateTo({
      url: '/pages/guide-list/guide-list?city=' + encodeURIComponent(city)
    })
  }
})
