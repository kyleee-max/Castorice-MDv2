/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/
const { getChar, saveChar, CLASSES } = require('../../lib/rpg-helper');
const ITEMS = require('../../database/items.json');

const SLOT_MAP = {
    weapons:   { label: 'Senjata',    emoji: '⚔️' },
    armor:     { label: 'Armor',      emoji: '🛡️' },
    accessory: { label: 'Aksesoris',  emoji: '💍' }
};

function getItemData(itemId) {
    for (const [slot, items] of Object.entries(ITEMS.equipment || {})) {
        if (items[itemId]) return { slot, item: items[itemId] };
    }
    return null;
}

function applyEquipment(char) {
    const eq = char.equipment || {};
    const base = CLASSES[char.class];
    if (!base) return char;

    // Reset stats ke base dulu
    const globalBonus = Math.floor(((char.floor || 1) - 1) * 1.5);
    char.atk  = base.atk  + Math.floor(globalBonus / 3);
    char.def  = base.def  + Math.floor(globalBonus / 4);
    char.int  = base.int  + Math.floor(globalBonus / 3);
    char.agi  = base.agi;
    char.crit = base.crit;

    // Tambahin bonus dari semua equipment yang dipakai
    for (const itemId of Object.values(eq)) {
        if (!itemId) continue;
        const found = getItemData(itemId);
        if (!found) continue;
        const { item } = found;
        if (item.atk)  char.atk  += item.atk;
        if (item.def)  char.def  += item.def;
        if (item.int)  char.int  += item.int;
        if (item.agi)  char.agi  += item.agi;
        if (item.crit) char.crit += item.crit;
    }

    return char;
}

module.exports = {
    name: "RPG Equip",
    command: ["rpgequip", "rpg-equip"],
    category: "game",
    run: async (castorice, m, { prefix, args }) => {
        const userId = m.sender;
        const sub = args[0]?.toLowerCase();

        const char = getChar(userId);
        if (!char) return m.reply(`❌ Kamu belum punya karakter RPG!\n${prefix}rpg start`);

        const cls = CLASSES[char.class];
        char.equipment = char.equipment || {};

        // ── Lihat equipment yang dipakai ──
        if (!sub || sub === 'info' || sub === 'list') {
            const slots = Object.entries(SLOT_MAP).map(([slot, info]) => {
                const itemId = char.equipment[slot];
                if (!itemId) return `${info.emoji} ${info.label}: _Kosong_`;
                const found = getItemData(itemId);
                const item = found?.item;
                return `${info.emoji} ${info.label}: *${item?.name || itemId}* (\`${itemId}\`)`;
            }).join('\n');

            // Daftar equipment di inventory yang bisa dipakai
            const equipInv = (char.inventory || []).filter(id => getItemData(id));
            const invList = equipInv.length
                ? equipInv.map(id => {
                    const { slot, item } = getItemData(id);
                    const stats = [];
                    if (item.atk)  stats.push(`+${item.atk} ATK`);
                    if (item.def)  stats.push(`+${item.def} DEF`);
                    if (item.int)  stats.push(`+${item.int} INT`);
                    if (item.agi)  stats.push(`+${item.agi} AGI`);
                    if (item.crit) stats.push(`+${item.crit} CRIT`);
                    return `${item.emoji} *${item.name}* [${SLOT_MAP[slot].label}]${stats.length ? ` — ${stats.join(', ')}` : ''}\n   ID: \`${id}\``;
                }).join('\n\n')
                : '_Tidak ada equipment di inventory_';

            return m.reply(
`⚔️ *RPG Equipment — @${userId.split('@')[0]}*

${cls.emoji} Kelas: *${cls.name}*

*📦 Equipment Terpasang:*
${slots}

*🎒 Equipment di Inventory:*
${invList}

Cara pasang: *${prefix}rpgequip <id>*
Cara lepas: *${prefix}rpgequip lepas <slot>*
_(slot: weapons | armor | accessory)_`,
            { mentions: [userId] });
        }

        // ── Lepas equipment ──
        if (sub === 'lepas' || sub === 'unequip') {
            const slot = args[1]?.toLowerCase();
            if (!slot || !SLOT_MAP[slot]) {
                return m.reply(`❌ Slot tidak valid!\nSlot tersedia: *weapons | armor | accessory*\nCara: *${prefix}rpgequip lepas <slot>*`);
            }

            const itemId = char.equipment[slot];
            if (!itemId) return m.reply(`❌ Slot *${SLOT_MAP[slot].label}* sudah kosong!`);

            const found = getItemData(itemId);
            const item = found?.item;

            // Kembalikan ke inventory
            char.inventory = char.inventory || [];
            char.inventory.push(itemId);
            delete char.equipment[slot];

            applyEquipment(char);
            saveChar(userId, char);

            return m.reply(
`✅ *Equipment Dilepas!*

${item?.emoji || '📦'} *${item?.name || itemId}* dilepas dari slot ${SLOT_MAP[slot].emoji} ${SLOT_MAP[slot].label}
📦 Kembali ke inventory

*Stats sekarang:*
⚔️ ATK: ${char.atk} | 🛡️ DEF: ${char.def}
✨ INT: ${char.int} | 💨 AGI: ${char.agi} | 🎯 CRIT: ${char.crit}%`
            );
        }

        // ── Pasang equipment ──
        const itemId = sub;
        const invIdx = (char.inventory || []).indexOf(itemId);
        if (invIdx === -1) return m.reply(`❌ Item *${itemId}* tidak ada di inventory!\nCek: ${prefix}rpgequip info`);

        const found = getItemData(itemId);
        if (!found) return m.reply(`❌ *${itemId}* bukan equipment!\nUntuk consumable pakai: ${prefix}rpgheal item <id>`);

        const { slot, item } = found;

        // Cek class requirement
        if (item.class && !item.class.includes(char.class)) {
            return m.reply(`❌ Item ini hanya untuk kelas: *${item.class.join(', ')}*\nKelasmu: ${cls.name}`);
        }

        // Kalau slot sudah terisi, kembalikan item lama ke inventory
        const oldItemId = char.equipment[slot];
        if (oldItemId) {
            char.inventory.push(oldItemId);
        }

        // Pasang item baru
        char.inventory.splice(invIdx, 1);
        char.equipment[slot] = itemId;

        applyEquipment(char);
        saveChar(userId, char);

        const stats = [];
        if (item.atk)  stats.push(`+${item.atk} ATK`);
        if (item.def)  stats.push(`+${item.def} DEF`);
        if (item.int)  stats.push(`+${item.int} INT`);
        if (item.agi)  stats.push(`+${item.agi} AGI`);
        if (item.crit) stats.push(`+${item.crit} CRIT`);

        return m.reply(
`✅ *Equipment Terpasang!*

${item.emoji} *${item.name}*
${SLOT_MAP[slot].emoji} Slot: ${SLOT_MAP[slot].label}
📊 Bonus: ${stats.length ? stats.join(', ') : '-'}
${oldItemId ? `\n🔄 Item lama (${oldItemId}) dikembalikan ke inventory` : ''}

*Stats sekarang:*
⚔️ ATK: ${char.atk} | 🛡️ DEF: ${char.def}
✨ INT: ${char.int} | 💨 AGI: ${char.agi} | 🎯 CRIT: ${char.crit}%`
        );
    }
};