/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const { generateWAMessageFromContent, prepareWAMessageMedia, proto } = require('@whiskeysocket/baileys');
const { getPluginsByCategory, getCategoryStats, HIDDEN_CATEGORIES } = require('../../lib/plugin-scanner');

const CATEGORY_EMOJI = {
    ai: '🤖', download: '📥', converter: '🔄', sticker: '🎭',
    tools: '🛠️', stalker: '🔍', group: '👥', game: '🎮',
    info: 'ℹ️', fun: '🎉', islamic: '☪️', maker: '🎨',
    anime: '🌸', main: '🏠', owner: '👑', primbon: '✨', cek: '👀'
};

module.exports = {
    name: "Category Menu",
    command: ["cmenu"],
    category: "main",
    run: async (castorice, m, { prefix, args, isOwner }) => {
        const categoryId = args[0]?.toLowerCase();

        // Scan semua kategori fresh
        const allCategories = getCategoryStats(isOwner);
        const visibleCategories = allCategories.filter(c =>
            isOwner ? true : !HIDDEN_CATEGORIES.includes(c.category)
        );

        if (!categoryId) {
            const list = visibleCategories.map(c =>
                `• ${CATEGORY_EMOJI[c.category] || '📂'} ${capitalize(c.category)} (${c.totalFeatures} fitur)`
            ).join('\n');
            return m.reply(`❌ Cara pakai: ${prefix}cmenu <kategori>\n\nDaftar kategori:\n${list}`);
        }

        // Cari kategori di hasil scan
        const catData = allCategories.find(c => c.category === categoryId);

        if (!catData) {
            return m.reply(`❌ Kategori *${categoryId}* tidak ditemukan.`);
        }

        // Owner category hanya untuk owner
        if (HIDDEN_CATEGORIES.includes(categoryId) && !isOwner) {
            return m.reply(global.mess.owner);
        }

        const emoji = CATEGORY_EMOJI[categoryId] || '📂';

        // Build list command — minimalis clean style
        const cmdList = catData.plugins.map(plugin => {
            const allCmds = plugin.command.map(c => `${prefix}${c}`).join(', ');
            return `› ${allCmds} — ${plugin.name}`;
        }).join('\n');

        const divider = '─────────────────────';
        const bodyText = `${emoji} *${capitalize(categoryId).toUpperCase()} MENU*\n${divider}\n${cmdList}\n${divider}\n_Total: ${catData.totalFeatures} fitur • ${catData.totalCommands} perintah_`;

        // Nav rows dari kategori lain
        const navRows = visibleCategories.map(c => ({
            header: capitalize(c.category),
            title: `${c.category === categoryId ? '✅ ' : ''}${CATEGORY_EMOJI[c.category] || '📂'} ${capitalize(c.category)}`,
            description: `${c.totalFeatures} Fitur • ${c.totalCommands} Perintah`,
            id: `${prefix}cmenu ${c.category}`
        }));

        const buttons = [
            {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: "🗂️ Ganti Kategori",
                    sections: [
                        {
                            title: "🏠 Navigasi",
                            rows: [
                                {
                                    header: "Menu",
                                    title: "🏠 Kembali ke Menu Utama",
                                    description: "Kembali ke menu utama",
                                    id: `${prefix}menu`
                                }
                            ]
                        },
                        {
                            title: "✨ Kategori",
                            rows: navRows
                        }
                    ]
                })
            }
        ];

        let msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: ``,
                            hasMediaAttachment: true,
                            ...(await prepareWAMessageMedia(
                                { image: { url: global.thumb.menu } },
                                { upload: castorice.waUploadToServer }
                            ))
                        },
                        body: { text: bodyText },
                        footer: { text: `` },
                        nativeFlowMessage: { buttons },
                        contextInfo: { mentionedJid: [m.sender] }
                    }
                }
            }
        }, { quoted: m });

        await castorice.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    }
};

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}