/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/
module.exports = {
    name: "Delete Message",
    command: ["del", "hapus"],
    category: "group",
    run: async (castorice, m, { isAdmins, isOwner, isBotAdmins }) => {
        if (!m.isGroup) return m.reply("❌ Fitur ini hanya untuk grup!");
        if (!isAdmins && !isOwner) return m.reply("❌ Hanya admin yang bisa pakai perintah ini!");
        if (!isBotAdmins) return m.reply("❌ Bot harus jadi admin dulu!");
        if (!m.quoted) return m.reply("❌ Reply pesan yang mau dihapus!");

        try {
            await castorice.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: m.quoted.id,
                    participant: m.quoted.sender
                }
            });

            // Hapus pesan command juga biar bersih
            await castorice.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: m.key.id,
                    participant: m.sender
                }
            });

        } catch (err) {
            console.error('[DEL ERROR]', err.message);
            m.reply("❌ Gagal menghapus pesan. Pastikan bot admin & pesan belum terlalu lama!");
        }
    }
};