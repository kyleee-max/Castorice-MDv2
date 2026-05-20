/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const { claimDaily, DAILY_REWARD } = require('../../lib/stats-helper');

module.exports = {
    name: "Daily Reward",
    command: ["daily", "haarian", "klaim"],
    category: "game",
    run: async (castorice, m) => {
        const result = claimDaily(m.sender);

        if (!result.success) {
            return m.reply(
`⏳ *Belum waktunya, ${m.sender.split('@')[0]}!*

Kamu sudah klaim hadiah harian hari ini.
Klaim berikutnya dalam:

🕐 *${result.sisaJam} Jam ${result.sisaMenit} Menit lagi*

Sampai jumpa besok ya~ 🌸`
            );
        }

        const isStreak7 = result.streak % 7 === 0;

        const txt = `
🎁 *Hadiah Harian Berhasil Diklaim!*

💰 *Hadiah:* +${DAILY_REWARD} Koin
${result.bonusStreak > 0 ? `🎉 *Bonus Streak:* +${result.bonusStreak} Koin\n` : ''}✨ *Total:* +${result.reward} Koin
🔥 *Streak:* ${result.streak} Hari ${isStreak7 ? '🎊 7 Hari Berturut-turut!' : ''}

${isStreak7 ? '*Luar biasa! 7 hari berturut-turut! Bonus streak didapat!* 🌸' : `${7 - (result.streak % 7)} hari lagi untuk bonus streak!`}
`.trim();

        await m.reply(txt);
    }
};