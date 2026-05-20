module.exports = {
    name: "Read View Once",
    command: ["readviewonce", "rvo"],
    category: "group",
    run: async (castorice, m, { isAdmins, isOwner }) => {
        if (!isOwner && !isAdmins) return;
        if (!m.quoted) return m.reply("Mohon reply pesan View Once yang ingin diekstrak.");

        const q = m.quoted;
        const isViewOnce = q.msg?.viewOnce || q.mtype?.includes('viewOnce');
        if (!isViewOnce) return m.reply("Pesan yang Anda lampirkan bukan merupakan pesan View Once.");

        try {
            m.react('⏳');

            const type = q.type;
            const qMsg = q.msg;
            const captionAsli = qMsg.caption || "";
            const textRvo = `✅ *PENGAMBILAN BERHASIL*\n\n◦ *Pengirim:* @${q.sender.split('@')[0]}\n◦ *Tipe Media:* ${type}${captionAsli ? `\n◦ *Keterangan:* ${captionAsli}` : ""}`;

            const buffer = await q.download();
            if (!buffer) return m.reply("Gagal mengunduh media. Silakan coba kembali.");

            if (/image/.test(type)) {
                await castorice.sendMessage(m.chat, { image: buffer, caption: textRvo, mentions: [q.sender] }, { quoted: m });
            } else if (/video/.test(type)) {
                await castorice.sendMessage(m.chat, { video: buffer, caption: textRvo, mentions: [q.sender] }, { quoted: m });
            } else if (/audio/.test(type)) {
                await castorice.sendMessage(m.chat, {
                    audio: buffer,
                    ptt: true,
                    mimetype: qMsg.mimetype || 'audio/ogg; codecs=opus'
                }, { quoted: m });
            } else {
                m.reply(`Tipe media (${type}) belum didukung oleh sistem.`);
            }

            m.react('✅');
        } catch (e) {
            console.error('[RVO ERROR]', e);
            m.reply("Terjadi kesalahan sistem saat mengekstrak media View Once.");
        }
    }
};