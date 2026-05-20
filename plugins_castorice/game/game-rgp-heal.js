/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/
const { getChar, saveChar, CLASSES } = require('../../lib/rpg-helper');
const { getUser, deductKoin } = require('../../lib/stats-helper');
const ITEMS = require('../../database/items.json');

// Biaya heal per 10% HP
const HEAL_COST_PER_10 = 30;

function generateBar(current, max, length = 10) {
    const filled = Math.round((Math.min(current, max) / max) * length);
    return `[${'█'.repeat(Math.max(0, filled))}${'░'.repeat(Math.max(0, length - filled))}] ${Math.round((Math.min(current, max) / max) * 100)}%`;
}

module.exports = {
    name: "RPG Heal",
    command: ["rpgheal", "rpg-heal"],
    category: "game",
    run: async (castorice, m, { prefix, args }) => {
        const userId = m.sender;
        const sub = args[0]?.toLowerCase();

        const char = getChar(userId);
        if (!char) return m.reply(`❌ Kamu belum punya karakter RPG!\n${prefix}rpg start`);
        if (char.inDungeon) return m.reply(`⚠️ Tidak bisa heal saat sedang dalam pertarungan!\nSelesaikan dulu: ${prefix}rpg attack | flee`);

        const cls = CLASSES[char.class];
        const hpMissing = char.maxHp - char.hp;
        const hpBar = generateBar(char.hp, char.maxHp);

        // ── Info / tanpa argumen ──
        if (!sub || sub === 'info') {
            if (char.hp >= char.maxHp) {
                return m.reply(
`💚 *RPG Heal*

${cls.emoji} HP kamu sudah penuh!
❤️ HP: ${char.hp}/${char.maxHp}
${hpBar}`
                );
            }

            const globalUser = getUser(userId);
            const healOptions = [
                `• *25%* HP → 💰 ${Math.ceil(char.maxHp * 0.25 / 10) * HEAL_COST_PER_10} koin`,
                `• *50%* HP → 💰 ${Math.ceil(char.maxHp * 0.5 / 10) * HEAL_COST_PER_10} koin`,
                `• *75%* HP → 💰 ${Math.ceil(char.maxHp * 0.75 / 10) * HEAL_COST_PER_10} koin`,
                `• *full* HP → 💰 ${Math.ceil(hpMissing / 10) * HEAL_COST_PER_10} koin`,
            ].join('\n');

            // Cek consumable di inventory
            const consumables = (char.inventory || []).filter(id => ITEMS.consumables[id]);
            const itemList = consumables.length
                ? consumables.map(id => {
                    const it = ITEMS.consumables[id];
                    return `${it.emoji} ${it.name} (+${it.heal} HP) — ID: \`${id}\``;
                }).join('\n')
                : '_Tidak ada item consumable_';

            return m.reply(
`💚 *RPG Heal — Pilih Cara*

${cls.emoji} HP: ${char.hp}/${char.maxHp}
${hpBar}
💰 Koin: ${globalUser.koin.toLocaleString('id-ID')}

*🏥 Heal dengan Koin:*
${healOptions}
Cara: *${prefix}rpgheal koin <25|50|75|full>*

*💊 Heal dengan Item:*
${itemList}
Cara: *${prefix}rpgheal item <id>*`
            );
        }

        // ── Heal pakai koin ──
        if (sub === 'koin') {
            const pilihan = args[1]?.toLowerCase();
            if (!pilihan) return m.reply(`❌ Pilih: *${prefix}rpgheal koin <25|50|75|full>*`);

            if (char.hp >= char.maxHp) return m.reply(`💚 HP kamu sudah penuh!`);

            const persen = { '25': 0.25, '50': 0.5, '75': 0.75, 'full': 1 }[pilihan];
            if (!persen) return m.reply(`❌ Pilihan tidak valid! Gunakan: 25 | 50 | 75 | full`);

            const healAmount = pilihan === 'full'
                ? hpMissing
                : Math.min(Math.floor(char.maxHp * persen), hpMissing);

            const cost = Math.ceil(healAmount / 10) * HEAL_COST_PER_10;
            const globalUser = getUser(userId);

            if (globalUser.koin < cost) {
                return m.reply(`❌ Koin tidak cukup!\nButuh: ${cost} koin | Punya: ${globalUser.koin} koin`);
            }

            deductKoin(userId, cost);
            char.hp = Math.min(char.hp + healAmount, char.maxHp);
            saveChar(userId, char);

            const newBar = generateBar(char.hp, char.maxHp);
            return m.reply(
`✅ *Heal Berhasil!*

${cls.emoji} *${cls.name}*
❤️ +${healAmount} HP
❤️ HP: ${char.hp}/${char.maxHp}
${newBar}

💰 -${cost} Koin`
            );
        }

        // ── Heal pakai item ──
        if (sub === 'item') {
            const itemId = args[1];
            if (!itemId) return m.reply(`❌ Cara: *${prefix}rpgheal item <id>*`);

            const invIdx = (char.inventory || []).indexOf(itemId);
            if (invIdx === -1) return m.reply(`❌ Item *${itemId}* tidak ada di inventory!`);

            const item = ITEMS.consumables[itemId];
            if (!item) return m.reply(`❌ *${itemId}* bukan consumable!`);
            if (!item.heal) return m.reply(`❌ Item ini tidak bisa heal HP!`);

            const healAmount = Math.min(item.heal, char.maxHp - char.hp);
            char.hp = Math.min(char.hp + healAmount, char.maxHp);
            char.inventory.splice(invIdx, 1); // hapus 1 item
            saveChar(userId, char);

            const newBar = generateBar(char.hp, char.maxHp);
            return m.reply(
`✅ *Item Digunakan!*

${item.emoji} *${item.name}*
❤️ +${healAmount} HP
❤️ HP: ${char.hp}/${char.maxHp}
${newBar}`
            );
        }

        return m.reply(`❌ Cara:\n• ${prefix}rpgheal koin <25|50|75|full>\n• ${prefix}rpgheal item <id>\n• ${prefix}rpgheal info`);
    }
};