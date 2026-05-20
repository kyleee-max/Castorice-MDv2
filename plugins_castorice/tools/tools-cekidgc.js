/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const axios = require('axios');
const { generateWAMessageFromContent, prepareWAMessageMedia } = require('@whiskeysocket/baileys');

function formatDate(timestamp) {
    if (!timestamp) return '—';
    const d = new Date(
        typeof timestamp === 'number' && timestamp < 1e12 ? timestamp * 1000 : timestamp
    );
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

module.exports = {
    name: 'Cek Info Grup',
    command: ['cekidgc', 'idgc', 'idgrup', 'groupid', 'infogc', 'groupinfo'],
    category: 'tools',
    run: async (castorice, m, { prefix, command, text }) => {
        await m.react('⏳');

        try {
            const input = text?.trim();
            let groupJid = null;
            let groupMeta = null;

            if (input && input.includes('chat.whatsapp.com/')) {
                const inviteCode = input.split('chat.whatsapp.com/')[1]?.split(/[\s?]/)[0];
                if (!inviteCode) {
                    m.react('✘');
                    return m.reply(`── .✦ ──\n\n> Link grup tidak valid .☘︎ ݁˖`);
                }
                try {
                    groupMeta = await castorice.groupGetInviteInfo(inviteCode);
                    groupJid = groupMeta?.id;
                } catch {
                    m.react('✘');
                    return m.reply(`── .✦ ──\n\n> Link grup tidak valid atau sudah expired .☘︎ ݁˖`);
                }
            } else if (input && input.endsWith('@g.us')) {
                groupJid = input;
                try {
                    groupMeta = await castorice.groupMetadata(groupJid);
                } catch {
                    m.react('✘');
                    return m.reply(`── .✦ ──\n\n> Tidak bisa mengakses grup tersebut .☘︎ ݁˖`);
                }
            } else if (m.isGroup) {
                groupJid = m.chat;
                groupMeta = await castorice.groupMetadata(groupJid);
            } else {
                return m.reply(
                    `── .✦ 𝗖𝗘𝗞 𝗜𝗗 𝗚𝗥𝗨𝗣 ✦. ── 𝜗ৎ\n\n` +
                    `> Gunakan di grup atau masukkan link grup\n\n` +
                    `> \`${prefix + command}\` — di dalam grup\n` +
                    `> \`${prefix + command} https://chat.whatsapp.com/xxx\``
                );
            }

            if (!groupMeta || !groupJid) {
                m.react('✘');
                return m.reply(`── .✦ ──\n\n> Tidak dapat menemukan info grup .☘︎ ݁˖`);
            }

            const groupName = groupMeta.subject || 'Unknown';
            const participants = groupMeta.participants || [];
            const memberCount = participants.length || groupMeta.size || 0;
            const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            const adminCount = admins.length;
            const groupOwner = groupMeta.owner || groupMeta.subjectOwner || '—';
            const createdAt = formatDate(groupMeta.creation);
            const groupDesc = groupMeta.desc || '—';
            const descPreview = groupDesc.length > 120 ? groupDesc.slice(0, 120) + '...' : groupDesc;
            const isRestrict = groupMeta.restrict ? 'Admin Only' : 'Semua Member';
            const isAnnounce = groupMeta.announce ? 'Aktif' : 'Nonaktif';
            const isCommunity = groupMeta.isCommunity ? '✓ Ya' : '✘ Tidak';
            const joinMode = groupMeta.joinApprovalMode ? 'Perlu Approval' : 'Bebas';

            const infoText =
                
                `╭─〔 *${groupName}* 〕───⬣\n` +
                `│  ✦ ɴᴀᴍᴀ        : *${groupName}*\n` +
                `│  ✦ ɪᴅ             : \`${groupJid}\`\n` +
                `│  ✦ ᴍᴇᴍʙᴇʀ     : *${memberCount}*\n` +
                `│  ✦ ᴀᴅᴍɪɴ        : *${adminCount}*\n` +
                `│  ✦ ᴏᴡɴᴇʀ       : @${groupOwner.replace(/@.+/g, '')}\n` +
                `│  ✦ ᴅɪʙᴜᴀᴛ       : *${createdAt}*\n` +
                `│  ✦ ᴋᴏᴍᴜɴɪᴛᴀs : *${isCommunity}*\n` +
                `│  ✦ ᴇᴅɪᴛ ɪɴꜰᴏ   : *${isRestrict}*\n` +
                `│  ✦ ᴀɴɴᴏᴜɴᴄᴇ : *${isAnnounce}*\n` +
                `│  ✦ ᴊᴏɪɴ ᴍᴏᴅᴇ  : *${joinMode}*\n` +
                `│  ✦ ᴅᴇsᴋʀɪᴘsɪ  : ${descPreview}\n` +
                `╰──────────────⬣\n\n`               

            const buttons = [
                {
                    name: 'cta_copy',
                    buttonParamsJson: JSON.stringify({
                        display_text: '✦ Copy ID Grup',
                        copy_code: groupJid
                    })
                }
            ];

            // Coba ambil foto profil grup
            let ppBuffer = null;
            try {
                const ppUrl = await castorice.profilePictureUrl(groupJid, 'image');
                if (ppUrl) {
                    ppBuffer = Buffer.from(
                        (await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 10000 })).data
                    );
                }
            } catch {}

            let headerMedia = null;
            if (ppBuffer) {
                try {
                    const sharp = require('sharp');
                    const resized = await sharp(ppBuffer)
                        .resize(300, 300, { fit: 'cover' })
                        .jpeg({ quality: 80 })
                        .toBuffer();
                    headerMedia = await prepareWAMessageMedia(
                        { image: resized },
                        { upload: castorice.waUploadToServer }
                    );
                } catch {}
            }

            const interactiveMsg = {
                body: { text: infoText },
                footer: { text: `` },
                nativeFlowMessage: { buttons },
                contextInfo: { mentionedJid: [m.sender, groupOwner] }
            };

            if (headerMedia) {
                interactiveMsg.header = {
                    hasMediaAttachment: true,
                    ...headerMedia
                };
            }

            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: interactiveMsg
                    }
                }
            }, { quoted: m });

            await castorice.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
            await m.react('✓');

        } catch (err) {
            console.error('[CekIdGc] Error:', err.message);
            await m.react('✘');
            m.reply(`⚠️ Terjadi kesalahan.\n\nDetail: ${err.message || err}`);
        }
    }
};