/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

module.exports = {
    name: "Add Member",
    command: ["add"],
    category: "group",
    run: async (castorice, m, { text, isAdmins, isOwner, isBotAdmins }) => {
        if (!m.isGroup) return m.reply("Fitur ini hanya tersedia di dalam grup.");
        if (!isAdmins && !isOwner) return m.reply("Akses ditolak. Perintah ini hanya untuk Admin.");
        if (!isBotAdmins) return m.reply("Bot harus menjadi Admin untuk menggunakan perintah ini.");

        if (!text) return m.reply("Masukkan nomor telepon yang valid. Contoh: .add 628xxx");

        let target = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

        try {
            const response = await castorice.groupParticipantsUpdate(m.chat, [target], 'add');
            
            // Cek jika nomor diprivat (biasanya butuh kirim undangan)
            if (response[0]?.status === "403") {
                return m.reply("Gagal menambahkan secara langsung karena privasi pengguna. Silakan kirim tautan undangan grup.");
            }

            m.reply("Anggota berhasil ditambahkan ke dalam grup.");
        } catch (err) {
            console.error(err);
            m.reply("Terjadi kesalahan. Pastikan nomor benar dan bot adalah Admin.");
        }
    }
};