/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const { getContentType, downloadContentFromMessage, proto} = require('@whiskeysocket/baileys');
const fs = require('fs');
exports.smsg = (sock, m) => {
    if (!m) return m;

    if (m.key) {
        m.id = m.key.id;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = sock.decodeJid(m.fromMe ? sock.user.id : (m.isGroup ? m.key.participant : m.key.remoteJid));
    }

    if (m.message) {
        m.mtype = getContentType(m.message);
        m.msg = (m.mtype === 'viewOnceMessageV2') 
            ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] 
            : (m.mtype === 'documentWithCaptionMessage') 
                ? m.message[m.mtype].message 
                : m.message[m.mtype];

        m.body = (m.mtype === 'conversation') ? m.message.conversation :
                 (m.mtype === 'extendedTextMessage') ? m.message.extendedTextMessage.text :
                 (m.mtype === 'imageMessage') ? m.message.imageMessage.caption :
                 (m.mtype === 'videoMessage') ? m.message.videoMessage.caption :
                 (m.mtype === 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId :
                 (m.mtype === 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
                 (m.mtype === 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId :
                 (m.mtype === 'interactiveResponseMessage') ? JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id :
                 (m.msg?.caption || m.msg?.text || m.msg?.conversation || "");

        m.text = (typeof m.body === 'string' && m.body.length > 0) ? m.body : '';


        let quoted = m.msg?.contextInfo ? m.msg.contextInfo.quotedMessage : null;
        if (quoted) {
            m.quoted = {};
            m.quoted.type = getContentType(quoted);
            m.quoted.msg = quoted[m.quoted.type];
            m.quoted.id = m.msg.contextInfo.stanzaId;
            m.quoted.chat = m.chat;
            m.quoted.sender = sock.decodeJid(m.msg.contextInfo.participant);
            m.quoted.fromMe = m.quoted.sender === sock.decodeJid(sock.user.id);
            
            m.quoted.text = m.quoted.msg?.text || 
                            m.quoted.msg?.caption || 
                            m.quoted.msg?.conversation || 
                            m.quoted.msg?.contentText || 
                            m.quoted.msg?.selectedId || 
                            m.quoted.msg?.title || "";
                            
            m.quoted.isMedia = /imageMessage|videoMessage|stickerMessage|audioMessage/.test(m.quoted.type);
            m.quoted.mentionedJid = m.msg.contextInfo.mentionedJid || [];

            m.quoted.fakeObj = {
                key: {
                    remoteJid: m.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id,
                    participant: m.isGroup ? m.quoted.sender : undefined
                },
                message: quoted
            };
            
            m.quoted.download = () => m.download(m.quoted.msg);
        }
    }

m.reply = (text, options = {}) => sock.sendMessage(m.chat, { 
    text: text, 
    mentions: options.mentions ? options.mentions : (m.msg?.contextInfo?.mentionedJid || []),
    ...options 
}, { quoted: m });    
    
    m.react = async (emoji) => {
        return await sock.sendMessage(m.chat, {
            react: { text: emoji, key: m.key }
        });
    };

    m.download = async (message = m.msg) => {
        let mtype = Object.keys(message).find(key => key.endsWith('Message') || key === 'viewOnceMessageV2');
        let content = message[mtype] || message;
        if (mtype === 'viewOnceMessageV2' || mtype === 'viewOnceMessage') {
            content = content.message[Object.keys(content.message)[0]];
        }
        
        if (!content || (!content.mediaKey && !content.mediaKey?.length)) return null;

        if (!Buffer.isBuffer(content.mediaKey)) {
            content.mediaKey = Buffer.from(Object.values(content.mediaKey));
        }
        let type = content.mimetype ? content.mimetype.split('/')[0] : 'image';
        const stream = await downloadContentFromMessage(content, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    };

    return m;
};

exports.decodeJid = (jid) => {
 if (!jid) return jid;
 if (/:\d+@/gi.test(jid)) {
 let decode = jid.match(/(\d+):/);
 if (decode && decode[1]) return `${decode[1]}@s.whatsapp.net`;
 }
 return jid;
};