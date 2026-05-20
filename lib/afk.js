/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const fs = require('fs')
const dbPath = './database/afk.json'

const saveAfk = (_dir) => {
    fs.writeFileSync(dbPath, JSON.stringify(_dir, null, 2))
}

const addAfkUser = (userId, time, reason, _dir) => {
    _dir.push({ id: userId, time: time, reason: reason })
    saveAfk(_dir)
}

const checkAfkUser = (userId, _dir) => {
    return _dir.some(user => user.id === userId)
}

const getAfkUser = (userId, _dir) => {
    return _dir.find(user => user.id === userId) || null
}

const getAfkPosition = (userId, _dir) => {
    const index = _dir.findIndex(user => user.id === userId)
    return index !== -1 ? index : null
}

const delAfkUser = (userId, _dir) => {
    const index = _dir.findIndex(user => user.id === userId)
    if (index !== -1) {
        _dir.splice(index, 1)
        saveAfk(_dir)
    }
}

module.exports = {
    addAfkUser,
    checkAfkUser,
    getAfkUser,
    getAfkPosition,
    delAfkUser
}