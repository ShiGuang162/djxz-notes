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
        return await db.collection('diaries').add({
          data: {
            ...data,
            userId: OPENID,
            likes: 0,
            likedUsers: [],
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        })
        
      case 'getById':
        return await db.collection('diaries').doc(data.id).get()
        
      case 'getAll':
        return await db.collection('diaries')
          .where({ userId: OPENID })
          .orderBy('createTime', 'desc')
          .get()
        
      case 'update':
        return await db.collection('diaries').doc(data.id).update({
          data: {
            ...data,
            updateTime: db.serverDate()
          }
        })
        
      case 'delete':
        return await db.collection('diaries').doc(data.id).remove()
        
      case 'like': {
        const diary = await db.collection('diaries').doc(data.id).get()
        const hasLiked = diary.data.likedUsers.includes(OPENID)
        
        if (hasLiked) {
          return await db.collection('diaries').doc(data.id).update({
            data: {
              likes: _.inc(-1),
              likedUsers: _.pull(OPENID)
            }
          })
        } else {
          return await db.collection('diaries').doc(data.id).update({
            data: {
              likes: _.inc(1),
              likedUsers: _.push(OPENID)
            }
          })
        }
      }
        
      default:
        return { error: 'Unknown action' }
    }
  } catch (error) {
    return { error: error.message }
  }
}