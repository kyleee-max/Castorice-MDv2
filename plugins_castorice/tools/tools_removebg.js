const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');

/**
 * Scraper Remove Background via Pixelcut
 * @param {Buffer} buffer - Image buffer dari user
 */
async function pixa(buffer) {
    try {
        const meta = await sharp(buffer).metadata();
        let resizedBuffer = buffer;
        if (meta.width > 2000 || meta.height > 2000) {
            resizedBuffer = await sharp(buffer)
                .resize(2000, 2000, { fit: 'inside' })
                .jpeg({ quality: 90 })
                .toBuffer();
        }

        const form = new FormData();
        form.append('image', resizedBuffer, { 
            filename: 'image.jpg', 
            contentType: 'image/jpeg' 
        });
        form.append('format', 'png');
        form.append('model', 'v1');

        const res = await axios.post('https://api2.pixelcut.app/image/matte/v1', form, {
            headers: {
                ...form.getHeaders(),
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'x-client-version': 'web:pixa.com:4a5b0af2',
                'origin': 'https://www.pixa.com',
                'referer': 'https://www.pixa.com/'
            },
            responseType: 'arraybuffer'
        });

        return Buffer.from(res.data);
    } catch (err) {
        if (err.response && err.response.data) {
            console.error("API Error Msg:", Buffer.from(err.response.data).toString());
        }
        throw err;
    }
}

module.exports = {
    name: 'Remove BG',
    command: ['rbg', 'removebg'],
    category: 'tools',
    run: async (castorice, m) => {
        const q = m.quoted ? m.quoted : m;
        if (!/image/.test(q.mtype || q.msg?.mimetype)) return m.reply('Balas fotonya.');

        m.reply('Processing...');

        try {
            const media = await q.download();
            const result = await pixa(media);

            if (!result) throw 'Gagal memproses gambar';

            await castorice.sendMessage(m.chat, {
                image: result,
                caption: 'Done.'
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            m.reply('Gagal. Resolusi terlalu besar atau API Down.');
        }
    }
};