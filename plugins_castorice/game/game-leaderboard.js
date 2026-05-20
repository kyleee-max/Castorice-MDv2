/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const { generateWAMessageFromContent, proto } = require('@whiskeysocket/baileys');
const { getLeaderboard } = require('../../lib/stats-helper');

const MEDAL = ['🥇', '🥈', '🥉'];

module.exports = {
    name: "Leaderboard",
    command: ["leaderboard", "lb", "ranking", "top"],
    category: "game",
    run: async (castorice, m, { prefix, args }) => {
        const type = args[0]?.toLowerCase() || 'koin';
        const validTypes = ['koin', 'win', 'xp'];

        if (!validTypes.includes(type)) {
            return m.reply(`❌ Tipe tidak valid!\nGunakan: ${prefix}lb koin | win | xp`);
        }

        const data = getLeaderboard(type, 10);

        if (!data.length) {
            return m.reply('📭 Belum ada data leaderboard.');
        }

        const typeLabel = {
            koin: '💰 Koin Terbanyak',
            win: '🏆 Kemenangan Terbanyak',
            xp: '✨ Level / XP Tertinggi'
        };

        const rows = data.map((u, i) => {
            const medal = MEDAL[i] || `${i + 1}.`;
            const value = type === 'koin'
                ? `${u.koin.toLocaleString('id-ID')} Koin`
                : type === 'win'
                ? `${u.win} Menang (${u.totalGame} Game)`
                : `Lv.${u.level} — ${u.xp} XP`;

            return `${medal} @${u.id.split('@')[0]}\n   ${u.rankLabel} • ${value}`;
        }).join('\n\n');

        const txt = `
🏅 *PERINGKAT — ${typeLabel[type]}*

${rows}

_Kategori: ${prefix}lb koin | win | xp_
`.trim();

        const mentions = data.map(u => u.id);

        // Button switch kategori
        const buttons = validTypes
            .filter(t => t !== type)
            .map(t => ({
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: `${t === 'koin' ? '💰' : t === 'win' ? '🏆' : '✨'} Top ${t.toUpperCase()}`,
                    id: `${prefix}lb ${t}`
                })
            }));

        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: txt },
                        footer: { text: `` },
                        nativeFlowMessage: { buttons },
                        contextInfo: { mentionedJid: mentions }
                    }
                }
            }
        }, { quoted: m });

        await castorice.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    }
};