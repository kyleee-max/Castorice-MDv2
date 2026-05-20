/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/stats.json');

// XP yang dibutuhkan per level (base * level^1.5)
const XP_BASE = 100;

// Rank berdasarkan level
const RANKS = [
    { min: 0,  label: '🌱 Shosha',      color: 'Hijau' },
    { min: 5,  label: '⚔️ Senshi',       color: 'Biru' },
    { min: 10, label: '🔥 Yuusha',       color: 'Oranye' },
    { min: 20, label: '💎 Eiyuu',        color: 'Ungu' },
    { min: 35, label: '👑 Densetsu',     color: 'Emas' },
    { min: 50, label: '🌸 Castorice',      color: 'Pink' },
];

// ===== DB UTILS =====

function loadDB() {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({ _info: 'Castorice MD Game Stats', users: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveDB(db) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ===== USER UTILS =====

function getUser(userId) {
    const db = loadDB();
    if (!db.users[userId]) {
        db.users[userId] = createDefaultUser();
        saveDB(db);
    }
    return db.users[userId];
}

function saveUser(userId, data) {
    const db = loadDB();
    db.users[userId] = data;
    saveDB(db);
}

function createDefaultUser() {
    return {
        koin: 0,
        xp: 0,
        level: 1,
        rank: RANKS[0].label,
        streak: 0,
        lastDaily: null,
        stats: {
            win: 0,
            loss: 0,
            draw: 0,
            totalGame: 0
        },
        createdAt: Date.now()
    };
}

// ===== XP & LEVEL =====

function xpToNextLevel(level) {
    return Math.floor(XP_BASE * Math.pow(level, 1.5));
}

function getRank(level) {
    let rank = RANKS[0];
    for (const r of RANKS) {
        if (level >= r.min) rank = r;
    }
    return rank;
}

/**
 * Tambah XP ke user, auto level up kalau cukup
 * @returns {{ levelUp: boolean, newLevel: number }}
 */
function addXP(userId, amount) {
    const user = getUser(userId);
    user.xp += amount;

    let levelUp = false;
    while (user.xp >= xpToNextLevel(user.level)) {
        user.xp -= xpToNextLevel(user.level);
        user.level += 1;
        levelUp = true;
    }

    user.rank = getRank(user.level).label;
    saveUser(userId, user);

    return { levelUp, newLevel: user.level };
}

// ===== KOIN =====

function addKoin(userId, amount) {
    const user = getUser(userId);
    user.koin += amount;
    saveUser(userId, user);
    return user.koin;
}

function deductKoin(userId, amount) {
    const user = getUser(userId);
    if (user.koin < amount) return false;
    user.koin -= amount;
    saveUser(userId, user);
    return true;
}

// ===== GAME RESULT =====

/**
 * Catat hasil game
 * @param {string} userId
 * @param {'win'|'loss'|'draw'} result
 * @param {number} koinReward - koin yang didapat (0 kalau loss)
 * @param {number} xpReward
 */
function recordGame(userId, result, koinReward = 0, xpReward = 10) {
    const user = getUser(userId);

    user.stats[result] += 1;
    user.stats.totalGame += 1;

    if (koinReward > 0) user.koin += koinReward;

    saveUser(userId, user);

    const { levelUp, newLevel } = addXP(userId, xpReward);
    return { levelUp, newLevel, koin: user.koin };
}

// ===== DAILY =====

const DAILY_REWARD = 100; // koin flat
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000; // 24 jam

function claimDaily(userId) {
    const user = getUser(userId);
    const now = Date.now();

    if (user.lastDaily && (now - user.lastDaily) < DAILY_COOLDOWN) {
        const sisaMs = DAILY_COOLDOWN - (now - user.lastDaily);
        const sisaJam = Math.floor(sisaMs / 3600000);
        const sisaMenit = Math.floor((sisaMs % 3600000) / 60000);
        return { success: false, sisaJam, sisaMenit };
    }

    // Hitung streak
    const kemarin = now - DAILY_COOLDOWN;
    if (user.lastDaily && user.lastDaily >= kemarin - 3600000) {
        user.streak += 1;
    } else {
        user.streak = 1;
    }

    // Bonus streak tiap 7 hari
    const bonusStreak = user.streak % 7 === 0 ? DAILY_REWARD : 0;
    const totalReward = DAILY_REWARD + bonusStreak;

    user.koin += totalReward;
    user.lastDaily = now;
    saveUser(userId, user);

    addXP(userId, 20);

    return { success: true, reward: totalReward, bonusStreak, streak: user.streak };
}

// ===== LEADERBOARD =====

function getLeaderboard(type = 'koin', limit = 10) {
    const db = loadDB();
    const users = Object.entries(db.users);

    const sorted = users.sort((a, b) => {
        const ua = a[1], ub = b[1];
        if (type === 'koin') return ub.koin - ua.koin;
        if (type === 'win') return ub.stats.win - ua.stats.win;
        if (type === 'xp') return (ub.level * 1000 + ub.xp) - (ua.level * 1000 + ua.xp);
        return 0;
    });

    return sorted.slice(0, limit).map(([id, data], i) => ({
        rank: i + 1,
        id,
        koin: data.koin,
        xp: data.xp,
        level: data.level,
        rankLabel: data.rank,
        win: data.stats.win,
        totalGame: data.stats.totalGame
    }));
}

module.exports = {
    getUser,
    saveUser,
    addXP,
    addKoin,
    deductKoin,
    recordGame,
    claimDaily,
    getLeaderboard,
    xpToNextLevel,
    getRank,
    DAILY_REWARD,
    RANKS
};