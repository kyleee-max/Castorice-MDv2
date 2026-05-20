module.exports = {
    name: "Demote Member",
    command: ["demote"],
    category: "group",
    run: async (castorice, m, { text, isAdmins, isOwner, isBotAdmins }) => {
        if (!m.isGroup) return m.reply("Fitur ini hanya dapat digunakan di dalam grup.");
        if (!isAdmins && !isOwner) return m.reply("Akses ditolak. Fitur ini khusus untuk Admin.");
        if (!isBotAdmins) return m.reply("Bot harus menjadi Admin untuk menjalankan instruksi ini.");

        let target = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
        
        if (!target || target.length < 15) return m.reply("Tentukan target dengan cara Tag, Reply, atau masukkan nomor.");

        try {
            await castorice.groupParticipantsUpdate(m.chat, [target], 'demote');
            await castorice.sendMessage(m.chat, {
                text: `Otoritas admin untuk @${target.split('@')[0]} telah berhasil dicabut secara resmi.`,
                mentions: [target]
            }, { quoted: m });
        } catch (e) {
            console.error(e);
            m.reply("Gagal menurunkan jabatan anggota tersebut.");
        }
    }
};