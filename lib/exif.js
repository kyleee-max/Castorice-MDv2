/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const fs = require('fs')
const { tmpdir } = require("os")
const Crypto = require("crypto")
const ff = require('fluent-ffmpeg')
const webp = require('node-webpmux')
const path = require("path")

async function imageToWebp (media) {
    const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUint32LE(0)}.webp`)
    const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUint32LE(0)}.jpg`)

    fs.writeFileSync(tmpFileIn, media)

    await new Promise((resolve, reject) => {
        ff(tmpFileIn)
            .on("error", reject)
            .on("end", () => resolve(true))
.addOutputOptions([
    "-vcodec", "libwebp",
    "-vf", "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1"
])
            .toFormat("webp")
            .save(tmpFileOut)
    })

    const buff = fs.readFileSync(tmpFileOut)
    fs.unlinkSync(tmpFileOut)
    fs.unlinkSync(tmpFileIn)
    return buff
}

async function videoToWebp (media) {
    const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUint32LE(0)}.webp`)
    const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUint32LE(0)}.mp4`)

    fs.writeFileSync(tmpFileIn, media)

    await new Promise((resolve, reject) => {
        ff(tmpFileIn)
            .on("error", reject)
            .on("end", () => resolve(true))
            .addOutputOptions([
    "-vcodec", "libwebp",
    "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=white@0,setsar=1",
    "-loop", "0",
    "-ss", "00:00:00",
    "-t", "00:00:05",
    "-preset", "default",
    "-an",
    "-vsync", "0"
])
            .toFormat("webp")
            .save(tmpFileOut)
    })

    const buff = fs.readFileSync(tmpFileOut)
    fs.unlinkSync(tmpFileOut)
    fs.unlinkSync(tmpFileIn)
    return buff
}
async function writeExif (buffer, metadata) {
    // Deteksi otomatis tipe file dari buffer (pake magic number sederhana)
    // 0x47 0x49 0x46 = GIF, 0x00 0x00 = MP4 (biasanya)
    const isVideo = buffer.toString('hex', 0, 4).startsWith('0000') || buffer.toString('ascii', 0, 4).includes('ftyp')
    
    let wMedia = isVideo ? await videoToWebp(buffer) : await imageToWebp(buffer)
    
    const img = new webp.Image()
    const json = { 
        "sticker-pack-id": `https://github.com/kaelsukacastorice`, 
        "sticker-pack-name": metadata.packname, 
        "sticker-pack-publisher": metadata.author, 
        "emojis": metadata.categories ? metadata.categories : [""] 
    }
    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
    const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8")
    const exif = Buffer.concat([exifAttr, jsonBuff])
    exif.writeUIntLE(jsonBuff.length, 14, 4)
    
    await img.load(wMedia)
    img.exif = exif
    return await img.save(null)
}
module.exports = { imageToWebp, videoToWebp, writeExif }