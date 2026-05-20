/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/
const axios = require('axios');
const { recordGame } = require('../../lib/stats-helper');

// Simpan sesi aktif per chat: { jawaban, sender, timeout }
const sessions = {};

const WIN_KOIN = 75;
const XP_WIN = 25;
const XP_LOSS = 5;

module.exports = {
    name: "Siapakah Aku",
    command: ["siapakahaku", "ska"],
    category: "game",
    run: async (castorice, m, { prefix, command, args }) => {
        const chatId = m.chat;
        const jawaban = args.join(' ').toLowerCase().trim();

        // ── Kalau ada sesi aktif, cek jawaban ──
        if (sessions[chatId]) {
            const sesi = sessions[chatId];

            // Kalau gak ada args, kasih hint soalnya masih aktif
            if (!jawaban) {
                return m.reply(
`🎭 *Siapakah Aku? — Masih Aktif!*

❓ _"${sesi.soal}"_

Kirim jawabanmu: *${prefix + command} <jawaban>*
⏰ Sisa waktu: masih ada!`
                );
            }

            // Cek jawaban
            const jawabanBenar = sesi.jawaban.toLowerCase();
            const isBenar = jawaban === jawabanBenar || jawabanBenar.includes(jawaban) || jawaban.includes(jawabanBenar);

            if (isBenar) {
                clearTimeout(sesi.timeout);
                const winner = m.sender;
                delete sessions[chatId];

                const { levelUp, newLevel } = recordGame(winner, 'win', WIN_KOIN, XP_WIN);

                return m.reply(
`✅ *BENAR! Selamat!*

🎭 Jawabannya: *${sesi.jawaban}*
👤 Pemenang: @${winner.split('@')[0]}

💰 +${WIN_KOIN} Koin
✨ +${XP_WIN} XP${levelUp ? `\n\n🎉 *LEVEL UP! → Lv.${newLevel}*` : ''}`,
                { mentions: [winner] });
            } else {
                return m.reply(`❌ Salah! Coba lagi...`);
            }
        }

        // ── Mulai sesi baru ──
        try {
            m.reply('🎭 Sedang menyiapkan soal...');

            const res = await axios.get('https://api.siputzx.my.id/api/games/siapakahaku');
            const { status, data } = res.data;

            if (!status || !data) return m.reply('❌ Gagal mengambil soal. Coba lagi!');

            // Set timeout 60 detik, kalau gak ada yang jawab → loss buat yang mulai
            const timeout = setTimeout(async () => {
                if (!sessions[chatId]) return;
                const sesi = sessions[chatId];
                delete sessions[chatId];

                recordGame(sesi.sender, 'loss', 0, XP_LOSS);

                await castorice.sendMessage(chatId, {
                    text: `⏰ *Waktu Habis!*\n\nJawaban yang benar: *${sesi.jawaban}*\n\n❌ -${XP_LOSS} XP untuk yang mulai pertanyaan.`
                });
            }, 60000);

            sessions[chatId] = {
                soal: data.soal,
                jawaban: data.jawaban,
                sender: m.sender,
                timeout
            };

            await m.reply(
`🎭 *SIAPAKAH AKU?*
━━━━━━━━━━━━━━━━━━━━

❓ _"${data.soal}"_

━━━━━━━━━━━━━━━━━━━━
💡 Ketik: *${prefix + command} <jawaban>*
⏰ Waktu: *60 detik*
💰 Hadiah: *${WIN_KOIN} Koin + ${XP_WIN} XP*`
            );

        } catch (err) {
            console.error('[SIAPAKAHAKU ERROR]', err.message);
            m.reply('❌ Gagal mengambil soal. Coba lagi nanti!');
        }
    }
};