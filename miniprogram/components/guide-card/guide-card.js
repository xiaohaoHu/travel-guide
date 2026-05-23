// 攻略卡片组件
Component({
  properties: {
    guide: {
      type: Object,
      value: {}
    }
  },

  methods: {
    onTapCard() {
      const id = this.properties.guide._id
      if (!id) return
      wx.navigateTo({
        url: '/pages/guide-detail/guide-detail?id=' + id
      })
    }
  }
})
