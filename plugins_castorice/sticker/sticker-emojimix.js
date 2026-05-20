const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const crypto = require('crypto');
const ff = require('fluent-ffmpeg');
const webp = require('node-webpmux');

async function fetchEmojiMixImage(emoji1, emoji2) {
 const sources = [
 `https://emoji-kitchen.vercel.app/api/combine?emoji1=\( {encodeURIComponent(emoji1)}&emoji2= \){encodeURIComponent(emoji2)}`,
 ];

 for (const url of sources) {
 try {
 const res = await axios.get(url, {
 responseType: 'arraybuffer',
 timeout: 12000,
 headers: {
 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
 }
 });

 if (res.status === 200 && res.data.byteLength > 1500) {
 return Buffer.from(res.data);
 }
 } catch (_) {
 continue;
 }
 }
 return null;
}

// Fungsi convert ke sticker bg putih (sama seperti sebelumnya)
async function imageToStickerWithWhiteBg(imgBuffer, metadata) {
 const rand = crypto.randomBytes(4).toString('hex');
 const tmpIn = path.join(tmpdir(), `mix_${rand}.png`);
 const tmpOut = path.join(tmpdir(), `mix_${rand}.webp`);

 fs.writeFileSync(tmpIn, imgBuffer);

 await new Promise((resolve, reject) => {
 ff(tmpIn)
 .on('error', reject)
 .on('end', () => resolve(true))
 .addOutputOptions([
 '-vcodec', 'libwebp',
 '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white,format=rgb24,setsar=1',
 '-loop', '0',
 '-preset', 'default',
 '-an',
 '-vsync', '0',
 '-q:v', '80'
 ])
 .toFormat('webp')
 .save(tmpOut);
 });

 const wMedia = fs.readFileSync(tmpOut);
 fs.unlinkSync(tmpIn);
 fs.unlinkSync(tmpOut);

 const img = new webp.Image();
 const json = {
 'sticker-pack-id': 'https://github.com/kaelsukacastorice',
 'sticker-pack-name': metadata.packname || global.bot || 'castorice Bot',
 'sticker-pack-publisher': metadata.author || global.owner || '',
 'emojis': ['']
 };

 const exifAttr = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00]);
 const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
 const exif = Buffer.concat([exifAttr, jsonBuff]);
 exif.writeUIntLE(jsonBuff.length, 14, 4);

 await img.load(wMedia);
 img.exif = exif;
 return await img.save(null);
}

module.exports = {
 name: 'Emoji Mix White BG',
 command: ['emojimix', 'mix', 'emix'],
 category: 'sticker',
 description: 'Gabung 2 emoji jadi sticker background putih',

 async run(conn, m, { text, prefix, command }) {
 const raw = (text || '').trim();

 if (!raw) {
 return m.reply(
 `⚠️ *Cara pakai:*\n\n` +
 `*${prefix + command}* 🔥🐱\n` +
 `*${prefix + command}* ❤️💦\n` +
 `*${prefix + command}* 🐶🍔\n\n` +
 `_Background putih otomatis._`
 );
 }

 const emojiRegex = /\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu;
 const matches = raw.match(emojiRegex) || [];

 if (matches.length < 2) {
 return m.reply(`❌ Diperlukan tepat 2 emoji.\nContoh: *${prefix + command}* 🔥❤️`);
 }

 const emoji1 = matches[0];
 const emoji2 = matches[1];

 await conn.sendMessage(m.chat, { react: { text: '🍳', key: m.key } });

 try {
 const imgBuffer = await fetchEmojiMixImage(emoji1, emoji2);

 if (!imgBuffer) {
 return m.reply(`❌ Kombinasi ${emoji1} + ${emoji2} **tidak ditemukan** atau API lagi down.\nSilakan coba kombinasi emoji lain.`);
 }

 const stickerBuf = await imageToStickerWithWhiteBg(imgBuffer, {
 packname: global.bot || 'castorice Bot',
 author: global.owner || ''
 });

 await conn.sendMessage(m.chat, { sticker: stickerBuf }, { quoted: m });
 await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

 } catch (err) {
 console.error('[EMOJIMIX ERROR]', err.message);
 await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
 m.reply(`⚠️ Gagal memproses emoji. Silakan coba lagi atau gunakan emoji lain.`);
 }
 }
};