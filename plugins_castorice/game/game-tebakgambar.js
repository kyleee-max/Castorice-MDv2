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
    name: "Tebak Gambar",
    command: ["tebakgambar", "tbgbr"],
    category: "game",
    run: async (castorice, m, { prefix, command, args }) => {
        const chatId = m.chat;
        const jawaban = args.join(' ').toLowerCase().trim();

        // ── Sesi aktif, cek jawaban ──
        if (sessions[chatId]) {
            const sesi = sessions[chatId];

            if (!jawaban) {
                return m.reply(
`🖼️ *Tebak Gambar — Masih Aktif!*

Tebak kata dari gambar yang sudah dikirim!

💡 Kirim jawabanmu: *${prefix + command} <jawaban>*
⏰ Waktu masih ada!`
                );
            }

            // Cek jawaban — toleran huruf kecil/besar & spasi
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

🖼️ Jawabannya: *${sesi.jawaban}*
📝 Deskripsi: _${sesi.deskripsi}_
👤 Pemenang: @${winner.split('@')[0]}

💰 +${WIN_KOIN} Koin
✨ +${XP_WIN} XP${levelUp ? `\n\n🎉 *LEVEL UP! → Lv.${newLevel}*` : ''}`,
                { mentions: [winner] });

            } else {
                // Kalau mau hint, ketik .tbgbr hint
                if (jawaban === 'hint') {
                    return m.reply(`💡 *Petunjuk:*\n_${sesi.deskripsi}_`);
                }
                return m.reply(`❌ Salah! Coba lagi...\n_Butuh petunjuk? Ketik: ${prefix + command} hint_`);
            }
        }

        // ── Mulai sesi baru ──
        try {
            m.reply('🖼️ Sedang menyiapkan soal...');

            const res = await axios.get('https://api.siputzx.my.id/api/games/tebakgambar');
            const { status, data } = res.data;

            if (!status || !data) return m.reply('❌ Gagal mengambil soal. Coba lagi!');

            const timeout = setTimeout(async () => {
                if (!sessions[chatId]) return;
                const sesi = sessions[chatId];
                delete sessions[chatId];

                recordGame(sesi.sender, 'loss', 0, XP_LOSS);

                await castorice.sendMessage(chatId, {
                    text: `⏰ *Waktu Habis!*\n\n🖼️ Jawaban: *${sesi.jawaban}*\n📝 _${sesi.deskripsi}_\n\n❌ -${XP_LOSS} XP untuk yang mulai pertanyaan.`
                });
            }, 60000);

            sessions[chatId] = {
                jawaban: data.jawaban,
                deskripsi: data.deskripsi,
                sender: m.sender,
                timeout
            };

            await castorice.sendMessage(chatId, {
                image: { url: data.img },
                caption:
`🖼️ *TEBAK GAMBAR!*
━━━━━━━━━━━━━━━━━━━━

🔍 Tebak kata/kalimat dari gambar di atas!

━━━━━━━━━━━━━━━━━━━━
💡 Ketik: *${prefix + command} <jawaban>*
🆘 Petunjuk: *${prefix + command} hint*
⏰ Waktu: *60 detik*
💰 Hadiah: *${WIN_KOIN} Koin + ${XP_WIN} XP*`
            }, { quoted: m });

        } catch (err) {
            console.error('[TEBAKGAMBAR ERROR]', err.message);
            m.reply('❌ Gagal mengambil soal. Coba lagi nanti!');
        }
    }
};