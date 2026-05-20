module.exports = {
    name: "Sticker Maker",
    command: ["s", "sticker"],
    category: "sticker",
    run: async (castorice, m, { prefix, command }) => {
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';

        try {
            // 1. Handling Image to Sticker
            if (/image/.test(mime)) {
                m.reply('Permintaan sedang diproses, mohon tunggu sebentar... ⏳');
                
                const media = await q.download();
                await castorice.sendImgAsSticker(m.chat, media, m, {
                    packname: global.bot || "castorice Bot",
                    author: global.owner || "Kael Dev"
                });
            } 
            
            // 2. Handling Video/GIF to Sticker
            else if (/video/.test(mime)) {
                // Proteksi durasi agar tidak berat di server
                if ((q.msg || q).seconds > 10) {
                    return m.reply('Gagal. Durasi video terlalu panjang, batas maksimal adalah 10 detik.');
                }

                m.reply('Sedang memproses media video menjadi stiker... ⏳');
                
                const media = await q.download();
                await castorice.sendVidAsSticker(m.chat, media, m, {
                    packname: global.bot || "castorice Bot",
                    author: global.owner || "Kael Dev"
                });
            } 
            
            // 3. Pesan Jika Tidak Ada Media
            else {
                m.reply(`Silakan kirim atau balas (reply) gambar/video dengan perintah *${prefix + command}* untuk membuat stiker.`);
            }

        } catch (err) {
            console.error('[STICKER ERROR]', err);
            m.reply('Terjadi kesalahan teknis saat mencoba mengonversi media.');
        }
    }
};