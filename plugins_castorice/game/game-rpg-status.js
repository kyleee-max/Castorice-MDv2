/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/
const { generateWAMessageFromContent } = require('@whiskeysocket/baileys');
const { getChar, saveChar, CLASSES } = require('../../lib/rpg-helper');
const { getUser } = require('../../lib/stats-helper');
const { getPlayer, getGuildRank } = require('../../lib/mining-helper');
const ITEMS = require('../../database/items.json');

function generateBar(current, max, length = 10) {
    const filled = Math.round((Math.min(current, max) / max) * length);
    return `[${'█'.repeat(Math.max(0, filled))}${'░'.repeat(Math.max(0, length - filled))}] ${Math.round((Math.min(current, max) / max) * 100)}%`;
}

function getItemData(itemId) {
    for (const [slot, items] of Object.entries(ITEMS.equipment || {})) {
        if (items[itemId]) return { slot, item: items[itemId] };
    }
    return null;
}

const SLOT_MAP = {
    weapons:   { label: 'Senjata',   emoji: '⚔️' },
    armor:     { label: 'Armor',     emoji: '🛡️' },
    accessory: { label: 'Aksesoris', emoji: '💍' }
};

module.exports = {
    name: "RPG Status",
    command: ["rpgstatus", "rpg-status", "rpgstat"],
    category: "game",
    run: async (castorice, m, { prefix }) => {
        const userId = m.sender;

        const char = getChar(userId);
        if (!char) return m.reply(`❌ Kamu belum punya karakter RPG!\n${prefix}rpg start`);

        const cls = CLASSES[char.class];
        const globalUser = getUser(userId);
        let player = getPlayer(userId);
        const rankData = getGuildRank(player.guildPoint);

        char.equipment = char.equipment || {};
        char.buffs = char.buffs || [];

        // ── HP Bar ──
        const hpBar = generateBar(char.hp, char.maxHp);
        const hpPct = Math.round((char.hp / char.maxHp) * 100);
        const hpStatus = hpPct >= 75 ? '🟢' : hpPct >= 40 ? '🟡' : '🔴';

        // ── Equipment terpasang ──
        const eqLines = Object.entries(SLOT_MAP).map(([slot, info]) => {
            const itemId = char.equipment[slot];
            if (!itemId) return `${info.emoji} ${info.label}: _Kosong_`;
            const found = getItemData(itemId);
            return `${info.emoji} ${info.label}: *${found?.item?.name || itemId}*`;
        }).join('\n');

        // ── Bonus stats dari equipment ──
        let bonusAtk = 0, bonusDef = 0, bonusInt = 0, bonusAgi = 0, bonusCrit = 0;
        for (const itemId of Object.values(char.equipment)) {
            if (!itemId) continue;
            const found = getItemData(itemId);
            if (!found) continue;
            const { item } = found;
            bonusAtk  += item.atk  || 0;
            bonusDef  += item.def  || 0;
            bonusInt  += item.int  || 0;
            bonusAgi  += item.agi  || 0;
            bonusCrit += item.crit || 0;
        }

        // ── Buff aktif ──
        const now = Date.now();
        const activeBuffs = (char.buffs || []).filter(b => b.expiresAt > now);
        // Bersihkan buff expired
        if (activeBuffs.length !== (char.buffs || []).length) {
            char.buffs = activeBuffs;
            saveChar(userId, char);
        }
        const buffLines = activeBuffs.length
            ? activeBuffs.map(b => {
                const sisa = Math.ceil((b.expiresAt - now) / 60000);
                return `✨ *${b.name}* — ${b.desc} (${sisa} menit lagi)`;
            }).join('\n')
            : '_Tidak ada buff aktif_';

        const statusText =
`${cls.emoji} *RPG Status — @${userId.split('@')[0]}*
━━━━━━━━━━━━━━━━━━━━
🎭 Kelas: *${cls.name}* | 🌍 Floor: ${char.floor || 1}
🏛️ Guild: ${rankData.label}
📊 Level: ${globalUser.level} | ✨ XP: ${globalUser.xp}

${hpStatus} *HP: ${char.hp}/${char.maxHp}*
${hpBar}

*📊 Stats:*
⚔️ ATK: ${char.atk}${bonusAtk ? ` _(+${bonusAtk} eq)_` : ''}
🛡️ DEF: ${char.def}${bonusDef ? ` _(+${bonusDef} eq)_` : ''}
✨ INT: ${char.int}${bonusInt ? ` _(+${bonusInt} eq)_` : ''}
💨 AGI: ${char.agi}${bonusAgi ? ` _(+${bonusAgi} eq)_` : ''}
🎯 CRIT: ${char.crit}%${bonusCrit ? ` _(+${bonusCrit} eq)_` : ''}

*⚔️ Equipment:*
${eqLines}

*✨ Buff Aktif:*
${buffLines}
━━━━━━━━━━━━━━━━━━━━`;

        // Button navigasi cepat
        const buttons = [
            {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: "⚡ Aksi Cepat",
                    sections: [
                        {
                            title: "🧭 Navigasi RPG",
                            rows: [
                                { title: "💚 Heal HP", description: "Pulihkan HP dengan koin/item", id: `${prefix}rpgheal info` },
                                { title: "⚔️ Kelola Equipment", description: "Pasang/lepas equipment", id: `${prefix}rpgequip info` },
                                { title: "🏰 Masuk Dungeon", description: "Battle monster", id: `${prefix}rpg dungeon` },
                                { title: "🎒 Inventory", description: "Lihat semua item & ore", id: `${prefix}rpg inv` },
                                { title: "🏪 Shop", description: "Beli item & equipment", id: `${prefix}rpg shop` }
                            ]
                        }
                    ]
                })
            }
        ];

        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: { message: { interactiveMessage: {
                body: { text: statusText },
                footer: { text: '' },
                nativeFlowMessage: { buttons }
            }}}
        }, { quoted: m });

        return await castorice.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    }
};