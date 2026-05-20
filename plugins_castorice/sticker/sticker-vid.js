const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const crypto = require('crypto');
const ff = require('fluent-ffmpeg');
const webp = require('node-webpmux');

function getEmojiHex(emoji) {
 const points = [];
 for (const char of emoji) {
 const cp = char.codePointAt(0);
 if (cp === 0xFE0F || cp === 0x200D) continue;
 points.push(cp.toString(16).toLowerCase());
 }
 return points.join('-');
}

async function fetchAnimatedEmoji(emoji) {
 const hex = getEmojiHex(emoji);
 if (!hex) return null;

 const urls = [
 `https://fonts.gstatic.com/s/e/notoemoji/latest/${hex}/512.gif`,
 `https://fonts.gstatic.com/s/e/notoemoji/latest/${hex.replace(/-/g, '_')}/512.gif`,
 ];

 for (const url of urls) {
 try {
 const res = await axios.get(url, {
 responseType: 'arraybuffer',
 timeout: 10000,
 headers: { 'User-Agent': 'Mozilla/5.0' }
 });
 if (res.status === 200 && res.data.byteLength > 500) {
 return Buffer.from(res.data);
 }
 } catch (_) { continue; }
 }
 return null;
}

async function gifToAnimatedSticker(gifBuffer, metadata) {
 const rand = crypto.randomBytes(4).toString('hex');
 const tmpIn = path.join(tmpdir(), `semvid_${rand}.gif`);
 const tmpOut = path.join(tmpdir(), `semvid_${rand}.webp`);

 fs.writeFileSync(tmpIn, gifBuffer);

 await new Promise((resolve, reject) => {
 ff(tmpIn)
 .on('error', reject)
 .on('end', () => resolve(true))
 .addOutputOptions([
 '-vcodec', 'libwebp',
 '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white,format=rgb24,setsar=1',
 '-loop', '0',
 '-ss', '00:00:00',
 '-t', '00:00:05',
 '-preset', 'default',
 '-an',
 '-vsync', '0',
 '-q:v', '75'
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
 'sticker-pack-publisher': metadata.author || global.owner || global.owner,
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
 name: 'Sticker Emoji Animated',
 command: ['semvid', 'sv'],
 category: 'sticker',
 description: 'Bikin sticker animated dari emoji (Google Noto gif)',

 async run(conn, m, { text, prefix, command }) {
 const raw = (text || '').trim();

 if (!raw) {
 return m.reply(
 `⚠️ *Cara penggunaan:*\n\n` +
 `*${prefix + command}* 🤤\n` +
 `*${prefix + command}* 🔥\n` +
 `*${prefix + command}* 😭\n\n` +
 `_Hasil berupa sticker animated (Google Noto gif) dengan background putih._`
 );
 }

 const emojiRegex = /\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu;
 const matches = raw.match(emojiRegex);
 const emoji = matches ? matches[0] : raw[0];

 if (!emoji || emoji.charCodeAt(0) < 127) {
 return m.reply(`❌ ❌ Emoji tidak terdeteksi. Contoh: *${prefix + command}* 🤤`);
 }

 await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

 try {
 const gifBuf = await fetchAnimatedEmoji(emoji);

 if (!gifBuf) {
 return m.reply(
 `❌ Emoji *${emoji}* tidak memiliki versi animated.\n` +
 `Gunakan *.semoji ${emoji}* untuk versi statis.`
 );
 }

 const stickerBuf = await gifToAnimatedSticker(gifBuf, {
 packname: global.bot || 'castorice Bot',
 author: global.owner || global.owner
 });

 await conn.sendMessage(m.chat, { sticker: stickerBuf }, { quoted: m });
 await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

 } catch (err) {
 console.error('[SEMVID ERROR]', err.message);
 await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
 m.reply(`⚠️ Terjadi kesalahan. Silakan coba lagi nanti.\n_${err.message}_`);
 }
 }
};