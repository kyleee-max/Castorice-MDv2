/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/
const axios = require('axios');

module.exports = {
    name: "Arti Nama",
    command: ["artinama", "artinama", "nama"],
    category: "primbon",
    run: async (castorice, m, { text, prefix, command }) => {
        if (!text) return m.reply(`❌ Masukkan nama yang ingin dicari!\nContoh: *${prefix + command} Kael*`);

        m.reply('🔍 Sedang mencari arti nama, tunggu sebentar...');

        try {
            const res = await axios.get(`https://api.siputzx.my.id/api/primbon/artinama?nama=${encodeURIComponent(text)}`);
            const { status, data } = res.data;

            if (!status || !data) return m.reply('❌ Nama tidak ditemukan atau gagal mengambil data.');

            const txt = `
🔮 *ARTI NAMA*
━━━━━━━━━━━━━━━━━━━━

👤 *Nama:* ${data.nama}

📖 *Arti & Kepribadian:*
${data.arti}

📝 *Catatan:*
_${data.catatan}_

━━━━━━━━━━━━━━━━━━━━
`.trim();

            await m.reply(txt);
        } catch (err) {
            console.error('[ARTINAMA ERROR]', err.message);
            m.reply('❌ Gagal mengambil data. Coba lagi nanti!');
        }
    }
};