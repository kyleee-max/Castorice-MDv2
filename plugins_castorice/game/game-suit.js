/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const { recordGame } = require('../../lib/stats-helper');

const CHOICES = {
    batu: { emoji: '🪨', beats: 'gunting', label: 'Batu' },
    gunting: { emoji: '✂️', beats: 'kertas', label: 'Gunting' },
    kertas: { emoji: '📄', beats: 'batu', label: 'Kertas' }
};

const ALIAS = {
    batu: ['batu', 'rock', 'b', 'gu'],
    gunting: ['gunting', 'scissors', 'g', 'choki'],
    kertas: ['kertas', 'paper', 'k', 'pa']
};

const WIN_KOIN = 50;
const XP_WIN = 20;
const XP_LOSS = 5;
const XP_DRAW = 10;

module.exports = {
    name: "Rock Paper Scissors",
    command: ["rps", "janken", "suit"],
    category: "game",
    run: async (castorice, m, { args, prefix }) => {
        const input = args[0]?.toLowerCase();

        if (!input) {
            return m.reply(
`🎮 *Suit — Batu Gunting Kertas!*

Cara main: ${prefix}rps <pilihan>

🪨 Batu → batu / rock / b / gu
✂️ Gunting → gunting / scissors / g / choki
📄 Kertas → kertas / paper / k / pa

💰 Menang: +${WIN_KOIN} Koin`
            );
        }

        // Resolve alias ke key utama
        let userChoice = null;
        for (const [key, aliases] of Object.entries(ALIAS)) {
            if (aliases.includes(input)) {
                userChoice = key;
                break;
            }
        }

        if (!userChoice) {
            return m.reply(`❌ Pilihan tidak valid!\nGunakan: ${prefix}rps batu | gunting | kertas`);
        }

        // Bot pilih random
        const botChoice = Object.keys(CHOICES)[Math.floor(Math.random() * 3)];

        const user = CHOICES[userChoice];
        const bot = CHOICES[botChoice];

        let result, txt;

        if (userChoice === botChoice) {
            result = 'draw';
            txt = `🤝 *Seri!*`;
        } else if (user.beats === botChoice) {
            result = 'win';
            txt = `🏆 *Kamu Menang!*\n💰 +${WIN_KOIN} Koin didapat!`;
        } else {
            result = 'loss';
            txt = `💀 *Kamu Kalah!*\nCoba lagi semangat!`;
        }

        const xpMap = { win: XP_WIN, loss: XP_LOSS, draw: XP_DRAW };
        const { levelUp, newLevel } = recordGame(
            m.sender,
            result,
            result === 'win' ? WIN_KOIN : 0,
            xpMap[result]
        );

        const response = `
🎮 *Suit — Batu Gunting Kertas!*

👤 Kamu: ${user.emoji} ${user.label} (${userChoice})
🤖 Castorice: ${bot.emoji} ${bot.label} (${botChoice})

${txt}
✨ +${xpMap[result]} XP${levelUp ? `\n\n🎉 *LEVEL UP! Lv.${newLevel}!*` : ''}
`.trim();

        await m.reply(response);
    }
};