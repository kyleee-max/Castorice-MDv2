/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/
module.exports = {
    name: "Group Link",
    command: ["grouplink", "gclink", "linkgrup", "linkgc"],
    category: "group",
    run: async (castorice, m, { args, isAdmins, isOwner, isBotAdmins }) => {
        if (!m.isGroup) return m.reply("❌ Fitur ini hanya untuk grup!");

        const sub = args[0]?.toLowerCase();

        // ── Reset link ──
        if (sub === 'reset' || sub === 'revoke') {
            if (!isAdmins && !isOwner) return m.reply("❌ Hanya admin yang bisa reset link!");
            if (!isBotAdmins) return m.reply("❌ Bot harus jadi admin dulu!");

            try {
                await castorice.groupRevokeInvite(m.chat);
                const newCode = await castorice.groupInviteCode(m.chat);
                return m.reply(
`🔄 *Link Grup Direset!*

🔗 Link baru:
https://chat.whatsapp.com/${newCode}

⚠️ Link lama sudah tidak berlaku.`
                );
            } catch (err) {
                console.error('[GLINK RESET ERROR]', err.message);
                return m.reply("❌ Gagal reset link. Pastikan bot admin!");
            }
        }

        // ── Ambil link ──
        try {
            const code = await castorice.groupInviteCode(m.chat);
            const metadata = await castorice.groupMetadata(m.chat);

            return m.reply(
`🔗 *Link Grup*
━━━━━━━━━━━━━━━━━━━━
👥 Grup: *${metadata.subject}*
👤 Member: ${metadata.participants.length} orang

🔗 https://chat.whatsapp.com/${code}
━━━━━━━━━━━━━━━━━━━━
_Reset link: .glink reset_`
            );
        } catch (err) {
            console.error('[GLINK ERROR]', err.message);
            return m.reply("❌ Gagal ambil link. Pastikan bot admin!");
        }
    }
};