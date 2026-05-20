module.exports = {
    name: "Group Setting",
    command: ["group"],
    category: "group",
    run: async (castorice, m, { text, isAdmins, isOwner, isBotAdmins }) => {
        if (!m.isGroup) return m.reply("Fitur ini hanya dapat dioperasikan di dalam grup.");
        if (!isAdmins && !isOwner) return m.reply("Akses ditolak. Perintah ini hanya diperuntukkan bagi Admin.");
        if (!isBotAdmins) return m.reply("Gagal merubah setelan. Pastikan bot memiliki otoritas sebagai Admin.");

        if (!text) return m.reply("Tentukan pilihan yang valid: 'open' untuk membuka grup atau 'close' untuk menutup grup.");

        const action = text.toLowerCase().trim();

        if (action === 'open') {
            await castorice.groupSettingUpdate(m.chat, 'not_announcement')
                .then(() => m.reply("Pengaturan grup telah diperbarui. Saat ini seluruh anggota dapat mengirimkan pesan. 🔓"))
                .catch((err) => {
                    console.error(err);
                    m.reply("Terjadi kesalahan sistem saat mencoba membuka grup.");
                });
        } else if (action === 'close') {
            await castorice.groupSettingUpdate(m.chat, 'announcement')
                .then(() => m.reply("Pengaturan grup telah diperbarui. Saat ini hanya Admin yang dapat mengirimkan pesan. 🔒"))
                .catch((err) => {
                    console.error(err);
                    m.reply("Terjadi kesalahan sistem saat mencoba menutup grup.");
                });
        } else {
            m.reply("Instruksi tidak dikenal. Gunakan perintah 'open' atau 'close'.");
        }
    }
};