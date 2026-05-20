/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const axios = require('axios');

function getScore(jid) {
    const nomor = jid.replace('@s.whatsapp.net', '');
    let hash = 0;
    for (let i = 0; i < nomor.length; i++) {
        hash = ((hash << 5) - hash) + nomor.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash % 41) + 60; // range 60–100
}

function getBar(score, total = 100, length = 10) {
    const filled = Math.round((score / total) * length);
    return '█'.repeat(filled) + '░'.repeat(length - filled);
}

function pick(arr, jid) {
    const nomor = jid.replace('@s.whatsapp.net', '');
    let hash = 0;
    for (let i = 0; i < nomor.length; i++) hash = ((hash << 3) + hash) ^ nomor.charCodeAt(i);
    return arr[Math.abs(hash) % arr.length];
}

function getLabel(score, jid) {
    if (score >= 95) return pick([
        '👑 Gantengnya udah level sultan, ga ada lawan!',
        '👑 Tampan sempurna, kayak karakter game AAA!',
        '👑 Autoganteng dari lahir, udah takdir dari sononya!'
    ], jid);
    if (score >= 90) return pick([
        '🔥 Super ganteng! Jalan aja bikin cewek-cewek noleh!',
        '🔥 Gantengnya beneran ga ada obat, serius deh!',
        '🔥 Kalo masuk sinetron pasti langsung jadi pemeran utama!'
    ], jid);
    if (score >= 85) return pick([
        '✨ Ganteng banget, vibes-nya langsung keliatan!',
        '✨ Keren abis, aura bad boy tapi baik hati nih!',
        '✨ Tampannya natural, tanpa effort pun udah stand out!'
    ], jid);
    if (score >= 78) return pick([
        '😎 Ganteng! Tapi masih bisa di-upgrade lagi tuh!',
        '😎 Lumayan keren, kalau senyum pasti tambah cakep!',
        '😎 Ganteng kok, tinggal grooming dikit makin sempurna!'
    ], jid);
    if (score >= 70) return pick([
        '🌀 Lumayan ganteng, tergantung pencahayaannya juga!',
        '🌀 Ada wibawa-nya sendiri, yang penting punya attitude!',
        '🌀 Ganteng versi unik, ciri khas sendiri itu nilai plus!'
    ], jid);
    return pick([
        '🙈 Hmm... kepribadiannya mungkin lebih menonjol nih!',
        '🙈 Ganteng itu dari attitude kok, santai aja bro!',
        '🙈 Belum ketemu angle yang pas, coba foto ulang ntar!'
    ], jid);
}

module.exports = {
    name: 'Cek Ganteng',
    command: ['cekganteng', 'ganteng'],
    category: 'cek',
    run: async (castorice, m, { prefix, command }) => {
        const target = m.mentionedJid?.[0] || m.quoted?.sender || null;

        if (!target) {
            return m.reply(`Tag seseorang dulu!\nContoh: *${prefix + command} @nomor*`);
        }

        const nomor = target.replace('@s.whatsapp.net', '');
        const score = getScore(target);
        const bar = getBar(score);
        const label = getLabel(score, target);
        
        let ppUrl = null;
        try { ppUrl = await castorice.profilePictureUrl(target, 'image'); } catch {}

        const caption =
            `🔥 *CEK GANTENG* 🔥\n` +
            `━━━━━━━━━━━━━━━━\n` +
            `👤 Nama   : *@${target.split('@')[0]}*\n` +
            `📱 Nomor  : *+${nomor}*\n` +
            `━━━━━━━━━━━━━━━━\n` +
            `📊 Skor   : *${score}/100*\n` +
            `${bar}\n` +
            `💬 ${label}\n` +
            `━━━━━━━━━━━━━━━━\n`
        if (ppUrl) {
            try {
                const res = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 10000 });
                return await castorice.sendMessage(m.chat, {
                    image: Buffer.from(res.data),
                    caption,
                    mentions: [target]
                }, { quoted: m });
            } catch {}
        }

        await castorice.sendMessage(m.chat, { text: caption, mentions: [target] }, { quoted: m });
    }
};