/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const axios = require('axios');
const FormData = require('form-data');

async function uploadImgLarger(buffer) {
    const form = new FormData();
    form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
    form.append('type', 13);
    form.append('scaleRadio', 2);

    const headers = {
        ...form.getHeaders(),
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'origin': 'https://imglarger.com',
        'referer': 'https://imglarger.com/',
        'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36'
    };

    const { data } = await axios.post(
        'https://photoai.imglarger.com/api/PhoAi/Upload',
        form,
        { headers }
    );

    return data.data; // { code, ... }
}

async function checkStatus(code) {
    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'content-type': 'application/json',
        'origin': 'https://imglarger.com',
        'referer': 'https://imglarger.com/',
        'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36'
    };

    const { data } = await axios.post(
        'https://photoai.imglarger.com/api/PhoAi/CheckStatus',
        { code, type: 13 },
        { headers }
    );

    return data.data; // { status, resultUrl, ... }
}

module.exports = {
    name: 'HD Enhance v2 (ImgLarger)',
    command: ['hd2'],
    category: 'tools',
    run: async (castorice, m, { prefix, command }) => {
        const q = m.quoted ? m.quoted : m;
        if (!/image/.test(q.mtype || q.msg?.mimetype)) {
            return m.reply(`Kirim atau balas gambar dengan perintah *${prefix + command}*`);
        }

        m.reply('⏳ Mengupload gambar, mohon tunggu...');

        try {
            const media = await q.download();

            // Upload & dapatkan code
            const uploadResult = await uploadImgLarger(media);
            const code = uploadResult?.code;
            if (!code) throw new Error('Gagal mendapatkan kode upload');

            // Polling status max 30 detik
            let resultUrl = null;
            for (let i = 0; i < 30; i++) {
                await new Promise(r => setTimeout(r, 2000));
                const status = await checkStatus(code);
                if (status?.resultUrl) {
                    resultUrl = status.resultUrl;
                    break;
                }
            }

            if (!resultUrl) throw new Error('Timeout: gambar belum selesai diproses');

            // Download hasil
            const result = await axios.get(resultUrl, { responseType: 'arraybuffer' });
            const finalBuffer = Buffer.from(result.data);

            await castorice.sendMessage(m.chat, {
                image: finalBuffer,
                caption: '✅ *HD Enhance v2 Selesai*\n\nGambar berhasil ditingkatkan kualitasnya via ImgLarger'
            }, { quoted: m });

        } catch (err) {
            console.error('Error HD2:', err);
            m.reply(`⚠️ Gagal memproses gambar.\n\nDetail: ${err.message || err}`);
        }
    }
};