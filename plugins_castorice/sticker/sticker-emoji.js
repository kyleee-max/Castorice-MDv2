const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function getEmojiCodepoint(emoji) {
    const codePoints = [];
    for (const char of emoji) {
        const cp = char.codePointAt(0);
        if (cp > 0xFFFF) {
            codePoints.push(cp.toString(16).toLowerCase());
        } else if (cp >= 0x200B && cp !== 0xFE0F && cp !== 0x200D) {
            codePoints.push(cp.toString(16).toLowerCase());
        }
    }
    return codePoints.join('-');
}

async function fetchEmojiImage(emoji) {
    const cp = getEmojiCodepoint(emoji);
    if (!cp) return null;

    const sources = [
        `https://emojicdn.egg.workers.dev/${encodeURIComponent(emoji)}?style=apple`,
        `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64/${cp}.png`,
        `https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/72x72/${cp}.png`,
    ];

    for (const url of sources) {
        try {
            const res = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 8000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (res.status === 200 && res.data.byteLength > 500) {
                return Buffer.from(res.data);
            }
        } catch (_) {
            continue;
        }
    }
    return null;
}

module.exports = {
    name: 'Sticker Emoji',
    command: ['semoji', 'se', 'stikemoji'],
    category: 'sticker',
    description: 'Bikin sticker dari emoji dengan background putih',

    async run(conn, m, { text, prefix, command }) {
        const raw = (text || '').trim();

        if (!raw) {
            return m.reply(`⚠️ *Cara penggunaan:*\n\n*${prefix + command}* 🤤\n_Kirim emoji untuk dijadikan sticker background putih._`);
        }

        const emojiRegex = /\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu;
        const emojiMatches = raw.match(emojiRegex);
        const emoji = emojiMatches ? emojiMatches[0] : raw[0];

        if (!emoji) {
            return m.reply(`❌ Emoji tidak valid.`);
        }

        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

        try {
            const imgBuffer = await fetchEmojiImage(emoji);
            if (!imgBuffer) throw new Error('Gagal ambil gambar emoji.');

            // --- LOGIC WHITE BACKGROUND VIA FFMPEG ---
            const filename = Date.now();
            const tempInput = path.join(os.tmpdir(), `emj_in_${filename}.png`);
            const tempOutput = path.join(os.tmpdir(), `emj_out_${filename}.png`);

            fs.writeFileSync(tempInput, imgBuffer);

            // FFMPEG: Overlay emoji di atas canvas putih (512x512)
const ffmpegCmd = `ffmpeg -i ${tempInput} -filter_complex "[0:v]scale=400:400:force_original_aspect_ratio=decrease[fg]; color=white:s=512x512[bg]; [bg][fg]overlay=(W-w)/2:(H-h)/2" -vframes 1 ${tempOutput}`;
            exec(ffmpegCmd, async (err) => {
                if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);

                if (err) {
                    console.error(err);
                    return m.reply('❌ Gagal memproses background putih.');
                }

                const finalBuffer = fs.readFileSync(tempOutput);

                await conn.sendImgAsSticker(m.chat, finalBuffer, m, {
                    packname: global.bot || 'castorice Bot',
                    author: 'Kael Senpai'
                });

                if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
                await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            });

        } catch (err) {
            console.error('[SEMOJI ERROR]', err.message);
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            m.reply(`⚠️ Terjadi kesalahan.\n_${err.message}_`);
        }
    }
};