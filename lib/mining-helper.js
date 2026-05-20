/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const fs = require('fs');
const path = require('path');
const { addXP, addKoin } = require('./stats-helper');

const MINING_DB_PATH = path.join(__dirname, '../database/mining.json');
const ORES = require('../database/ores.json');
const QUESTS = require('../database/quests.json');

// ─── STAMINA CONFIG ───
const MAX_STAMINA = 100;
const STAMINA_RECHARGE_PER_HOUR = 15;
const MINING_STAMINA_COST = 20;

// ─── GUILD RANK THRESHOLDS ───
const GUILD_RANKS = [
    { rank: 'F', min: 0,    label: '🌱 F-Rank', area: 'F' },
    { rank: 'E', min: 100,  label: '⚔️ E-Rank', area: 'E' },
    { rank: 'D', min: 300,  label: '💎 D-Rank', area: 'D' },
    { rank: 'C', min: 700,  label: '🔥 C-Rank', area: 'C' },
    { rank: 'B', min: 1500, label: '👑 B-Rank', area: 'B' },
    { rank: 'A', min: 3000, label: '🌸 A-Rank', area: 'A' }
];

// ─── DB ───
function loadDB() {
    if (!fs.existsSync(MINING_DB_PATH)) {
        fs.writeFileSync(MINING_DB_PATH, JSON.stringify({ _info: 'Castorice MD Mining DB', users: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(MINING_DB_PATH, 'utf-8'));
}

function saveDB(db) {
    fs.writeFileSync(MINING_DB_PATH, JSON.stringify(db, null, 2));
}

function getPlayer(userId) {
    const db = loadDB();
    if (!db.users[userId]) {
        db.users[userId] = createDefault();
        saveDB(db);
    }
    return db.users[userId];
}

function savePlayer(userId, data) {
    const db = loadDB();
    db.users[userId] = data;
    saveDB(db);
}

function createDefault() {
    return {
        stamina: MAX_STAMINA,
        lastStaminaUpdate: Date.now(),
        guildPoint: 0,
        guildRank: 'F',
        currentQuest: 'F_1',
        questProgress: {},
        ores: {},
        totalMined: 0,
        title: null,
        createdAt: Date.now()
    };
}

// ─── STAMINA ───
function getStamina(player) {
    const now = Date.now();
    const elapsedHours = (now - player.lastStaminaUpdate) / 3600000;
    const recharged = Math.floor(elapsedHours * STAMINA_RECHARGE_PER_HOUR);
    const newStamina = Math.min(MAX_STAMINA, player.stamina + recharged);
    if (recharged > 0) {
        player.stamina = newStamina;
        player.lastStaminaUpdate = now;
    }
    return player;
}

function nextRechargeMinutes(player) {
    const msPerUnit = 3600000 / STAMINA_RECHARGE_PER_HOUR;
    const elapsed = Date.now() - player.lastStaminaUpdate;
    const remaining = msPerUnit - (elapsed % msPerUnit);
    return Math.ceil(remaining / 60000);
}

// ─── GUILD RANK ───
function getGuildRank(guildPoint) {
    let current = GUILD_RANKS[0];
    for (const r of GUILD_RANKS) {
        if (guildPoint >= r.min) current = r;
    }
    return current;
}

function getNextGuildRank(guildPoint) {
    for (let i = 0; i < GUILD_RANKS.length; i++) {
        if (guildPoint < GUILD_RANKS[i].min) return GUILD_RANKS[i];
    }
    return null;
}

// ─── MINING ───
function doMine(userId) {
    let player = getPlayer(userId);
    player = getStamina(player);

    if (player.stamina < MINING_STAMINA_COST) {
        const mins = nextRechargeMinutes(player);
        return { success: false, reason: 'stamina', stamina: player.stamina, nextRecharge: mins };
    }

    const rank = getGuildRank(player.guildPoint);
    const area = ORES.areas[rank.area];
    const availableOres = area.ores;

    // Random ore dari area berdasarkan dropRate
    let mined = null;
    for (const oreId of availableOres.sort(() => Math.random() - 0.5)) {
        const ore = ORES.ores[oreId];
        if (Math.random() < ore.dropRate) {
            mined = { id: oreId, ...ore };
            break;
        }
    }

    player.stamina -= MINING_STAMINA_COST;
    player.lastStaminaUpdate = Date.now();

    if (mined) {
        player.ores[mined.id] = (player.ores[mined.id] || 0) + 1;
        player.totalMined++;
        updateQuestProgress(player, 'mine', mined.id, 1);
    }

    savePlayer(userId, player);
    return {
        success: true,
        mined,
        area,
        stamina: player.stamina,
        maxStamina: MAX_STAMINA
    };
}

// ─── JUAL ORE ───
function sellOres(userId, oreId, amount) {
    let player = getPlayer(userId);
    const ore = ORES.ores[oreId];
    if (!ore) return { success: false, reason: 'invalid_ore' };

    const owned = player.ores[oreId] || 0;
    const qty = amount === 'all' ? owned : Math.min(parseInt(amount) || 1, owned);

    if (qty <= 0) return { success: false, reason: 'not_enough' };

    const totalKoin = qty * ore.sellPrice;
    const totalGP = qty * ore.guildPoint;

    player.ores[oreId] -= qty;
    if (player.ores[oreId] <= 0) delete player.ores[oreId];

    player.guildPoint += totalGP;

    const oldRank = player.guildRank;
    const newRankData = getGuildRank(player.guildPoint);
    player.guildRank = newRankData.rank;
    const rankUp = oldRank !== newRankData.rank;

    savePlayer(userId, player);
    addKoin(userId, totalKoin);
    addXP(userId, Math.floor(totalGP / 5));

    return { success: true, qty, totalKoin, totalGP, rankUp, newRank: newRankData };
}

// ─── CRAFT ───
function craftItem(userId, recipeId) {
    let player = getPlayer(userId);
    const recipe = ORES.craftRecipes[recipeId];
    if (!recipe) return { success: false, reason: 'invalid_recipe' };

    // Cek bahan
    for (const [oreId, qty] of Object.entries(recipe.materials)) {
        if ((player.ores[oreId] || 0) < qty) {
            return { success: false, reason: 'missing_material', missing: oreId, need: qty, have: player.ores[oreId] || 0 };
        }
    }

    // Kurangi bahan
    for (const [oreId, qty] of Object.entries(recipe.materials)) {
        player.ores[oreId] -= qty;
        if (player.ores[oreId] <= 0) delete player.ores[oreId];
    }

    savePlayer(userId, player);

    // Tambah item ke RPG inventory
    try {
        const { getChar, saveChar } = require('./rpg-helper');
        const char = getChar(userId);
        if (char) {
            char.inventory = char.inventory || [];
            char.inventory.push(recipe.result);
            saveChar(userId, char);
        }
    } catch (e) {}

    return { success: true, recipe };
}

// ─── QUEST ───
function updateQuestProgress(player, type, target, amount) {
    if (!player.currentQuest) return;
    const quest = QUESTS.quests[player.currentQuest];
    if (!quest) return;

    const objectives = quest.objectives[type];
    if (!objectives || !objectives[target]) return;

    if (!player.questProgress[player.currentQuest]) {
        player.questProgress[player.currentQuest] = {};
    }

    const prog = player.questProgress[player.currentQuest];
    prog[target] = (prog[target] || 0) + amount;
}

function checkQuestComplete(userId) {
    let player = getPlayer(userId);
    if (!player.currentQuest) return { complete: false };

    const quest = QUESTS.quests[player.currentQuest];
    if (!quest) return { complete: false };

    const prog = player.questProgress[player.currentQuest] || {};

    // Cek semua objective
    for (const [type, targets] of Object.entries(quest.objectives)) {
        for (const [target, needed] of Object.entries(targets)) {
            if ((prog[target] || 0) < needed) return { complete: false, quest, prog };
        }
    }

    // Quest complete!
    const reward = quest.reward;
    addKoin(userId, reward.koin || 0);
    addXP(userId, reward.xp || 0);

    player.guildPoint += reward.guildPoint || 0;
    if (reward.title) player.title = reward.title;

    const oldRank = player.guildRank;
    const newRankData = getGuildRank(player.guildPoint);
    player.guildRank = newRankData.rank;
    const rankUp = reward.rankUp || (oldRank !== newRankData.rank);

    player.currentQuest = quest.next;
    savePlayer(userId, player);

    return { complete: true, quest, reward, rankUp, newRank: newRankData };
}

function recordKill(userId, monsterId) {
    let player = getPlayer(userId);
    updateQuestProgress(player, 'kill', monsterId, 1);
    updateQuestProgress(player, 'bosskill', monsterId, 1);
    savePlayer(userId, player);
    return checkQuestComplete(userId);
}

module.exports = {
    getPlayer,
    savePlayer,
    getStamina,
    getGuildRank,
    getNextGuildRank,
    doMine,
    sellOres,
    craftItem,
    checkQuestComplete,
    recordKill,
    updateQuestProgress,
    GUILD_RANKS,
    MAX_STAMINA,
    MINING_STAMINA_COST,
    ORES,
    QUESTS
};