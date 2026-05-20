const axios = require('axios');
const FormData = require('form-data');

module.exports = {
    name: 'Sharpify Enhancer',
    command: ['upscale', 'enhance'],
    category: 'tools',
    run: async (castorice, m, { command, prefix }) => {
        const q = m.quoted ? m.quoted : m;
        if (!/image/.test(q.mtype || q.msg?.mimetype)) {
            return m.reply(`Kirim/balas gambar dengan perintah *${prefix + command}*`);
        }

        m.reply('Sedang memproses... API ini agak berat, tunggu bentar ya.');

        try {
            const media = await (m.quoted ? m.quoted.download() : m.download());
            const sizeBefore = (media.length / 1024).toFixed(2);

            const listmodel = {
                enhance: 'https://sharpify-api.vercel.app/api/enhance/auto_enhance',
                upscale: 'https://sharpify-api.vercel.app/api/enhance/upscale',
                removebg: 'https://sharpify-api.vercel.app/api/enhance/bgrem'
            };

            const form = new FormData();
            // Penting: Sharpify sensitif sama filename & contentType
            form.append('file', media, {
                filename: 'image.jpg',
                contentType: 'image/jpeg',
            });

            const resApi = await axios.post(listmodel[command], form, {
                headers: {
                    ...form.getHeaders(),
                    'User-Agent': 'okhttp/4.9.2',
                },
                timeout: 60000 // Kasih timeout 1 menit karena proses upscale lama
            });

            const data = resApi.data;

            // Cek jika API balikin error (sesuai log lu tadi)
            if (data.url && data.url.error) {
                console.log('Detail Error API:', JSON.stringify(data.url.error));
                return m.reply(`❌ API Error: Server Sharpify lagi sibuk atau gambar ditolak.`);
            }

            // Ambil URL hasil (Sharpify biasanya langsung naruh link di 'url' atau 'result_url')
            let resultUrl = typeof data.url === 'string' ? data.url : (data.result_url || data.url?.url);

            if (!resultUrl || typeof resultUrl !== 'string') {
                return m.reply('❌ Gagal mendapatkan hasil. API tidak memberikan link gambar.');
            }

            // Ambil hasil gambarnya
            const response = await axios.get(resultUrl, { responseType: 'arraybuffer' });
            const finalBuffer = Buffer.from(response.data);
            const sizeAfter = (finalBuffer.length / 1024).toFixed(2);

            let caption = `✅ *Sharpify ${command.toUpperCase()} Selesai*\n\n`
            caption += `📊 *Size:* ${sizeBefore} KB ➔ ${sizeAfter} KB\n`
            caption += `✨ *Note:* Gunakan .upscale untuk hasil lebih tajam.`

            await castorice.sendMessage(m.chat, {
                image: finalBuffer,
                caption: caption
            }, { quoted: m });

        } catch (err) {
            console.error('Sharpify Error:', err.response?.data || err.message);
            m.reply(`⚠️ Terjadi kesalahan: ${err.message}`);
        }
    }
}