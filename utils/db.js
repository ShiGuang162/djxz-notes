const db = wx.cloud?.database?.() || null
const _ = db?.command || null

const STORAGE_KEY = 'my_blog_data'

const getLocalData = () => {
  try {
    const data = wx.getStorageSync(STORAGE_KEY)
    return data ? JSON.parse(data) : { users: [], diaries: [], checkins: [], goals: [], comments: [] }
  } catch {
    return { users: [], diaries: [], checkins: [], goals: [], comments: [] }
  }
}

const saveLocalData = (data) => {
  try {
    wx.setStorageSync(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('保存数据失败:', error)
  }
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const mockUser = {
  _openid: 'mock_openid',
  nickName: '用户',
  avatarUrl: '',
  createTime: new Date().toISOString()
}

const user = {
  async add(userInfo) {
    const data = getLocalData()
    const user = {
      _openid: 'mock_openid',
      ...userInfo,
      createTime: new Date().toISOString()
    }
    data.users.push(user)
    saveLocalData(data)
    return { _id: user._openid }
  },

  async get(openid) {
    const data = getLocalData()
    return data.users.find(u => u._openid === openid) || mockUser
  },

  async update(openid, dataToUpdate) {
    const data = getLocalData()
    const index = data.users.findIndex(u => u._openid === openid)
    if (index !== -1) {
      data.users[index] = { ...data.users[index], ...dataToUpdate }
      saveLocalData(data)
    }
    return { stats: { updated: 1 } }
  }
}

const diary = {
  async add(diaryData) {
    const data = getLocalData()
    const diary = {
      _id: generateId(),
      userId: diaryData.userId || 'mock_openid',
      content: diaryData.content,
      images: diaryData.images || [],
      likes: 0,
      likedUsers: [],
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    data.diaries.unshift(diary)
    saveLocalData(data)
    return { _id: diary._id }
  },

  async getById(id) {
    const data = getLocalData()
    return data.diaries.find(d => d._id === id) || null
  },

  async getAll(userId) {
    const data = getLocalData()
    return data.diaries.filter(d => d.userId === userId).sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
  },

  async update(id, dataToUpdate) {
    const data = getLocalData()
    const index = data.diaries.findIndex(d => d._id === id)
    if (index !== -1) {
      data.diaries[index] = { ...data.diaries[index], ...dataToUpdate, updateTime: new Date().toISOString() }
      saveLocalData(data)
    }
    return { stats: { updated: 1 } }
  },

  async delete(id) {
    const data = getLocalData()
    data.diaries = data.diaries.filter(d => d._id !== id)
    saveLocalData(data)
    return { stats: { removed: 1 } }
  },

  async like(id, userId) {
    const data = getLocalData()
    const diary = data.diaries.find(d => d._id === id)
    if (!diary) return { liked: false }

    const hasLiked = diary.likedUsers.includes(userId)
    
    if (hasLiked) {
      diary.likes--
      diary.likedUsers = diary.likedUsers.filter(u => u !== userId)
    } else {
      diary.likes++
      diary.likedUsers.push(userId)
    }
    
    saveLocalData(data)
    return { liked: !hasLiked }
  }
}

const checkin = {
  async add(checkinData) {
    const data = getLocalData()
    const checkin = {
      _id: generateId(),
      userId: checkinData.userId || 'mock_openid',
      checkDate: checkinData.checkDate,
      goalId: checkinData.goalId,
      createTime: new Date().toISOString()
    }
    data.checkins.unshift(checkin)
    saveLocalData(data)
    return { _id: checkin._id }
  },

  async getByDate(userId, date) {
    const data = getLocalData()
    return data.checkins.find(c => c.userId === userId && c.checkDate === date) || null
  },

  async getAll(userId) {
    const data = getLocalData()
    return data.checkins.filter(c => c.userId === userId).sort((a, b) => new Date(b.checkDate) - new Date(a.checkDate))
  },

  async getContinuousDays(userId) {
    const data = getLocalData()
    const userCheckins = data.checkins.filter(c => c.userId === userId)
    if (userCheckins.length === 0) return 0

    const dates = userCheckins.map(c => c.checkDate).sort((a, b) => new Date(b) - new Date(a))
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
  },

  async getMonthCheckins(userId, year, month) {
    const data = getLocalData()
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
    const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
    const endDate = `${nextMonth.year}-${nextMonth.month.toString().padStart(2, '0')}-01`
    
    return data.checkins.filter(c => 
      c.userId === userId && c.checkDate >= startDate && c.checkDate < endDate
    )
  }
}

const goal = {
  async add(goalData) {
    const data = getLocalData()
    const goal = {
      _id: generateId(),
      userId: goalData.userId || 'mock_openid',
      title: goalData.title,
      description: goalData.description || '',
      targetDays: goalData.targetDays,
      completedDays: 0,
      status: 'active',
      createTime: new Date().toISOString()
    }
    data.goals.unshift(goal)
    saveLocalData(data)
    return { _id: goal._id }
  },

  async getAll(userId) {
    const data = getLocalData()
    return data.goals.filter(g => g.userId === userId).sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
  },

  async getById(id) {
    const data = getLocalData()
    return data.goals.find(g => g._id === id) || null
  },

  async update(id, dataToUpdate) {
    const data = getLocalData()
    const index = data.goals.findIndex(g => g._id === id)
    if (index !== -1) {
      data.goals[index] = { ...data.goals[index], ...dataToUpdate }
      saveLocalData(data)
    }
    return { stats: { updated: 1 } }
  },

  async delete(id) {
    const data = getLocalData()
    data.goals = data.goals.filter(g => g._id !== id)
    saveLocalData(data)
    return { stats: { removed: 1 } }
  },

  async completeDay(id) {
    const data = getLocalData()
    const goal = data.goals.find(g => g._id === id)
    if (!goal) return

    if (goal.completedDays < goal.targetDays) {
      goal.completedDays++
      if (goal.completedDays >= goal.targetDays) {
        goal.status = 'completed'
      }
    }
    
    saveLocalData(data)
  }
}

const comment = {
  async add(commentData) {
    const data = getLocalData()
    const comment = {
      _id: generateId(),
      diaryId: commentData.diaryId,
      userId: commentData.userId || 'mock_openid',
      content: commentData.content,
      createTime: new Date().toISOString()
    }
    data.comments.unshift(comment)
    saveLocalData(data)
    return { _id: comment._id }
  },

  async getByDiaryId(diaryId) {
    const data = getLocalData()
    return data.comments.filter(c => c.diaryId === diaryId).sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
  },

  async delete(id) {
    const data = getLocalData()
    data.comments = data.comments.filter(c => c._id !== id)
    saveLocalData(data)
    return { stats: { removed: 1 } }
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