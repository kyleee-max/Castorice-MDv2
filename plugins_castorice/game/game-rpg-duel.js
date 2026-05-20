/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/
const { generateWAMessageFromContent } = require('@whiskeysocket/baileys');
const { getChar, saveChar, CLASSES } = require('../../lib/rpg-helper');
const { getUser, deductKoin, addKoin, recordGame } = require('../../lib/stats-helper');

const WIN_KOIN_BONUS = 50;
const XP_WIN = 30;
const XP_LOSS = 8;
const DUEL_TIMEOUT = 60 * 1000; // 60 detik buat accept


const duelRequests = {};
const duelSessions = {};

function generateBar(current, max, length = 8) {
    const filled = Math.round((Math.min(current, max) / max) * length);
    return `[${'█'.repeat(Math.max(0, filled))}${'░'.repeat(Math.max(0, length - filled))}]`;
}

function calcDamage(attacker, defender) {
    const base = Math.max(1, attacker.atk - Math.floor(defender.def * 0.5));
    const intBonus = Math.floor(attacker.int * 0.3);
    const isCrit = Math.random() * 100 < attacker.crit;
    const isDodge = Math.random() * 100 < Math.min(defender.agi * 0.4, 30);

    if (isDodge) return { dmg: 0, isCrit: false, isDodge: true };

    const raw = base + intBonus + Math.floor(Math.random() * 10);
    const dmg = isCrit ? Math.floor(raw * 1.8) : raw;
    return { dmg, isCrit, isDodge: false };
}

function buildDuelChar(char) {
    return {
        class: char.class,
        hp: char.hp,
        maxHp: char.maxHp,
        atk: char.atk,
        def: char.def,
        int: char.int,
        agi: char.agi,
        crit: char.crit
    };
}

module.exports = {
    name: "RPG Duel",
    command: ["rpgduel", "rpg-duel", "duel"],
    category: "game",
    run: async (castorice, m, { prefix, args }) => {
        const chatId = m.chat;
        const userId = m.sender;
        const sub = args[0]?.toLowerCase();

        if (sub === 'accept' || sub === 'terima') {
            const req = duelRequests[chatId];
            if (!req) return m.reply(`❌ Tidak ada tantangan duel aktif!`);
            if (req.target !== userId) return m.reply(`❌ Tantangan ini bukan untukmu!`);

            clearTimeout(req.timeout);
            delete duelRequests[chatId];

            const charA = getChar(req.challenger);
            const charB = getChar(userId);

            if (!charA) return m.reply(`❌ Penantang tidak punya karakter RPG!`);
            if (!charB) return m.reply(`❌ Kamu belum punya karakter RPG!\n${prefix}rpg start`);

            const clsA = CLASSES[charA.class];
            const clsB = CLASSES[charB.class];

            // Cek koin taruhan
            const userAKoin = getUser(req.challenger).koin;
            const userBKoin = getUser(userId).koin;
            if (req.taruhan > 0) {
                if (userAKoin < req.taruhan) return m.reply(`❌ Penantang tidak punya cukup koin!`);
                if (userBKoin < req.taruhan) return m.reply(`❌ Koinmu tidak cukup! Butuh: ${req.taruhan}`);
                deductKoin(req.challenger, req.taruhan);
                deductKoin(userId, req.taruhan);
            }

            // Simpan sesi duel
            duelSessions[chatId] = {
                playerA: { id: req.challenger, char: buildDuelChar(charA), cls: clsA },
                playerB: { id: userId,         char: buildDuelChar(charB), cls: clsB },
                turn: req.challenger,
                taruhan: req.taruhan,
                round: 1
            };

            const buttons = [
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "⚔️ Serang", id: `${prefix}rpgduel serang` }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "✨ Skill", id: `${prefix}rpgduel skill` }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "💨 Kabur", id: `${prefix}rpgduel kabur` }) }
            ];

            const sesi = duelSessions[chatId];
            const msg = generateWAMessageFromContent(chatId, {
                viewOnceMessage: { message: { interactiveMessage: {
                    body: { text:
`⚔️ *DUEL DIMULAI!*
━━━━━━━━━━━━━━━━━━━━
${clsA.emoji} @${req.challenger.split('@')[0]} (${clsA.name})
❤️ ${generateBar(sesi.playerA.char.hp, sesi.playerA.char.maxHp)} ${sesi.playerA.char.hp} HP

VS

${clsB.emoji} @${userId.split('@')[0]} (${clsB.name})
❤️ ${generateBar(sesi.playerB.char.hp, sesi.playerB.char.maxHp)} ${sesi.playerB.char.hp} HP
━━━━━━━━━━━━━━━━━━━━
💰 Taruhan: ${req.taruhan > 0 ? `${req.taruhan * 2} koin` : 'Tidak ada'}

🎯 Giliran: @${req.challenger.split('@')[0]}` },
                    footer: { text: '' },
                    nativeFlowMessage: { buttons }
                }}}
            }, { quoted: m });

            return await castorice.relayMessage(chatId, msg.message, { messageId: msg.key.id, userJid: chatId });
        }

        // ── DECLINE duel ──
        if (sub === 'decline' || sub === 'tolak') {
            const req = duelRequests[chatId];
            if (!req) return m.reply(`❌ Tidak ada tantangan duel aktif!`);
            if (req.target !== userId) return m.reply(`❌ Tantangan ini bukan untukmu!`);
            clearTimeout(req.timeout);
            delete duelRequests[chatId];
            return m.reply(`❌ @${userId.split('@')[0]} menolak tantangan duel!`, { mentions: [userId] });
        }

        // ── AKSI DALAM DUEL (serang, skill, kabur) ──
        if (['serang', 'attack', 'skill', 'kabur', 'flee'].includes(sub)) {
            const sesi = duelSessions[chatId];
            if (!sesi) return m.reply(`❌ Tidak ada duel aktif!\nTantang seseorang: ${prefix}rpgduel @tag <taruhan>`);
            if (sesi.turn !== userId) return m.reply(`⏳ Bukan giliranmu! Tunggu lawanmu bergerak.`);

            const isA = sesi.playerA.id === userId;
            const attacker = isA ? sesi.playerA : sesi.playerB;
            const defender = isA ? sesi.playerB : sesi.playerA;

            // ── Kabur ──
            if (sub === 'kabur' || sub === 'flee') {
                // Penantang yang kabur kena penalti
                if (sesi.taruhan > 0) addKoin(defender.id, sesi.taruhan * 2);
                delete duelSessions[chatId];
                return m.reply(
`💨 *@${userId.split('@')[0]} melarikan diri!*

${defender.cls.emoji} @${defender.id.split('@')[0]} menang secara default!
${sesi.taruhan > 0 ? `💰 ${sesi.taruhan * 2} koin dikembalikan ke pemenang.` : ''}`,
                { mentions: [userId, defender.id] });
            }

            // ── Hitung damage ──
            let actionLabel = '⚔️ Menyerang';
            let atkStat = { ...attacker.char };

            if (sub === 'skill') {
                // Skill boost INT-based
                atkStat = { ...attacker.char, atk: attacker.char.atk + Math.floor(attacker.char.int * 0.5), crit: Math.min(attacker.char.crit + 15, 60) };
                actionLabel = '✨ Menggunakan Skill';
            }

            const { dmg, isCrit, isDodge } = calcDamage(atkStat, defender.char);

            let roundLog = `*Round ${sesi.round}*\n`;
            roundLog += `${attacker.cls.emoji} @${attacker.id.split('@')[0]} ${actionLabel}`;

            if (isDodge) {
                roundLog += `\n💨 @${defender.id.split('@')[0]} *DODGE!* Serangan meleset!`;
            } else {
                defender.char.hp = Math.max(0, defender.char.hp - dmg);
                roundLog += `\n💥 ${isCrit ? '🔥 *CRITICAL!* ' : ''}${dmg} damage ke @${defender.id.split('@')[0]}!`;
            }

            sesi.round++;

            // ── Cek menang ──
            if (defender.char.hp <= 0) {
                const winner = attacker;
                const loser = defender;
                delete duelSessions[chatId];

                // Reward
                const totalPrize = sesi.taruhan * 2 + WIN_KOIN_BONUS;
                if (sesi.taruhan > 0) addKoin(winner.id, sesi.taruhan * 2);
                addKoin(winner.id, WIN_KOIN_BONUS);

                const { levelUp: wLvUp, newLevel: wLv } = recordGame(winner.id, 'win', WIN_KOIN_BONUS, XP_WIN);
                recordGame(loser.id, 'loss', 0, XP_LOSS);

                return m.reply(
`${roundLog}

━━━━━━━━━━━━━━━━━━━━
🏆 *DUEL SELESAI!*

🥇 Pemenang: ${winner.cls.emoji} @${winner.id.split('@')[0]}
💀 Kalah: ${loser.cls.emoji} @${loser.id.split('@')[0]}

💰 +${totalPrize} Koin
✨ +${XP_WIN} XP${wLvUp ? `\n🎉 *LEVEL UP! → Lv.${wLv}*` : ''}
━━━━━━━━━━━━━━━━━━━━`,
                { mentions: [winner.id, loser.id] });
            }

            // ── Lanjut, ganti giliran ──
            sesi.turn = defender.id;

            const buttons = [
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "⚔️ Serang", id: `${prefix}rpgduel serang` }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "✨ Skill", id: `${prefix}rpgduel skill` }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "💨 Kabur", id: `${prefix}rpgduel kabur` }) }
            ];

            const hpA = isA ? attacker.char.hp : defender.char.hp;
            const hpB = isA ? defender.char.hp : attacker.char.hp;

            const msg = generateWAMessageFromContent(chatId, {
                viewOnceMessage: { message: { interactiveMessage: {
                    body: { text:
`${roundLog}

━━━━━━━━━━━━━━━━━━━━
${sesi.playerA.cls.emoji} @${sesi.playerA.id.split('@')[0]}
❤️ ${generateBar(hpA, sesi.playerA.char.maxHp)} ${hpA} HP

${sesi.playerB.cls.emoji} @${sesi.playerB.id.split('@')[0]}
❤️ ${generateBar(hpB, sesi.playerB.char.maxHp)} ${hpB} HP
━━━━━━━━━━━━━━━━━━━━
🎯 Giliran: @${defender.id.split('@')[0]}` },
                    footer: { text: '' },
                    nativeFlowMessage: { buttons }
                }}}
            }, { quoted: m });

            return await castorice.relayMessage(chatId, msg.message, { messageId: msg.key.id, userJid: chatId });
        }

        // ── TANTANG pemain ──
        const target = m.mentionedJid?.[0] || (m.quoted?.sender);
        if (!target) {
            return m.reply(
`⚔️ *RPG Duel*

Tantang pemain lain untuk duel 1v1!

Cara: *${prefix}rpgduel @tag <taruhan>*
Contoh:
• ${prefix}rpgduel @tag 100  → taruhan 100 koin
• ${prefix}rpgduel @tag 0    → duel gratis

Target harus reply *${prefix}rpgduel accept* dalam 60 detik.`
            );
        }

        if (target === userId) return m.reply(`❌ Tidak bisa duel dengan diri sendiri!`);

        const charA = getChar(userId);
        if (!charA) return m.reply(`❌ Kamu belum punya karakter RPG!\n${prefix}rpg start`);

        const charB = getChar(target);
        if (!charB) return m.reply(`❌ Target belum punya karakter RPG!`);

        if (charA.inDungeon) return m.reply(`⚠️ Kamu sedang dalam dungeon! Selesaikan dulu.`);
        if (charB.inDungeon) return m.reply(`⚠️ Target sedang dalam dungeon!`);

        if (duelRequests[chatId]) return m.reply(`⚠️ Sudah ada tantangan duel aktif di chat ini!`);
        if (duelSessions[chatId]) return m.reply(`⚠️ Sedang ada duel berlangsung di chat ini!`);

        const taruhanRaw = m.mentionedJid?.[0] ? args[1] : args[0];
        const taruhan = Math.max(0, parseInt(taruhanRaw) || 0);

        if (taruhan > 0) {
            const koinA = getUser(userId).koin;
            if (koinA < taruhan) return m.reply(`❌ Koinmu tidak cukup!\nPunya: ${koinA} | Taruhan: ${taruhan}`);
        }

        const clsA = CLASSES[charA.class];
        const clsB = CLASSES[charB.class];

        // Simpan request
        const timeoutId = setTimeout(() => {
            if (duelRequests[chatId]?.challenger === userId) {
                delete duelRequests[chatId];
                castorice.sendMessage(chatId, { text: `⏰ Tantangan duel dari @${userId.split('@')[0]} kedaluwarsa!`, mentions: [userId] });
            }
        }, DUEL_TIMEOUT);

        duelRequests[chatId] = { challenger: userId, target, taruhan, timeout: timeoutId };

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "✅ Terima", id: `${prefix}rpgduel accept` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "❌ Tolak", id: `${prefix}rpgduel decline` }) }
        ];

        const msg = generateWAMessageFromContent(chatId, {
            viewOnceMessage: { message: { interactiveMessage: {
                body: { text:
`⚔️ *TANTANGAN DUEL!*
━━━━━━━━━━━━━━━━━━━━
${clsA.emoji} @${userId.split('@')[0]} (${clsA.name})
❤️ HP: ${charA.hp}/${charA.maxHp} | ⚔️ ATK: ${charA.atk}

menantang...

${clsB.emoji} @${target.split('@')[0]} (${clsB.name})
❤️ HP: ${charB.hp}/${charB.maxHp} | ⚔️ ATK: ${charB.atk}
━━━━━━━━━━━━━━━━━━━━
💰 Taruhan: ${taruhan > 0 ? `${taruhan} koin` : 'Tidak ada (Duel Gratis)'}
⏰ Waktu: 60 detik

@${target.split('@')[0]}, terima tantangan ini?` },
                footer: { text: '' },
                nativeFlowMessage: { buttons }
            }}}
        }, { quoted: m });

        return await castorice.relayMessage(chatId, msg.message, { messageId: msg.key.id, userJid: chatId });
    }
};