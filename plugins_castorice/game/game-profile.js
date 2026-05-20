/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const { getUser, xpToNextLevel } = require('../../lib/stats-helper');

module.exports = {
    name: "Profile",
    command: ["profile", "profil", "me"],
    category: "game",
    run: async (castorice, m, { prefix }) => {
        const target = m.mentionedJid?.[0] || m.sender;
        const user = getUser(target);
        const xpNeeded = xpToNextLevel(user.level);
        const xpBar = generateBar(user.xp, xpNeeded, 10);

        const winRate = user.stats.totalGame > 0
            ? ((user.stats.win / user.stats.totalGame) * 100).toFixed(1)
            : '0.0';

        const txt = `
╭━━━━━━━━━━━━━━╮
  ${user.rank}
  *@${target.split('@')[0]}*
╰━━━━━━━━━━━━━━╯

🎖️ *Level:* ${user.level}
✨ *Pengalaman (XP):* ${user.xp} / ${xpNeeded}
${xpBar}

💰 *Koin:* ${user.koin.toLocaleString('id-ID')}
🔥 *Streak:* ${user.streak} Hari

📊 *Statistik Game:*
  🏆 Menang: ${user.stats.win}
  💀 Kalah: ${user.stats.loss}
  🤝 Seri: ${user.stats.draw}
  🎮 Total: ${user.stats.totalGame}
  📈 Winrate: ${winRate}%
`.trim();

        await m.reply(txt, { mentions: [target] });
    }
};

function generateBar(current, max, length = 10) {
    const filled = Math.round((current / max) * length);
    const empty = length - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${Math.round((current / max) * 100)}%`;
}