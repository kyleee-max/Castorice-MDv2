/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/
const axios = require('axios');

module.exports = {
    name: "Screenshot Web",
    command: ["ssweb", "ss", "webshot"],
    category: "tools",
    run: async (castorice, m, { text, prefix, command }) => {
        if (!text) return m.reply(`❌ Masukkan URL website!\nContoh: ${prefix + command} https://google.com`);
        if (!/^https?:\/\//i.test(text)) return m.reply(`❌ URL tidak valid! Harus diawali https:// atau http://`);

        m.reply('📸 Sedang mengambil screenshot...');

        try {
            const res = await axios.get(`https://www.sankavolereii.my.id/tools/ssweb?apikey=planaai&url=${encodeURIComponent(text)}`);
            const { status, result } = res.data;

            if (!status || !result) return m.reply(`❌ Gagal mengambil screenshot. Coba lagi!`);

            await castorice.sendMessage(m.chat, {
                image: { url: result },
                caption:
`📸 *Screenshot Web*
━━━━━━━━━━━━━━━━━━━━
🌐 URL: ${text}
━━━━━━━━━━━━━━━━━━━━
_Castorice MD © Kaelsenpai_`
            }, { quoted: m });

        } catch (err) {
            console.error('[SSWEB ERROR]', err.message);
            m.reply(`⚠️ Gagal screenshot. Pastikan URL valid & bisa diakses!`);
        }
    }
};