const fs = require('fs')
const path = require('path')
const { tmpdir } = require('os')
const crypto = require('crypto')
const ff = require('fluent-ffmpeg')
const webp = require('node-webpmux')

async function videoToAnimatedSticker(videoBuffer, metadata) {
    const rand = crypto.randomBytes(4).toString('hex')
    const tmpIn = path.join(tmpdir(), `swm_${rand}.mp4`)
    const tmpOut = path.join(tmpdir(), `swm_${rand}.webp`)

    fs.writeFileSync(tmpIn, videoBuffer)

    await new Promise((resolve, reject) => {
        ff(tmpIn)
            .on('error', reject)
            .on('end', () => resolve(true))
            .addOutputOptions([
                '-vcodec', 'libwebp',
                '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0,format=rgba,setsar=1',
                '-loop', '0',
                '-ss', '00:00:00',
                '-t', '00:00:05',
                '-preset', 'default',
                '-an',
                '-vsync', '0',
                '-q:v', '75'
            ])
            .toFormat('webp')
            .save(tmpOut)
    })

    const wMedia = fs.readFileSync(tmpOut)
    fs.unlinkSync(tmpIn)
    fs.unlinkSync(tmpOut)

    const img = new webp.Image()
    const json = {
        'sticker-pack-id': 'castorice-md',
        'sticker-pack-name': metadata.packname || '',
        'sticker-pack-publisher': metadata.author || '',
        'emojis': ['']
    }
    const exifAttr = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00])
    const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')
    const exif = Buffer.concat([exifAttr, jsonBuff])
    exif.writeUIntLE(jsonBuff.length, 14, 4)

    await img.load(wMedia)
    img.exif = exif
    return await img.save(null)
}

module.exports = {
    name: "Sticker Watermark",
    command: ["swm", "wm"],
    category: "sticker",
    run: async (castorice, m, { text }) => {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''
        let type = q.mtype || (m.quoted ? m.quoted.type : '')

        let packname = ''
        let author = text?.trim() || global.owner || 'Kael Dev'

        try {
            // IMAGE → sticker dengan wm custom
            if (/image/.test(mime)) {
                m.react('⏳')
                const media = await q.download()
                await castorice.sendImgAsSticker(m.chat, media, m, { packname, author })
                m.react('✅')
            }

            // STICKER → rebuild dengan wm custom
            else if (/webp/.test(mime) || type === 'stickerMessage') {
                m.react('⏳')
                const media = await q.download()
                const isAnimated = q.msg?.isAnimated || false
                if (isAnimated) {
                    const result = await videoToAnimatedSticker(media, { packname, author })
                    await castorice.sendMessage(m.chat, { sticker: result }, { quoted: m })
                } else {
                    await castorice.sendImgAsSticker(m.chat, media, m, { packname, author })
                }
                m.react('✅')
            }

            // VIDEO → tidak support
            else if (/video/.test(mime)) {
                m.reply('❌ Video/GIF tidak support, gunakan image atau sticker.')
            }

            else {
                m.reply(
                    `*Sticker Watermark*\n` +
                    `Reply image/sticker/video dengan perintah:\n\n` +
                    `*.swm* → author default\n` +
                    `*.swm kael* → author "kael"`
                )
            }

        } catch (err) {
            console.error('[SWM ERROR]', err)
            m.reply('❌ Gagal buat sticker.')
        }
    }
}