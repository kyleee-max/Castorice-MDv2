const axios = require('axios');
const FormData = require('form-data');

module.exports = {
    name: 'AI Upscale HD',
    command: ['hd', 'hd4'],
    category: 'tools',
    run: async (castorice, m, { command, text, prefix }) => {
        const q = m.quoted ? m.quoted : m;
        if (!/image/.test(q.mtype || q.msg?.mimetype)) {
            return m.reply(`Kirim atau balas gambar dengan perintah *${prefix + command}* [2/4]`);
        }

        // Tentukan scale (default ke 2 kalau nggak diisi)
        let scale = text.trim() || '2';
        if (!['2', '4'].includes(scale)) scale = '2';

        m.reply(`Memproses upscale ${scale}x... Mohon tunggu sebentar.`);

        try {
            // 1. Download media dari WA
            const media = await q.download();

            // 2. Ambil Token & Task ID dari iLoveIMG
            const html = await axios.get('https://www.iloveimg.com/upscale-image').then(r => r.data);
            const token = html.match(/"token":"(eyJ[^"]+)"/)?.[1];
            const task = html.match(/ilovepdfConfig\.taskId\s*=\s*'([^']+)'/)?.[1];

            if (!token || !task) throw new Error('Gagal mengambil session token');

            // 3. Upload Image ke Server iLoveIMG
            const formUp = new FormData();
            formUp.append('name', 'image.jpg');
            formUp.append('chunk', '0');
            formUp.append('chunks', '1');
            formUp.append('task', task);
            formUp.append('preview', '1');
            formUp.append('v', 'web.0');
            // Pake Buffer langsung di sini
            formUp.append('file', media, { filename: 'image.jpg', contentType: 'image/jpeg' });

            const resUp = await axios.post('https://api29g.iloveimg.com/v1/upload', formUp, {
                headers: {
                    ...formUp.getHeaders(),
                    'Authorization': `Bearer ${token}`,
                    'Origin': 'https://www.iloveimg.com',
                    'Referer': 'https://www.iloveimg.com/'
                }
            });

            const serverFilename = resUp.data.server_filename;

            // 4. Proses Upscale & Download Result (ArrayBuffer)
            const formDo = new FormData();
            formDo.append('task', task);
            formDo.append('server_filename', serverFilename);
            formDo.append('scale', scale);

            const resDone = await axios.post('https://api29g.iloveimg.com/v1/upscale', formDo, {
                headers: {
                    ...formDo.getHeaders(),
                    'Authorization': `Bearer ${token}`,
                    'Origin': 'https://www.iloveimg.com',
                    'Referer': 'https://www.iloveimg.com/'
                },
                responseType: 'arraybuffer'
            });

            const finalBuffer = Buffer.from(resDone.data);

            // 5. Kirim Hasil
            await castorice.sendMessage(m.chat, {
                image: finalBuffer,
                caption: `✅ *Upscale ${scale}x Selesai*\n\nBerhasil meningkatkan kualitas gambar`
            }, { quoted: m });

        } catch (err) {
            console.error('Error iLoveIMG:', err);
            m.reply(`⚠️ Terjadi kesalahan saat memproses gambar.\n\nDetail: ${err.message || err}`);
        }
    }
};