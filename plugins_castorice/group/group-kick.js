module.exports = {
    name: "Kick Member",
    command: ["kick"],
    category: "group",
    run: async (castorice, m, { text, isAdmins, isOwner, isBotAdmins }) => {
        if (!m.isGroup) return m.reply("Fitur ini hanya tersedia di dalam grup.");
        if (!isAdmins && !isOwner) return m.reply("Akses ditolak. Perintah ini hanya untuk Admin.");
        if (!isBotAdmins) return m.reply("Bot harus menjadi Admin untuk menggunakan perintah ini.");

        let target = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

        if (!target) return m.reply("Tentukan target yang ingin dikeluarkan (Tag, Reply, atau ketik nomor).");

        try {
            await castorice.groupParticipantsUpdate(m.chat, [target], 'remove');
            
            await castorice.sendMessage(m.chat, {
                text: `Tindakan pengeluaran anggota berhasil dilakukan terhadap @${target.split('@')[0]}.`,
                mentions: [target]
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            m.reply("Gagal mengeluarkan anggota. Pastikan posisi bot lebih tinggi dari target.");
        }
    }
};