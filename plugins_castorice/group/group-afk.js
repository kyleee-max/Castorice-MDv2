const fs = require('fs')
const { generateWAMessageFromContent } = require('@whiskeysocket/baileys')
const afk = require('../../lib/afk')

let _afk = JSON.parse(fs.readFileSync('./database/afk.json'))

module.exports = {
    name: "AFK",
    command: ["afk"],
    category: "group",

    // Event handler — dipanggil di setiap pesan masuk via onMessage loop di handler
    onMessage: async (castorice, m, { ftroli }) => {
        if (!m.isGroup || m.key.fromMe) return

        // === EVENT TAG: ada yang nge-tag user AFK ===
        let mentionUser = [...new Set([...(m.mentionedJid || []), ...(m.quoted ? [m.quoted.sender] : [])])]
        if (mentionUser.length <= 5) {
            for (let ment of mentionUser) {
                let afkData = afk.getAfkUser(ment, _afk)
                if (afkData) {
                    let getTimee = Date.now() - afkData.time
                    let totalSec = Math.floor(getTimee / 1000)
                    let hari = Math.floor(totalSec / 86400)
                    let jam = Math.floor((totalSec % 86400) / 3600)
                    let menit = Math.floor((totalSec % 3600) / 60)
                    let detik = totalSec % 60
                    let durasi = (hari ? `${hari} hari ` : '') + (jam ? `${jam} jam ` : '') + (menit ? `${menit} menit ` : '') + `${detik} detik`

                    let msg = await generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                interactiveMessage: {
                                    body: { text: `\n- *‼️ Jangan Tag* @${ment.split('@')[0]}\n└╸ *Reason* : ${afkData.reason}\n\n> *Sejak* : ${durasi} yang lalu` },
                                    footer: { text: '' },
                                    header: { hasMediaAttachment: false },
                                    contextInfo: { mentionedJid: [ment] },
                                    nativeFlowMessage: {
                                        buttons: [{
                                            name: "cta_url",
                                            buttonParamsJson: JSON.stringify({ display_text: "I Love You 🌹", url: "https://wa.me/628386859765" })
                                        }]
                                    }
                                }
                            }
                        }
                    }, { quoted: ftroli })
                    await castorice.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
                }
            }
        }

        // === EVENT BERHENTI AFK: user yang AFK ngirim pesan ===
        let userAfk = afk.getAfkUser(m.sender, _afk)
        if (userAfk) {
            let getTime = Date.now() - userAfk.time
            let totalSec = Math.floor(getTime / 1000)
            let hari = Math.floor(totalSec / 86400)
            let jam = Math.floor((totalSec % 86400) / 3600)
            let menit = Math.floor((totalSec % 3600) / 60)
            let detik = totalSec % 60
            let durasi = (hari ? `${hari} hari ` : '') + (jam ? `${jam} jam ` : '') + (menit ? `${menit} menit ` : '') + `${detik} detik`

            afk.delAfkUser(m.sender, _afk)

            let msgReturn = await generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            body: { text: `\n- ✨ @${m.sender.split('@')[0]} Selesai AFK!\n└╸ *Reason* : ${userAfk.reason}\n\n> *Selama* : ${durasi}` },
                            footer: { text: '' },
                            header: { hasMediaAttachment: false },
                            contextInfo: { mentionedJid: [m.sender] },
                            nativeFlowMessage: {
                                buttons: [{
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({ display_text: "I Miss You ♥️", url: "https://wa.me/628386859765" })
                                }]
                            }
                        }
                    }
                }
            }, { quoted: ftroli })
            await castorice.relayMessage(m.chat, msgReturn.message, { messageId: msgReturn.key.id })
        }
    },

    // === COMMAND: set AFK ===
    run: async (castorice, m, { text, reply, ftroli, generateWAMessageFromContent: gwmfc }) => {
        try {
            let reason = text || 'Coli Dulu'
            if (reason.length > 30) return reply('Alasan terlalu panjang. Maksimal 30 karakter.')

            afk.addAfkUser(m.sender, Date.now(), reason, _afk)

            const buttons = [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: 'Chat Admin',
                    url: `https://wa.me/6283854859219`
                })
            }]

            const msg = await generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            body: { text: `\n- ✨ @${m.sender.split('@')[0]} Memulai Afk\n└╸Reason: ${reason}\n` },
                            footer: { text: '' },
                            header: { hasMediaAttachment: false },
                            contextInfo: { mentionedJid: [m.sender] },
                            nativeFlowMessage: { buttons: buttons }
                        }
                    }
                }
            }, { quoted: ftroli })

            await castorice.relayMessage(m.chat, msg.message, { messageId: msg.key.id })

        } catch (err) {
            console.error('AFK PLUGIN ERROR:', err)
            reply(`⚠️ Error: ${err.message}`)
        }
    }
}