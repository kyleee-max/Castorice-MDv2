module.exports = {
    name: "Promote Member",
    command: ["promote"],
    category: "group",
    run: async (castorice, m, { text, isAdmins, isOwner, isBotAdmins }) => {
        if (!m.isGroup) return m.reply("Fitur ini hanya dapat digunakan di dalam grup.");
        if (!isAdmins && !isOwner) return m.reply("Akses ditolak. Fitur ini khusus untuk Admin.");
        if (!isBotAdmins) return m.reply("Bot harus menjadi Admin untuk menjalankan instruksi ini.");

        let target = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
        
        if (!target) return m.reply("Tentukan target dengan cara Tag, Reply, atau masukkan nomor.");

        try {
            await castorice.groupParticipantsUpdate(m.chat, [target], 'promote');
            await castorice.sendMessage(m.chat, {
                text: `Tindakan berhasil. @${target.split('@')[0]} kini telah diberikan otoritas sebagai Admin grup.`,
                mentions: [target]
            }, { quoted: m });
        } catch (e) {
            console.error(e);
            m.reply("Gagal memperbarui jabatan anggota tersebut.");
        }
    }
};