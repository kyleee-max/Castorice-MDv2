const { generateWAMessageFromContent } = require("@whiskeysocket/baileys");

module.exports = {
    name: "brat",
    command: ["brat", "bratimg"],
    category: "sticker",
    run: async (castorice, m, { text, prefix, command }) => {
        if (!text) return m.reply(`Masukkan teks. Contoh: ${prefix + command} Contoh teks`);

        const args = text.split(' ');
        const isVideoReq = args[0].toLowerCase() === 'vid';

        // 1. Handling Brat Video (Pake endpoint bratvideo)
        if (isVideoReq) {
            let bratText = args.slice(1).join(' ');
            if (!bratText) return m.reply("Teks untuk video tidak disertakan.");
            
            m.react("⏳");
            
            // Link baru khusus bratvideo
            let apiUrl = `https://www.sankavolereii.my.id/imagecreator/bratvideo?apikey=planaai&text=${encodeURIComponent(bratText)}`;
            
            return await castorice.sendVidAsSticker(m.chat, apiUrl, m, { 
                packname: "Brat Video", 
                author: "Kael Dev" 
            });
        }

        // 2. Handling Brat Image (Pake endpoint brat biasa)
        if (args.length === 1 || command === 'bratimg') {
            let bratText = command === 'bratimg' ? text : text;
            let apiUrl = `https://www.sankavolereii.my.id/imagecreator/brat?apikey=planaai&text=${encodeURIComponent(bratText)}`;
            
            return await castorice.sendImgAsSticker(m.chat, apiUrl, m, { 
                packname: "Brat Sticker", 
                author: "Kael Dev" 
            });
        }

        // 3. Handling Choice Button
        let bodyText = `📝 *Teks:* ${text}\n\nLebih dari satu kata, Pilih Sticker Gambar atau Sticker Video (Brat Vid)?`;

        let buttons = [
            {
                "name": "quick_reply",
                "buttonParamsJson": JSON.stringify({
                    display_text: "STICKER IMG",
                    id: `${prefix}bratimg ${text}`
                })
            },
            {
                "name": "quick_reply",
                "buttonParamsJson": JSON.stringify({
                    display_text: "STICKER VID",
                    id: `${prefix}brat vid ${text}`
                })
            }
        ];

        let msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: bodyText },
                        footer: { text: "Brat Generator" },
                        nativeFlowMessage: { buttons }
                    }
                }
            }
        }, { quoted: m });

        await castorice.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    }
};