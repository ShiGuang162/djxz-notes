const db = wx.cloud.database()
const _ = db.command

const users = db.collection('users')
const diaries = db.collection('diaries')
const checkins = db.collection('checkins')
const goals = db.collection('goals')
const comments = db.collection('comments')

const user = {
  async add(userInfo) {
    try {
      const result = await users.add({
        data: {
          ...userInfo,
          createTime: db.serverDate()
        }
      })
      return result
    } catch (error) {
      throw error
    }
  },

  async get(openid) {
    try {
      const result = await users.where({ _openid: openid }).get()
      return result.data[0]
    } catch (error) {
      throw error
    }
  },

  async update(openid, data) {
    try {
      const result = await users.where({ _openid: openid }).update({
        data: {
          ...data,
          updateTime: db.serverDate()
        }
      })
      return result
    } catch (error) {
      throw error
    }
  }
}

const diary = {
  async add(data) {
    try {
      const result = await diaries.add({
        data: {
          ...data,
          likes: 0,
          likedUsers: [],
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
      return result
    } catch (error) {
      throw error
    }
  },

  async getById(id) {
    try {
      const result = await diaries.doc(id).get()
      return result.data
    } catch (error) {
      throw error
    }
  },

  async getAll(userId) {
    try {
      const result = await diaries.where({ userId }).orderBy('createTime', 'desc').get()
      return result.data
    } catch (error) {
      throw error
    }
  },

  async update(id, data) {
    try {
      const result = await diaries.doc(id).update({
        data: {
          ...data,
          updateTime: db.serverDate()
        }
      })
      return result
    } catch (error) {
      throw error
    }
  },

  async delete(id) {
    try {
      const result = await diaries.doc(id).remove()
      return result
    } catch (error) {
      throw error
    }
  },

  async like(id, userId) {
    try {
      const diaryData = await this.getById(id)
      const hasLiked = diaryData.likedUsers.includes(userId)
      
      if (hasLiked) {
        await diaries.doc(id).update({
          data: {
            likes: _.inc(-1),
            likedUsers: _.pull(userId)
          }
        })
        return { liked: false }
      } else {
        await diaries.doc(id).update({
          data: {
            likes: _.inc(1),
            likedUsers: _.push(userId)
          }
        })
        return { liked: true }
      }
    } catch (error) {
      throw error
    }
  }
}

const checkin = {
  async add(data) {
    try {
      const result = await checkins.add({
        data: {
          ...data,
          createTime: db.serverDate()
        }
      })
      return result
    } catch (error) {
      throw error
    }
  },

  async getByDate(userId, date) {
    try {
      const result = await checkins.where({ userId, checkDate: date }).get()
      return result.data[0]
    } catch (error) {
      throw error
    }
  },

  async getAll(userId) {
    try {
      const result = await checkins.where({ userId }).orderBy('checkDate', 'desc').get()
      return result.data
    } catch (error) {
      throw error
    }
  },

  async getContinuousDays(userId) {
    try {
      const allCheckins = await this.getAll(userId)
      if (allCheckins.length === 0) return 0

      const dates = allCheckins.map(c => c.checkDate).sort((a, b) => new Date(b) - new Date(a))
      const today = new Date().toISOString().split('T')[0]
      
      let continuous = 0
      const expectedDate = new Date()
      
      for (let i = 0; i < dates.length; i++) {
        expectedDate.setDate(expectedDate.getDate() - i)
        const expectedStr = expectedDate.toISOString().split('T')[0]
        if (dates[i] === expectedStr) {
          continuous++
        } else {
          break
        }
      }
      
      return continuous
    } catch (error) {
      throw error
    }
  },

  async getMonthCheckins(userId, year, month) {
    try {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
      const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
      const endDate = `${nextMonth.year}-${nextMonth.month.toString().padStart(2, '0')}-01`
      
      const result = await checkins.where({
        userId,
        checkDate: _.gte(startDate).and(_.lt(endDate))
      }).get()
      return result.data
    } catch (error) {
      throw error
    }
  }
}

const goal = {
  async add(data) {
    try {
      const result = await goals.add({
        data: {
          ...data,
          completedDays: 0,
          status: 'active',
          createTime: db.serverDate()
        }
      })
      return result
    } catch (error) {
      throw error
    }
  },

  async getAll(userId) {
    try {
      const result = await goals.where({ userId }).orderBy('createTime', 'desc').get()
      return result.data
    } catch (error) {
      throw error
    }
  },

  async getById(id) {
    try {
      const result = await goals.doc(id).get()
      return result.data
    } catch (error) {
      throw error
    }
  },

  async update(id, data) {
    try {
      const result = await goals.doc(id).update({
        data: {
          ...data,
          updateTime: db.serverDate()
        }
      })
      return result
    } catch (error) {
      throw error
    }
  },

  async delete(id) {
    try {
      const result = await goals.doc(id).remove()
      return result
    } catch (error) {
      throw error
    }
  },

  async completeDay(id) {
    try {
      const goalData = await this.getById(id)
      if (goalData.completedDays >= goalData.targetDays) {
        await goals.doc(id).update({
          data: {
            completedDays: goalData.targetDays,
            status: 'completed'
          }
        })
      } else {
        await goals.doc(id).update({
          data: {
            completedDays: _.inc(1)
          }
        })
      }
    } catch (error) {
      throw error
    }
  }
}

const comment = {
  async add(data) {
    try {
      const result = await comments.add({
        data: {
          ...data,
          createTime: db.serverDate()
        }
      })
      return result
    } catch (error) {
      throw error
    }
  },

  async getByDiaryId(diaryId) {
    try {
      const result = await comments.where({ diaryId }).orderBy('createTime', 'desc').get()
      return result.data
    } catch (error) {
      throw error
    }
  },

  async delete(id) {
    try {
      const result = await comments.doc(id).remove()
      return result
    } catch (error) {
      throw error
    }
  }
}

module.exports = {
  db,
  _,
  user,
  diary,
  checkin,
  goal,
  comment
}