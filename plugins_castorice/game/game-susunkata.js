/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/
const axios = require('axios');
const { recordGame } = require('../../lib/stats-helper');

const sessions = {};

const WIN_KOIN = 60;
const XP_WIN = 20;
const XP_LOSS = 5;

module.exports = {
    name: "Susun Kata",
    command: ["susunkata", "sk"],
    category: "game",
    run: async (castorice, m, { prefix, command, args }) => {
        const chatId = m.chat;
        const jawaban = args.join(' ').toUpperCase().trim();

        // ── Sesi aktif, cek jawaban ──
        if (sessions[chatId]) {
            const sesi = sessions[chatId];

            if (!jawaban) {
                return m.reply(
`🔤 *Susun Kata — Masih Aktif!*

🧩 Huruf: *${sesi.soal}*
📂 Tipe: *${sesi.tipe}*

💡 Kirim jawabanmu: *${prefix + command} <jawaban>*
⏰ Waktu masih ada!`
                );
            }

            const isBenar = jawaban === sesi.jawaban.toUpperCase();

            if (isBenar) {
                clearTimeout(sesi.timeout);
                const winner = m.sender;
                delete sessions[chatId];

                const { levelUp, newLevel } = recordGame(winner, 'win', WIN_KOIN, XP_WIN);

                return m.reply(
`✅ *BENAR! Selamat!*

🔤 Jawabannya: *${sesi.jawaban}*
👤 Pemenang: @${winner.split('@')[0]}

💰 +${WIN_KOIN} Koin
✨ +${XP_WIN} XP${levelUp ? `\n\n🎉 *LEVEL UP! → Lv.${newLevel}*` : ''}`,
                { mentions: [winner] });

            } else {
                return m.reply(`❌ Salah! Coba lagi...\n_Ingat, susun huruf-hurufnya dengan benar!_`);
            }
        }

        // ── Mulai sesi baru ──
        try {
            m.reply('🔤 Sedang menyiapkan soal...');

            const res = await axios.get('https://api.siputzx.my.id/api/games/susunkata');
            const { status, data } = res.data;

            if (!status || !data) return m.reply('❌ Gagal mengambil soal. Coba lagi!');

            const timeout = setTimeout(async () => {
                if (!sessions[chatId]) return;
                const sesi = sessions[chatId];
                delete sessions[chatId];

                recordGame(sesi.sender, 'loss', 0, XP_LOSS);

                await castorice.sendMessage(chatId, {
                    text: `⏰ *Waktu Habis!*\n\n🔤 Jawaban: *${sesi.jawaban}*\n\n❌ -${XP_LOSS} XP untuk yang mulai pertanyaan.`
                });
            }, 60000);

            sessions[chatId] = {
                soal: data.soal,
                tipe: data.tipe,
                jawaban: data.jawaban,
                sender: m.sender,
                timeout
            };

            await m.reply(
`🔤 *SUSUN KATA!*
━━━━━━━━━━━━━━━━━━━━

🧩 Huruf: *${data.soal}*
📂 Tipe: *${data.tipe}*

━━━━━━━━━━━━━━━━━━━━
💡 Susun huruf-huruf di atas menjadi sebuah kata!
✏️ Ketik: *${prefix + command} <jawaban>*
⏰ Waktu: *60 detik*
💰 Hadiah: *${WIN_KOIN} Koin + ${XP_WIN} XP*`
            );

        } catch (err) {
            console.error('[SUSUNKATA ERROR]', err.message);
            m.reply('❌ Gagal mengambil soal. Coba lagi nanti!');
        }
    }
};