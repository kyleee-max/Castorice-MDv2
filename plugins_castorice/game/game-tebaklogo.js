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

const WIN_KOIN = 80;
const XP_WIN = 25;
const XP_LOSS = 5;

module.exports = {
    name: "Tebak Logo",
    command: ["tebaklogo", "tblg"],
    category: "game",
    run: async (castorice, m, { prefix, command, args }) => {
        const chatId = m.chat;
        const jawaban = args.join(' ').toLowerCase().trim();

        // ── Sesi aktif, cek jawaban ──
        if (sessions[chatId]) {
            const sesi = sessions[chatId];

            if (!jawaban) {
                return m.reply(
`🏷️ *Tebak Logo — Masih Aktif!*

Tebak nama brand/perusahaan dari logo yang sudah dikirim!

💡 Kirim jawabanmu: *${prefix + command} <jawaban>*
⏰ Waktu masih ada!`
                );
            }

            const jawabanBenar = sesi.jawaban.toLowerCase().trim();
            const isBenar = jawaban === jawabanBenar
                || jawabanBenar.includes(jawaban)
                || jawaban.includes(jawabanBenar);

            if (isBenar) {
                clearTimeout(sesi.timeout);
                const winner = m.sender;
                delete sessions[chatId];

                const { levelUp, newLevel } = recordGame(winner, 'win', WIN_KOIN, XP_WIN);

                return m.reply(
`✅ *BENAR! Selamat!*

🏷️ Jawabannya: *${sesi.jawaban}*
👤 Pemenang: @${winner.split('@')[0]}

💰 +${WIN_KOIN} Koin
✨ +${XP_WIN} XP${levelUp ? `\n\n🎉 *LEVEL UP! → Lv.${newLevel}*` : ''}`,
                { mentions: [winner] });

            } else {
                return m.reply(`❌ Salah! Coba lagi...\n_Butuh petunjuk? Ketik: ${prefix + command} hint_`);
            }
        }

        // ── Mulai sesi baru ──
        try {
            m.reply('🏷️ Sedang menyiapkan soal...');

            const res = await axios.get('https://api.siputzx.my.id/api/games/tebaklogo');
            const { status, data } = res.data;

            if (!status || !data?.data) return m.reply('❌ Gagal mengambil soal. Coba lagi!');

            const soal = data.data;

            const timeout = setTimeout(async () => {
                if (!sessions[chatId]) return;
                const sesi = sessions[chatId];
                delete sessions[chatId];

                recordGame(sesi.sender, 'loss', 0, XP_LOSS);

                await castorice.sendMessage(chatId, {
                    text: `⏰ *Waktu Habis!*\n\n🏷️ Jawaban: *${sesi.jawaban}*\n\n❌ -${XP_LOSS} XP untuk yang mulai pertanyaan.`
                });
            }, 60000);

            sessions[chatId] = {
                jawaban: soal.jawaban,
                sender: m.sender,
                timeout
            };

            await castorice.sendMessage(chatId, {
                image: { url: soal.image },
                caption:
`🏷️ *TEBAK LOGO!*
━━━━━━━━━━━━━━━━━━━━

🔍 Brand/perusahaan apa yang punya logo ini?

━━━━━━━━━━━━━━━━━━━━
💡 Ketik: *${prefix + command} <jawaban>*
⏰ Waktu: *60 detik*
💰 Hadiah: *${WIN_KOIN} Koin + ${XP_WIN} XP*`
            }, { quoted: m });

        } catch (err) {
            console.error('[TEBAKLOGO ERROR]', err.message);
            m.reply('❌ Gagal mengambil soal. Coba lagi nanti!');
        }
    }
};