const STORAGE_KEY = 'my_blog_data'
const STORAGE_VERSION = '1.0.0'

// 内存缓存，减少重复读取存储
let dataCache = null
let cacheTimestamp = 0
const CACHE_TTL = 100 // 缓存有效期(ms)，小程序单线程，短时间内多次操作可复用

const getLocalData = () => {
  const now = Date.now()
  if (dataCache && (now - cacheTimestamp) < CACHE_TTL) {
    return dataCache
  }

  try {
    const data = wx.getStorageSync(STORAGE_KEY)
    if (!data) {
      dataCache = initDefaultData()
      return dataCache
    }
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    dataCache = migrateData(parsed)
    cacheTimestamp = now
    return dataCache
  } catch (error) {
    console.error('读取数据失败:', error)
    dataCache = initDefaultData()
    return dataCache
  }
}

const initDefaultData = () => {
  const defaultData = {
    version: STORAGE_VERSION,
    users: [],
    diaries: [],
    checkins: [],
    goals: [],
    comments: []
  }
  saveLocalData(defaultData)
  return defaultData
}

const migrateData = (data) => {
  let needsSave = false

  const ensureArray = (key) => {
    if (!data[key]) {
      data[key] = []
      needsSave = true
    }
  }

  ensureArray('users')
  ensureArray('diaries')
  ensureArray('checkins')
  ensureArray('goals')
  ensureArray('comments')

  if (!data.version) {
    data.version = STORAGE_VERSION
    needsSave = true
  }

  // 数据规范化
  data.diaries = data.diaries.map(d => ({
    ...d,
    likes: d.likes || 0,
    likedUsers: d.likedUsers || [],
    images: d.images || [],
    commentCount: d.commentCount || 0,
    createTime: d.createTime || new Date().toISOString(),
    updateTime: d.updateTime || new Date().toISOString()
  }))

  data.goals = data.goals.map(g => ({
    ...g,
    completedDays: g.completedDays || 0,
    status: g.status || (g.completedDays >= g.targetDays ? 'completed' : 'active'),
    checkinDates: g.checkinDates || [],
    createTime: g.createTime || new Date().toISOString()
  }))

  data.checkins = data.checkins.map(c => ({
    ...c,
    userId: c.userId || 'mock_openid',
    createTime: c.createTime || new Date().toISOString()
  }))

  if (needsSave) {
    saveLocalData(data)
  }

  return data
}

const saveLocalData = (data) => {
  try {
    data.version = STORAGE_VERSION
    wx.setStorageSync(STORAGE_KEY, JSON.stringify(data))
    // 更新缓存
    dataCache = data
    cacheTimestamp = Date.now()
  } catch (error) {
    console.error('保存数据失败:', error)
    wx.showToast({
      title: '保存失败，请检查存储空间',
      icon: 'none',
      duration: 2000
    })
  }
}

// 清除缓存，用于需要强制刷新数据的场景
const clearCache = () => {
  dataCache = null
  cacheTimestamp = 0
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

const mockUser = {
  _openid: 'mock_openid',
  nickName: '用户',
  avatarUrl: '',
  createTime: new Date().toISOString()
}

// 通用错误处理包装器
const withErrorHandling = (fn, errorMessage) => {
  return (...args) => {
    try {
      return fn(...args)
    } catch (error) {
      console.error(`${errorMessage}:`, error)
      return null
    }
  }
}

const user = {
  add(userInfo) {
    try {
      const data = getLocalData()
      const user = {
        _openid: 'mock_openid',
        ...userInfo,
        createTime: new Date().toISOString()
      }
      data.users.push(user)
      saveLocalData(data)
      return { _id: user._openid, success: true }
    } catch (error) {
      console.error('添加用户失败:', error)
      return { success: false, message: '添加用户失败' }
    }
  },

  get(openid) {
    try {
      const data = getLocalData()
      return data.users.find(u => u._openid === openid) || mockUser
    } catch (error) {
      console.error('获取用户失败:', error)
      return mockUser
    }
  },

  update(openid, dataToUpdate) {
    try {
      const data = getLocalData()
      const index = data.users.findIndex(u => u._openid === openid)
      if (index !== -1) {
        data.users[index] = { ...data.users[index], ...dataToUpdate }
        saveLocalData(data)
        return { stats: { updated: 1 }, success: true }
      }
      return { stats: { updated: 0 }, success: false, message: '用户不存在' }
    } catch (error) {
      console.error('更新用户失败:', error)
      return { success: false, message: '更新用户失败' }
    }
  }
}

const diary = {
  add(diaryData) {
    try {
      if (!diaryData.content || !diaryData.content.trim()) {
        return { success: false, message: '日记内容不能为空' }
      }

      const data = getLocalData()
      const diary = {
        _id: generateId(),
        userId: diaryData.userId || 'mock_openid',
        content: diaryData.content.trim(),
        images: diaryData.images || [],
        likes: 0,
        likedUsers: [],
        commentCount: 0,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      }
      data.diaries.unshift(diary)
      saveLocalData(data)
      return { _id: diary._id, success: true }
    } catch (error) {
      console.error('添加日记失败:', error)
      return { success: false, message: '添加日记失败' }
    }
  },

  getById(id) {
    try {
      const data = getLocalData()
      return data.diaries.find(d => d._id === id) || null
    } catch (error) {
      console.error('获取日记失败:', error)
      return null
    }
  },

  getAll(userId) {
    try {
      const data = getLocalData()
      return data.diaries
        .filter(d => d.userId === userId)
        .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    } catch (error) {
      console.error('获取日记列表失败:', error)
      return []
    }
  },

  update(id, dataToUpdate) {
    try {
      const data = getLocalData()
      const index = data.diaries.findIndex(d => d._id === id)
      if (index !== -1) {
        data.diaries[index] = {
          ...data.diaries[index],
          ...dataToUpdate,
          updateTime: new Date().toISOString()
        }
        saveLocalData(data)
        return { stats: { updated: 1 }, success: true }
      }
      return { stats: { updated: 0 }, success: false, message: '日记不存在' }
    } catch (error) {
      console.error('更新日记失败:', error)
      return { success: false, message: '更新日记失败' }
    }
  },

  delete(id) {
    try {
      const data = getLocalData()
      const exists = data.diaries.some(d => d._id === id)
      if (!exists) {
        return { stats: { removed: 0 }, success: false, message: '日记不存在' }
      }
      data.diaries = data.diaries.filter(d => d._id !== id)
      data.comments = data.comments.filter(c => c.diaryId !== id)
      saveLocalData(data)
      return { stats: { removed: 1 }, success: true }
    } catch (error) {
      console.error('删除日记失败:', error)
      return { success: false, message: '删除日记失败' }
    }
  },

  like(id, userId) {
    try {
      const data = getLocalData()
      const diary = data.diaries.find(d => d._id === id)
      if (!diary) return { success: false, message: '日记不存在' }

      const hasLiked = diary.likedUsers.includes(userId)

      if (hasLiked) {
        diary.likes = Math.max(0, (diary.likes || 0) - 1)
        diary.likedUsers = diary.likedUsers.filter(u => u !== userId)
      } else {
        diary.likes = (diary.likes || 0) + 1
        diary.likedUsers = diary.likedUsers || []
        diary.likedUsers.push(userId)
      }

      saveLocalData(data)
      return { success: true, liked: !hasLiked, likes: diary.likes }
    } catch (error) {
      console.error('点赞失败:', error)
      return { success: false, message: '点赞失败' }
    }
  }
}

const checkin = {
  add(checkinData) {
    try {
      if (!checkinData.checkDate) {
        return { success: false, message: '日期不能为空' }
      }

      const data = getLocalData()
      const exists = data.checkins.some(
        c => c.userId === checkinData.userId && c.checkDate === checkinData.checkDate
      )

      if (exists) {
        return { success: false, message: '今日已打卡' }
      }

      const checkin = {
        _id: generateId(),
        userId: checkinData.userId || 'mock_openid',
        checkDate: checkinData.checkDate,
        goalId: checkinData.goalId,
        createTime: new Date().toISOString()
      }
      data.checkins.unshift(checkin)
      saveLocalData(data)
      return { _id: checkin._id, success: true }
    } catch (error) {
      console.error('添加打卡失败:', error)
      return { success: false, message: '添加打卡失败' }
    }
  },

  getByDate(userId, date) {
    try {
      const data = getLocalData()
      return data.checkins.find(c => c.userId === userId && c.checkDate === date) || null
    } catch (error) {
      console.error('获取打卡记录失败:', error)
      return null
    }
  },

  getAll(userId) {
    try {
      const data = getLocalData()
      return data.checkins
        .filter(c => c.userId === userId)
        .sort((a, b) => new Date(b.checkDate) - new Date(a.checkDate))
    } catch (error) {
      console.error('获取打卡列表失败:', error)
      return []
    }
  },

  getContinuousDays(userId) {
    try {
      const data = getLocalData()
      const userCheckins = data.checkins.filter(c => c.userId === userId)
      if (userCheckins.length === 0) return 0

      const dates = userCheckins
        .map(c => c.checkDate)
        .sort((a, b) => new Date(b) - new Date(a))

      let continuous = 0

      for (let i = 0; i < dates.length; i++) {
        const expectedDate = new Date()
        expectedDate.setDate(expectedDate.getDate() - i)
        const year = expectedDate.getFullYear()
        const month = (expectedDate.getMonth() + 1).toString().padStart(2, '0')
        const day = expectedDate.getDate().toString().padStart(2, '0')
        const expectedStr = `${year}-${month}-${day}`
        if (dates[i] === expectedStr) {
          continuous++
        } else {
          break
        }
      }

      return continuous
    } catch (error) {
      console.error('计算连续天数失败:', error)
      return 0
    }
  },

  getMonthCheckins(userId, year, month) {
    try {
      const data = getLocalData()
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
      const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
      const endDate = `${nextMonth.year}-${nextMonth.month.toString().padStart(2, '0')}-01`

      return data.checkins.filter(c =>
        c.userId === userId && c.checkDate >= startDate && c.checkDate < endDate
      )
    } catch (error) {
      console.error('获取月度打卡失败:', error)
      return []
    }
  }
}

const goal = {
  add(goalData) {
    try {
      if (!goalData.title || !goalData.title.trim()) {
        return { success: false, message: '目标名称不能为空' }
      }

      if (!goalData.targetDays || goalData.targetDays <= 0) {
        return { success: false, message: '目标天数必须大于0' }
      }

      const data = getLocalData()
      const goal = {
        _id: generateId(),
        userId: goalData.userId || 'mock_openid',
        title: goalData.title.trim(),
        description: goalData.description ? goalData.description.trim() : '',
        targetDays: parseInt(goalData.targetDays),
        completedDays: 0,
        status: 'active',
        checkinDates: [],
        createTime: new Date().toISOString()
      }
      data.goals.unshift(goal)
      saveLocalData(data)
      return { _id: goal._id, success: true }
    } catch (error) {
      console.error('添加目标失败:', error)
      return { success: false, message: '添加目标失败' }
    }
  },

  getAll(userId) {
    try {
      const data = getLocalData()
      return data.goals
        .filter(g => g.userId === userId)
        .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    } catch (error) {
      console.error('获取目标列表失败:', error)
      return []
    }
  },

  getById(id) {
    try {
      const data = getLocalData()
      return data.goals.find(g => g._id === id) || null
    } catch (error) {
      console.error('获取目标详情失败:', error)
      return null
    }
  },

  update(id, dataToUpdate) {
    try {
      const data = getLocalData()
      const index = data.goals.findIndex(g => g._id === id)
      if (index !== -1) {
        data.goals[index] = { ...data.goals[index], ...dataToUpdate }
        saveLocalData(data)
        return { stats: { updated: 1 }, success: true }
      }
      return { stats: { updated: 0 }, success: false, message: '目标不存在' }
    } catch (error) {
      console.error('更新目标失败:', error)
      return { success: false, message: '更新目标失败' }
    }
  },

  delete(id) {
    try {
      const data = getLocalData()
      const exists = data.goals.some(g => g._id === id)
      if (!exists) {
        return { stats: { removed: 0 }, success: false, message: '目标不存在' }
      }
      data.goals = data.goals.filter(g => g._id !== id)
      saveLocalData(data)
      return { stats: { removed: 1 }, success: true }
    } catch (error) {
      console.error('删除目标失败:', error)
      return { success: false, message: '删除目标失败' }
    }
  },

  checkIn(id, dateStr) {
    try {
      const data = getLocalData()
      const goal = data.goals.find(g => g._id === id)
      if (!goal) return { success: false, message: '目标不存在' }

      if (!goal.checkinDates) {
        goal.checkinDates = []
      }

      if (goal.checkinDates.includes(dateStr)) {
        return { success: false, message: '今日已打卡', alreadyChecked: true }
      }

      if (goal.completedDays >= goal.targetDays) {
        return { success: false, message: '目标已完成' }
      }

      goal.checkinDates.push(dateStr)
      goal.completedDays = goal.checkinDates.length

      if (goal.completedDays >= goal.targetDays) {
        goal.status = 'completed'
      }

      saveLocalData(data)
      return { success: true, message: '打卡成功', goal }
    } catch (error) {
      console.error('目标打卡失败:', error)
      return { success: false, message: '打卡失败' }
    }
  },

  isCheckedOnDate(goal, dateStr) {
    if (!goal || !goal.checkinDates) return false
    return goal.checkinDates.includes(dateStr)
  },

  getCheckedDates(id) {
    try {
      const data = getLocalData()
      const goal = data.goals.find(g => g._id === id)
      if (!goal) return []
      return goal.checkinDates || []
    } catch (error) {
      console.error('获取打卡日期失败:', error)
      return []
    }
  },

  undoCheckIn(id, dateStr) {
    try {
      const data = getLocalData()
      const goal = data.goals.find(g => g._id === id)
      if (!goal || !goal.checkinDates) return { success: false, message: '目标或打卡记录不存在' }

      const idx = goal.checkinDates.indexOf(dateStr)
      if (idx === -1) return { success: false, message: '打卡记录不存在' }

      goal.checkinDates.splice(idx, 1)
      goal.completedDays = goal.checkinDates.length

      if (goal.status === 'completed' && goal.completedDays < goal.targetDays) {
        goal.status = 'active'
      }

      saveLocalData(data)
      return { success: true, goal }
    } catch (error) {
      console.error('撤销打卡失败:', error)
      return { success: false, message: '撤销打卡失败' }
    }
  }
}

const comment = {
  add(commentData) {
    try {
      if (!commentData.content || !commentData.content.trim()) {
        return { success: false, message: '评论内容不能为空' }
      }

      if (!commentData.diaryId) {
        return { success: false, message: '日记ID不能为空' }
      }

      const data = getLocalData()
      const comment = {
        _id: generateId(),
        diaryId: commentData.diaryId,
        userId: commentData.userId || 'mock_openid',
        content: commentData.content.trim(),
        createTime: new Date().toISOString()
      }
      data.comments.unshift(comment)

      const diary = data.diaries.find(d => d._id === commentData.diaryId)
      if (diary) {
        diary.commentCount = (diary.commentCount || 0) + 1
      }

      saveLocalData(data)
      return { _id: comment._id, success: true }
    } catch (error) {
      console.error('添加评论失败:', error)
      return { success: false, message: '添加评论失败' }
    }
  },

  getByDiaryId(diaryId) {
    try {
      const data = getLocalData()
      return data.comments
        .filter(c => c.diaryId === diaryId)
        .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    } catch (error) {
      console.error('获取评论列表失败:', error)
      return []
    }
  },

  delete(id) {
    try {
      const data = getLocalData()
      const comment = data.comments.find(c => c._id === id)
      if (comment) {
        const diary = data.diaries.find(d => d._id === comment.diaryId)
        if (diary && diary.commentCount > 0) {
          diary.commentCount--
        }
      }
      data.comments = data.comments.filter(c => c._id !== id)
      saveLocalData(data)
      return { stats: { removed: 1 }, success: true }
    } catch (error) {
      console.error('删除评论失败:', error)
      return { success: false, message: '删除评论失败' }
    }
  }
}

module.exports = {
  user,
  diary,
  checkin,
  goal,
  comment,
  clearCache
}
