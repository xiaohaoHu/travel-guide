// app.js
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }
    wx.cloud.init({
      traceUser: true
    })
    this.globalData = {}
    // 获取用户openid
    this.getOpenId()
  },

  getOpenId() {
    if (this.globalData.openId) {
      return Promise.resolve(this.globalData.openId)
    }
    return wx.cloud.callFunction({
      name: 'login'
    }).then(res => {
      this.globalData.openId = res.result.openId
      return res.result.openId
    })
  },

  globalData: {
    openId: null,
    userInfo: null
  }
})
