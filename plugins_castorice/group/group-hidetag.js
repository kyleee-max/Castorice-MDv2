const { prepareWAMessageMedia } = require("@whiskeysocket/baileys");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "Hidetag",
    command: ["hidetag", "h"],
    category: "group",
    run: async (castorice, m, { text, participants, isAdmins, isOwner, groupDB, fkontak }) => {
        if (!m.isGroup) return;
        if (!isAdmins && !isOwner) return m.reply("Akses ditolak.");
        if (!groupDB?.[m.chat]?.hidetag) return m.reply("Hidetag Belum Diaktifkan\nGunakan .on hidetag");

        let jir = participants.map(v => v.id?.includes("@s.whatsapp.net") ? v.id : v.jid);
        let baseTeks = text || (m.quoted ? (typeof m.quoted.msg === 'string' ? m.quoted.msg : (m.quoted.text || m.quoted.caption || "")) : "");
        let teksFinal = baseTeks ? `${baseTeks}\n\n@${m.chat}` : `@${m.chat}`;

        const contextInfoEveryone = {
            mentionedJid: jir,
            groupMentions: [{ groupJid: m.chat, groupSubject: "everyone" }]
        };

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        let type = q.mtype || (m.quoted ? m.quoted.type : '');

        try {
            // STICKER
            if (/webp/.test(mime) || type === 'stickerMessage') {
                m.react('⏳');
                const media = await q.download();
                await castorice.sendMessage(m.chat, {
                    sticker: media,
                    contextInfo: contextInfoEveryone
                }, { quoted: fkontak });
                m.react('✅');
            }

            // AUDIO
            else if (/audio/.test(mime)) {
                m.react('⏳');
                const media = await q.download();
                await castorice.sendMessage(m.chat, {
                    audio: media,
                    ptt: /ogg/.test(mime),
                    contextInfo: contextInfoEveryone
                }, { quoted: fkontak });
                // Kirim teks everyone terpisah karena audio gak support caption
                await castorice.sendMessage(m.chat, {
                    text: teksFinal,
                    contextInfo: contextInfoEveryone
                });
                m.react('✅');
            }

            // IMAGE
            else if (/image/.test(mime)) {
                m.react('⏳');
                const media = await q.download();
                await castorice.sendMessage(m.chat, {
                    image: media,
                    caption: teksFinal,
                    contextInfo: contextInfoEveryone
                }, { quoted: fkontak });
                m.react('✅');
            }

            // VIDEO
            else if (/video/.test(mime)) {
                m.react('⏳');
                const media = await q.download();
                await castorice.sendMessage(m.chat, {
                    video: media,
                    caption: teksFinal,
                    contextInfo: contextInfoEveryone
                }, { quoted: fkontak });
                m.react('✅');
            }

            // TEKS
            else {
                if (!baseTeks) return m.reply('Kirim teks atau reply pesan.');
                await castorice.sendMessage(m.chat, {
                    text: teksFinal,
                    contextInfo: contextInfoEveryone
                }, { quoted: fkontak });
                m.react('✅');
            }

        } catch (err) {
            console.error('[HIDETAG ERROR]', err);
            m.reply("Gagal hidetag.");
        }
    }
};