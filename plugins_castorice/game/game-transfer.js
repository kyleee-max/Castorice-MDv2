/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

// ─── TAMBAH DI plugins_castorice/game/transfer.js ───

const { getUser, addKoin, deductKoin } = require('../../lib/stats-helper');

const MIN_TRANSFER = 10;
const MAX_TRANSFER = 50000;

module.exports = {
    name: "Transfer Koin",
    command: ["transfer", "kirim", "tf"],
    category: "game",
    run: async (castorice, m, { prefix, args }) => {
        const userId = m.sender;

        // Resolve target
        const target = m.mentionedJid?.[0] || m.quoted?.sender || null;
        const amount = parseInt(m.mentionedJid?.[0] ? args[1] : m.quoted ? args[1] : args[2] || args[1]);

        if (!target) return m.reply(
`❌ Format salah!

Cara:
• Tag: ${prefix}transfer @tag <jumlah>
• Reply: reply pesan → ${prefix}transfer <jumlah>

Min: ${MIN_TRANSFER} koin | Max: ${MAX_TRANSFER.toLocaleString('id-ID')} koin`
        );

        if (target === userId) return m.reply(`❌ Tidak bisa transfer ke diri sendiri!`);
        if (!amount || isNaN(amount) || amount <= 0) return m.reply(`❌ Jumlah tidak valid!`);
        if (amount < MIN_TRANSFER) return m.reply(`❌ Minimum transfer ${MIN_TRANSFER} koin!`);
        if (amount > MAX_TRANSFER) return m.reply(`❌ Maksimum transfer ${MAX_TRANSFER.toLocaleString('id-ID')} koin!`);

        const sender = getUser(userId);
        if (sender.koin < amount) return m.reply(`❌ Koin tidak cukup!\nKoin kamu: ${sender.koin.toLocaleString('id-ID')}`);

        deductKoin(userId, amount);
        addKoin(target, amount);

        const senderAfter = getUser(userId);
        const targetAfter = getUser(target);

        return m.reply(
`💸 *Transfer Berhasil!*

👤 Dari: @${userId.split('@')[0]}
👤 Ke: @${target.split('@')[0]}
💰 Jumlah: ${amount.toLocaleString('id-ID')} Koin

💴 Saldo kamu: ${senderAfter.koin.toLocaleString('id-ID')} Koin
💴 Saldo @${target.split('@')[0]}: ${targetAfter.koin.toLocaleString('id-ID')} Koin`,
        { mentions: [userId, target] });
    }
};