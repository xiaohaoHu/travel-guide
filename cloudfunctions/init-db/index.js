// 初始化数据库云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const results = {}

  const regions = [
    { name: '成都', description: '天府之国，美食之都', cover: '', sort: 100, guideCount: 0 },
    { name: '大理', description: '风花雪月，苍山洱海', cover: '', sort: 90, guideCount: 0 },
    { name: '厦门', description: '海上花园，文艺之城', cover: '', sort: 85, guideCount: 0 },
    { name: '重庆', description: '山城雾都，火锅之城', cover: '', sort: 80, guideCount: 0 },
    { name: '西安', description: '千年古都，丝路起点', cover: '', sort: 75, guideCount: 0 },
    { name: '丽江', description: '古城雪山，浪漫之旅', cover: '', sort: 70, guideCount: 0 },
    { name: '三亚', description: '热带天堂，碧海蓝天', cover: '', sort: 65, guideCount: 0 },
    { name: '杭州', description: '人间天堂，西湖美景', cover: '', sort: 60, guideCount: 0 },
    { name: '北京', description: '首都风采，古今交融', cover: '', sort: 55, guideCount: 0 },
    { name: '长沙', description: '星城长沙，湘味美食', cover: '', sort: 50, guideCount: 0 },
    { name: '青岛', description: '红瓦绿树，碧海蓝天', cover: '', sort: 45, guideCount: 0 },
    { name: '拉萨', description: '日光之城，雪域圣地', cover: '', sort: 40, guideCount: 0 }
  ]

  // 1. 插入 regions 数据
  try {
    let addedCount = 0
    for (const region of regions) {
      const res = await db.collection('regions').add({ data: region })
      console.log('插入地区成功：', region.name, res._id)
      addedCount++
    }
    results.regions = { success: true, added: addedCount }
  } catch (e) {
    console.error('插入 regions 失败：', e)
    results.regions = { success: false, error: e.message }
  }

  // 2. 插入 guides 测试数据并删除（验证集合可用）
  try {
    const testGuide = await db.collection('guides').add({
      data: {
        title: '__init__',
        content: '',
        region: '',
        category: 'travel',
        images: [],
        author: { nickName: '', avatarUrl: '', openId: '' },
        likes: 0,
        viewCount: 0,
        createTime: new Date()
      }
    })
    await db.collection('guides').doc(testGuide._id).remove()
    results.guides = { success: true, message: '集合已就绪' }
  } catch (e) {
    results.guides = { success: false, error: e.message }
  }

  // 3. 插入 users 测试数据并删除（验证集合可用）
  try {
    const testUser = await db.collection('users').add({
      data: {
        openId: '__init__',
        nickName: '',
        avatarUrl: '',
        myGuides: [],
        likedGuides: [],
        createTime: new Date()
      }
    })
    await db.collection('users').doc(testUser._id).remove()
    results.users = { success: true, message: '集合已就绪' }
  } catch (e) {
    results.users = { success: false, error: e.message }
  }

  return {
    code: 0,
    message: '执行完成',
    data: results
  }
}
