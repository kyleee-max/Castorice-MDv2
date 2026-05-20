/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const os = require('os');
const { performance } = require('perf_hooks');
const { generateWAMessageFromContent, prepareWAMessageMedia, proto } = require('@whiskeysocket/baileys');

const HIDDEN_CATEGORIES = ['owner', 'main'];

const CATEGORY_EMOJI = {
    ai: '🤖', download: '📥', converter: '🔄', sticker: '🎭',
    tools: '🛠️', stalker: '🔍', group: '👥', game: '🎮',
    info: 'ℹ️', fun: '🎉', islamic: '☪️', maker: '🎨',
    anime: '🌸', main: '🏠', owner: '👑', primbon: '✨', cek: '👀'
};

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Hitung & group plugin langsung dari global.plugins
function getPluginStats(includeHidden = false) {
    const grouped = {};
    let total = 0;

    for (const name in global.plugins) {
        const plugin = global.plugins[name];
        const cat = plugin.category || 'other';
        if (cat === 'other') console.log(`[MENU DEBUG] other → name: "${plugin.name}" | cmd: ${JSON.stringify(plugin.command)} | category: ${plugin.category}`);
        if (!includeHidden && HIDDEN_CATEGORIES.includes(cat)) continue;

        if (!grouped[cat]) grouped[cat] = { totalFeatures: 0, totalCommands: 0 };
        grouped[cat].totalFeatures++;
        grouped[cat].totalCommands += Array.isArray(plugin.command) ? plugin.command.length : 1;
        total++;
    }

    let totalCmds = 0;
    for (const cat in grouped) totalCmds += grouped[cat].totalCommands;
    return { grouped, total, totalCmds };
}

module.exports = {
    name: "Main Menu",
    command: ["menu", "help"],
    category: "main",
    run: async (castorice, m, { prefix, runtime, isOwner }) => {
        const start = performance.now();
        const end = performance.now();
        const latensi = (end - start).toFixed(4);
        const usedMemory = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);

        // Ambil dari global.plugins — selalu real-time
        const { grouped, total, totalCmds } = getPluginStats(false);

        const menuTxt = `${isOwner ? `*Selamat datang kembali, @${m.sender.split('@')[0]} Senpai 👑*` : `*Halo, @${m.sender.split('@')[0]}! 👋*`}

> *${global.bot}* siap melayani!
> Bot multi-device By ${global.owner} Senpai.

> - › *Versi:* ${global.version}
> - › *Fitur:* ${total} Fitur • ${totalCmds} Perintah
> - › *Tipe:* CJS Plugin
> - › *Rilis:* 10 Mei 2026

> - › *Kecepatan:* ${latensi} ms
> - › *Uptime:* ${runtime(process.uptime())}
> - › *Memori:* ${usedMemory} MB

> Ingin Sewa Bot ${global.bot}? Hubungi Owner Dengan Join Saluran!!
> Dapat Diskon Kalo Owner lagi Baik Hati

> *Klik tombol di bawah untuk melihat daftar menu ✨*`;

        // Build rows dari grouped — otomatis
        const rows = Object.entries(grouped).map(([cat, stats]) => ({
            header: capitalize(cat),
            title: `${CATEGORY_EMOJI[cat] || '📂'} ${capitalize(cat)}`,
            description: `${stats.totalFeatures} Fitur • ${stats.totalCommands} Perintah`,
            id: `${prefix}cmenu ${cat}`
        }));

        if (isOwner) {
            const ownerPlugins = Object.values(global.plugins).filter(p => p.category === 'owner');
            const ownerCmds = ownerPlugins.reduce((acc, p) => acc + (Array.isArray(p.command) ? p.command.length : 1), 0);
            rows.push({
                header: 'Owner',
                title: `👑 Owner`,
                description: `${ownerPlugins.length} Fitur • ${ownerCmds} Perintah`,
                id: `${prefix}cmenu owner`
            });
        }

        const buttons = [
            {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: "📋 Pilih Menu",
                    sections: [{ title: "✨ Kategori", highlight_label: "Notifikasi", rows }]
                })
            },
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "Join Saluran",
                    url: "https://whatsapp.com/channel/0029Vb7oqii3AzNQIpO63y2q"
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
                        body: { text: menuTxt },
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