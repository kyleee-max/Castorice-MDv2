const { prepareWAMessageMedia, generateWAMessageFromContent } = require("@whiskeysocket/baileys");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "upsw",
    command: ["upsw", "swgc"],
    category: "group",
    admin: true, // Pastikan di main handler lu ada pengecekan ini
    run: async (castorice, m, { text, isAdmins }) => {
        if (!isAdmins) return m.reply('❌ Only Admin');

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        let type = q.mtype || (m.quoted ? m.quoted.type : '');
        let teksStatus = text || (m.quoted ? (typeof m.quoted.msg === 'string' ? m.quoted.msg : (m.quoted.text || m.quoted.caption || "")) : "");

        try {
            // 1. Handling Sticker (Convert ke Image dulu via FFMPEG)
            if (/webp/.test(mime) || type === 'stickerMessage') {
                m.react('⏳');
                const media = await q.download();
                const tempWebp = path.join(__dirname, `../sampah/tmp_${Date.now()}.webp`);
                const outPng = path.join(__dirname, `../sampah/${Date.now()}.png`);
                
                // Pastikan folder sampah ada
                if (!fs.existsSync(path.join(__dirname, '../sampah'))) fs.mkdirSync(path.join(__dirname, '../sampah'));

                fs.writeFileSync(tempWebp, media);

                exec(`ffmpeg -i ${tempWebp} -vframes 1 ${outPng}`, async (err) => {
                    if (fs.existsSync(tempWebp)) fs.unlinkSync(tempWebp);
                    if (err) return m.reply("❌ Gagal Convert Sticker");

                    const { imageMessage } = await prepareWAMessageMedia(
                        { image: fs.readFileSync(outPng) }, 
                        { upload: castorice.waUploadToServer }
                    );

                    await castorice.relayMessage(m.chat, {
                        groupStatusMessageV2: {
                            message: { 
                                imageMessage: { ...imageMessage, caption: teksStatus } 
                            }
                        }
                    }, {});

                    if (fs.existsSync(outPng)) fs.unlinkSync(outPng);
                    m.react('✅');
                });
            }

            // 2. Handling Audio
            else if (/audio/.test(mime)) {
                m.react('⏳');
                let audioBawaan = q.msg || q;
                await castorice.relayMessage(m.chat, {
                    groupStatusMessageV2: {
                        message: {
                            audioMessage: {
                                ...audioBawaan,
                                ptt: true
                            }
                        }
                    }
                }, {});
                m.react('✅');
            }

            // 3. Handling Image / Video / ViewOnce
            else if (/image|video/.test(mime) || type === 'viewOnceMessageV2') {
                m.react('⏳');
                const media = await q.download();
                const isVideo = /video/.test(mime);
                const { imageMessage, videoMessage } = await prepareWAMessageMedia(
                    { [isVideo ? 'video' : 'image']: media },
                    { upload: castorice.waUploadToServer }
                );

                let msgPayload = isVideo 
                    ? { videoMessage: { ...videoMessage, caption: teksStatus } } 
                    : { imageMessage: { ...imageMessage, caption: teksStatus } };

                await castorice.relayMessage(m.chat, {
                    groupStatusMessageV2: { message: msgPayload }
                }, {});
                m.react('✅');
            }

            // 4. Handling Teks Doang
            else {
                if (!teksStatus) return m.reply(`❌ Mana teks atau media yang mau di-up?`);
                await castorice.relayMessage(m.chat, {
                    groupStatusMessageV2: {
                        message: {
                            extendedTextMessage: {
                                text: teksStatus,
                                font: 1,
                                backgroundArgb: 0xff000000 // Hitam solid
                            }
                        }
                    }
                }, {});
                m.react('✅');
            }
        } catch (err) {
            console.error('[UPSW ERROR]', err);
            m.reply('⚠️ Gagal. Pastikan bot sudah admin group.');
        }
    }
};