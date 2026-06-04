const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action, data } = event
  const { OPENID } = cloud.getWXContext()

  try {
    switch (action) {
      case 'add':
        return await db.collection('comments').add({
          data: {
            ...data,
            userId: OPENID,
            createTime: db.serverDate()
          }
        })
        
      case 'getByDiaryId':
        return await db.collection('comments')
          .where({ diaryId: data.diaryId })
          .orderBy('createTime', 'desc')
          .get()
        
      case 'delete':
        return await db.collection('comments').doc(data.id).remove()
        
      default:
        return { error: 'Unknown action' }
    }
  } catch (error) {
    return { error: error.message }
  }
}