const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data } = event
  const { OPENID } = cloud.getWXContext()

  try {
    switch (action) {
      case 'add':
        return await db.collection('checkins').add({
          data: {
            ...data,
            userId: OPENID,
            createTime: db.serverDate()
          }
        })
        
      case 'getByDate':
        return await db.collection('checkins')
          .where({ userId: OPENID, checkDate: data.date })
          .get()
        
      case 'getAll':
        return await db.collection('checkins')
          .where({ userId: OPENID })
          .orderBy('checkDate', 'desc')
          .get()
        
      case 'getMonth': {
        const startDate = `${data.year}-${String(data.month).padStart(2, '0')}-01`
        const nextMonth = data.month === 12 ? { year: data.year + 1, month: 1 } : { year: data.year, month: data.month + 1 }
        const endDate = `${nextMonth.year}-${String(nextMonth.month).padStart(2, '0')}-01`
        
        return await db.collection('checkins')
          .where({
            userId: OPENID,
            checkDate: _.gte(startDate).and(_.lt(endDate))
          })
          .get()
      }
        
      default:
        return { error: 'Unknown action' }
    }
  } catch (error) {
    return { error: error.message }
  }
}