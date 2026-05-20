/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const fs = require('fs');
const path = require('path');
const { addXP, addKoin, getUser } = require('./stats-helper');

const RPG_PATH = path.join(__dirname, '../database/rpg.json');
const MONSTERS = require('../database/monsters.json');
const ITEMS = require('../database/items.json');

// ===== KELAS =====
const CLASSES = {
    warrior:  { name: 'Warrior',  emoji: '⚔️',  hp: 150, atk: 20, def: 15, int: 5,  agi: 8,  crit: 8,  desc: 'Pejuang kuat dengan ATK & DEF tinggi' },
    mage:     { name: 'Mage',     emoji: '🧙',  hp: 80,  atk: 8,  def: 5,  int: 30, agi: 10, crit: 12, desc: 'Penyihir powerful dengan INT sangat tinggi' },
    archer:   { name: 'Archer',   emoji: '🏹',  hp: 110, atk: 15, def: 8,  int: 10, agi: 25, crit: 15, desc: 'Penembak lincah dengan AGI & CRIT tinggi' },
    healer:   { name: 'Healer',   emoji: '💚',  hp: 130, atk: 8,  def: 12, int: 20, agi: 10, crit: 5,  desc: 'Penyembuh dengan HP tinggi & skill heal' },
    assassin: { name: 'Assassin', emoji: '🗡️',  hp: 90,  atk: 18, def: 5,  int: 8,  agi: 20, crit: 30, desc: 'Pembunuh bayaran dengan CRIT sangat tinggi' },
    knight:   { name: 'Knight',   emoji: '🛡️',  hp: 200, atk: 12, def: 30, int: 5,  agi: 5,  crit: 5,  desc: 'Tank sejati dengan DEF & HP tertinggi' }
};

const CLASS_CHANGE_COST = 500;

// Rank dungeon berdasarkan level
const DUNGEON_RANK = [
    { min: 1,  rank: 'F' },
    { min: 5,  rank: 'E' },
    { min: 10, rank: 'D' },
    { min: 20, rank: 'C' },
    { min: 35, rank: 'B' },
    { min: 50, rank: 'A' }
];

// ===== DB =====
function loadRPG() {
    if (!fs.existsSync(RPG_PATH)) {
        fs.writeFileSync(RPG_PATH, JSON.stringify({ _info: 'Castorice MD RPG Database', characters: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(RPG_PATH, 'utf-8'));
}

function saveRPG(db) {
    fs.writeFileSync(RPG_PATH, JSON.stringify(db, null, 2));
}

function getChar(userId) {
    const db = loadRPG();
    return db.characters[userId] || null;
}

function saveChar(userId, char) {
    const db = loadRPG();
    db.characters[userId] = char;
    saveRPG(db);
}

// ===== CHARACTER =====
function createChar(userId, className) {
    const cls = CLASSES[className];
    if (!cls) return null;

    const globalUser = getUser(userId);
    const bonus = Math.floor(globalUser.level * 1.5);

    return {
        class: className,
        hp: cls.hp + bonus,
        maxHp: cls.hp + bonus,
        atk: cls.atk + Math.floor(bonus / 3),
        def: cls.def + Math.floor(bonus / 4),
        int: cls.int + Math.floor(bonus / 3),
        agi: cls.agi,
        crit: cls.crit,
        floor: 1,
        inventory: [],
        equipment: { weapon: null, armor: null, accessory: null },
        inDungeon: false,
        dungeonMonster: null,
        createdAt: Date.now()
    };
}

// ===== DUNGEON =====
function getDungeonRank(level) {
    let rank = 'F';
    for (const r of DUNGEON_RANK) {
        if (level >= r.min) rank = r.rank;
    }
    return rank;
}

function getRandomMonster(rank) {
    const pool = MONSTERS.monsters[rank] || MONSTERS.monsters['F'];
    return { ...pool[Math.floor(Math.random() * pool.length)] };
}

// ===== BATTLE =====
/**
 * Hitung damage dengan variance & crit
 */
function calcDamage(atk, def, crit = 0) {
    const variance = 0.85 + Math.random() * 0.3; // 85%-115%
    const isCrit = Math.random() * 100 < crit;
    const base = Math.max(1, atk - def);
    const dmg = Math.floor(base * variance * (isCrit ? 1.8 : 1));
    return { dmg, isCrit };
}

/**
 * Proses satu turn battle
 * @param {string} userId
 * @param {'attack'|'skill'|'item'|'flee'} action
 * @param {string} itemId - kalau action item
 */
function processTurn(userId, action, itemId = null) {
    const char = getChar(userId);
    if (!char || !char.inDungeon) return { error: 'Kamu tidak sedang di dungeon!' };

    const monster = char.dungeonMonster;
    let log = [];
    let result = 'continue';

    if (action === 'flee') {
        const success = Math.random() < 0.4;
        if (success) {
            char.inDungeon = false;
            char.dungeonMonster = null;
            saveChar(userId, char);
            return { result: 'fled', log: ['💨 Kamu berhasil melarikan diri!'] };
        } else {
            log.push('❌ Gagal melarikan diri!');
            // Monster balas
            const { dmg, isCrit } = calcDamage(monster.atk, char.def, 0);
            char.hp -= dmg;
            log.push(`${monster.emoji} ${monster.name} menyerang: *-${dmg} HP*${isCrit ? ' ⚡ CRIT!' : ''}`);
        }
    } else if (action === 'attack') {
        const { dmg, isCrit } = calcDamage(char.atk, monster.def, char.crit);
        monster.hp -= dmg;
        log.push(`⚔️ Kamu menyerang: *-${dmg} HP*${isCrit ? ' ⚡ CRIT!' : ''}`);

        if (monster.hp <= 0) {
            result = 'win';
        } else {
            // Monster balas
            const { dmg: mDmg, isCrit: mCrit } = calcDamage(monster.atk, char.def, 0);
            char.hp -= mDmg;
            log.push(`${monster.emoji} ${monster.name} membalas: *-${mDmg} HP*${mCrit ? ' ⚡ CRIT!' : ''}`);
        }
    } else if (action === 'skill') {
        // Skill per kelas
        const skillResult = useSkill(char, monster, log);
        char.hp = skillResult.charHp;
        monster.hp = skillResult.monsterHp;
        log = skillResult.log;
        if (monster.hp <= 0) result = 'win';
        else {
            const { dmg: mDmg } = calcDamage(monster.atk, char.def, 0);
            char.hp -= mDmg;
            log.push(`${monster.emoji} ${monster.name} membalas: *-${mDmg} HP*`);
        }
    } else if (action === 'item') {
        const itemResult = useItem(char, itemId, log);
        if (itemResult.error) return { error: itemResult.error };
        char.hp = itemResult.charHp;
        log = itemResult.log;
        // Monster tetap menyerang
        const { dmg: mDmg } = calcDamage(monster.atk, char.def, 0);
        char.hp -= mDmg;
        log.push(`${monster.emoji} ${monster.name} menyerang: *-${mDmg} HP*`);
    }

    // Cek player mati
    if (char.hp <= 0) {
        char.hp = Math.floor(char.maxHp * 0.3); // Respawn 30% HP
        char.inDungeon = false;
        char.dungeonMonster = null;
        saveChar(userId, char);
        return { result: 'lose', log, charHp: char.hp, monster };
    }

    // Update monster
    char.dungeonMonster = monster;
    saveChar(userId, char);

    if (result === 'win') {
        return handleWin(userId, char, monster, log);
    }

    return {
        result: 'continue',
        log,
        charHp: char.hp,
        charMaxHp: char.maxHp,
        monsterHp: monster.hp,
        monsterMaxHp: monster._maxHp || monster.hp + 50,
        monster
    };
}

function handleWin(userId, char, monster, log) {
    const xpGain = monster.xp;
    const koinGain = monster.koin;

    char.inDungeon = false;
    char.dungeonMonster = null;
    char.floor = (char.floor || 1) + 1;
    saveChar(userId, char);

    addXP(userId, xpGain);
    addKoin(userId, koinGain);

    log.push(`\n🏆 *${monster.name} dikalahkan!*`);
    log.push(`💰 +${koinGain} Koin | ✨ +${xpGain} XP`);

    // Drop item
    let drop = null;
    if (monster.drop && Math.random() < 0.3) {
        const item = ITEMS.drops[monster.drop];
        if (item) {
            char.inventory = char.inventory || [];
            char.inventory.push(monster.drop);
            saveChar(userId, char);
            log.push(`🎁 Drop: ${item.emoji} *${item.name}*`);
            drop = item;
        }
    }

    return { result: 'win', log, xpGain, koinGain, drop, floor: char.floor };
}

function useSkill(char, monster, log) {
    const skills = {
        warrior:  () => { const dmg = char.atk * 2; monster.hp -= dmg; log.push(`🔥 *Slash!* -${dmg} HP ke ${monster.name}`); },
        mage:     () => { const dmg = char.int * 2.5; monster.hp -= dmg; log.push(`✨ *Fireball!* -${dmg} HP ke ${monster.name}`); },
        archer:   () => { const dmg = char.atk * 1.5 * 2; monster.hp -= dmg; log.push(`🏹 *Double Shot!* -${dmg} HP ke ${monster.name}`); },
        healer:   () => { const heal = char.int * 2; char.hp = Math.min(char.maxHp, char.hp + heal); log.push(`💚 *Heal!* +${heal} HP`); },
        assassin: () => { const dmg = char.atk * 3; monster.hp -= dmg; log.push(`🗡️ *Shadow Strike!* -${dmg} HP ke ${monster.name} (CRIT!)`); },
        knight:   () => { char.def = Math.floor(char.def * 1.5); log.push(`🛡️ *Guard!* DEF naik sementara`); }
    };
    skills[char.class]?.();
    return { charHp: char.hp, monsterHp: monster.hp, log };
}

function useItem(char, itemId, log) {
    const idx = char.inventory?.indexOf(itemId);
    if (idx === -1 || idx === undefined) return { error: 'Item tidak ada di inventory!' };

    const item = ITEMS.consumables[itemId];
    if (!item) return { error: 'Item tidak dikenali!' };

    char.inventory.splice(idx, 1);

    if (item.heal) {
        const healed = Math.min(item.heal, char.maxHp - char.hp);
        char.hp += healed;
        log.push(`${item.emoji} Pakai *${item.name}*: +${healed} HP`);
    }

    return { charHp: char.hp, log };
}

module.exports = {
    CLASSES,
    CLASS_CHANGE_COST,
    getChar,
    saveChar,
    createChar,
    getDungeonRank,
    getRandomMonster,
    processTurn,
    calcDamage,
    DUNGEON_RANK
};