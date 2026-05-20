const axios = require('axios')
const sharp = require('sharp')
const FormData = require('form-data')

module.exports = {
 name: 'Smeme Sticker',
 command: ['smeme', 'memesticker', 'memes'],
 category: 'sticker',
 description: 'Buat sticker meme dari gambar/sticker',

 async run(castorice, m, { prefix, command, args }) {
 const isQuotedImage = m.quoted && /image/.test(m.quoted.type)
 const isQuotedSticker = m.quoted && /sticker/.test(m.quoted.type)
 const isSentImage = /image/.test(m.mtype)

 if (!isQuotedImage && !isQuotedSticker && !isSentImage) {
 return m.reply(
 `😂 *ᴍᴇᴍᴇ sᴛɪᴄᴋᴇʀ*\n\n` +
 `> Reply atau kirim gambar/sticker dengan caption\n\n` +
 `\`Contoh: ${prefix}smeme Ketika|Kamu Lupa\``
 )
 }

 const input = args.join(' ')
 if (!input || !input.includes('|')) {
 return m.reply(
 `😂 *ᴍᴇᴍᴇ sᴛɪᴄᴋᴇʀ*\n\n` +
 `> Format: top|bottom\n\n` +
 `\`Contoh: ${prefix}smeme Ketika|Kamu Lupa\``
 )
 }

 const [top, bottom] = input.split('|').map(s => s.trim())

 await castorice.sendMessage(m.chat, { react: { text: '😂', key: m.key } })

 try {
 // Download media
 const mediaBuffer = await (isQuotedImage || isQuotedSticker ? m.quoted.download() : m.download())

 if (!mediaBuffer || mediaBuffer.length < 100) {
 await castorice.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
 return m.reply('❌ Gagal mengunduh media, coba lagi!')
 }

 // Resize ke PNG pake sharp
 let imageBuffer
 try {
 imageBuffer = await sharp(mediaBuffer)
 .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
 .png()
 .toBuffer()
 } catch (e) {
 imageBuffer = mediaBuffer
 }

 // Upload ke tmpfiles.org
 let imageUrl
 try {
 const form = new FormData()
 form.append('file', imageBuffer, { filename: 'meme.png', contentType: 'image/png' })
 const uploadRes = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
 headers: form.getHeaders(),
 timeout: 30000
 })
 if (uploadRes.data?.data?.url) {
 imageUrl = uploadRes.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
 }
 } catch (e) {
 console.log('[SMEME] tmpfiles failed, trying telegraph...')
 }

 // Fallback ke telegraph
 if (!imageUrl) {
 try {
 const form2 = new FormData()
 form2.append('file', imageBuffer, { filename: 'meme.png', contentType: 'image/png' })
 const telegraphRes = await axios.post('https://telegra.ph/upload', form2, {
 headers: form2.getHeaders(),
 timeout: 30000
 })
 if (telegraphRes.data?.[0]?.src) {
 imageUrl = 'https://telegra.ph' + telegraphRes.data[0].src
 }
 } catch (e) {
 console.log('[SMEME] Telegraph failed:', e.message)
 }
 }

 if (!imageUrl) {
 await castorice.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
 return m.reply('❌ Gagal upload gambar, coba lagi nanti!')
 }

 // Generate meme via memegen.link
 const encodeText = (text) => {
 if (!text) return '_'
 return encodeURIComponent(text)
 .replace(/-/g, '--')
 .replace(/_/g, '__')
 .replace(/%20/g, '_')
 }

 const memeUrl = `https://api.memegen.link/images/custom/${encodeText(top)}/${encodeText(bottom)}.png?background=${encodeURIComponent(imageUrl)}`

 const response = await axios.get(memeUrl, {
 responseType: 'arraybuffer',
 timeout: 30000,
 headers: { 'User-Agent': 'Mozilla/5.0' }
 })

 const memeBuffer = Buffer.from(response.data)

 await castorice.sendImgAsSticker(m.chat, memeBuffer, m, {
 packname: global.bot,
 author: global.owner
 })

 await castorice.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

 } catch (err) {
 console.error('[SMEME]', err.message)
 await castorice.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
 m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${err.message}`)
 }
 }
}