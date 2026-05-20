/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const { getUser, addKoin } = require('../../lib/stats-helper');

module.exports = {
    name: "Balance",
    command: ["balance", "bal", "koin", "saldo"],
    category: "game",
    run: async (castorice, m, { prefix }) => {
        const target = m.mentionedJid?.[0] || m.sender;
        const user = getUser(target);

        const txt = `
💰 *Saldo Koin*

👤 *User:* @${target.split('@')[0]}
💴 *Saldo:* ${user.koin.toLocaleString('id-ID')} Koin
🎖️ *Level:* ${user.level} — ${user.rank}

_Klaim ${prefix}daily setiap hari untuk dapat hadiah!_
`.trim();

        await m.reply(txt, { mentions: [target] });
    }
};