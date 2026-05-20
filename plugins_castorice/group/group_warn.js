const fs = require('fs');
const path = './database/warn.json';

const getWarnDB = () => {
    if (!fs.existsSync('./database')) fs.mkdirSync('./database');
    if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));
    return JSON.parse(fs.readFileSync(path));
};

const saveWarnDB = (data) => fs.writeFileSync(path, JSON.stringify(data, null, 2));

module.exports = {
    name: 'Warning System',
    command: ['warn', 'delwarn', 'listwarn', 'resetwarn'],
    category: 'group',
    run: async (castorice, m, { command, isAdmins, isOwner, isBotAdmins }) => {
        if (!m.isGroup) return m.reply('Fitur ini hanya dapat digunakan di dalam grup.');

        let target = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;

        let db = getWarnDB();
        if (!db[m.chat]) db[m.chat] = {};

        if (command === 'warn') {
            if (!isAdmins && !isOwner) return m.reply('Perintah ini hanya dapat digunakan oleh Admin grup.');
            if (!target) return m.reply('Silakan tag atau reply anggota yang ingin diberi peringatan.');

            db[m.chat][target] = (db[m.chat][target] || 0) + 1;
            saveWarnDB(db);

            let count = db[m.chat][target];
            if (count >= 3) {
                if (!isBotAdmins) return m.reply('Batas peringatan tercapai, namun bot bukan Admin.');
                db[m.chat][target] = 0;
                saveWarnDB(db);
                await castorice.groupParticipantsUpdate(m.chat, [target], 'remove');
                m.reply(`Tindakan: Anggota @${target.split('@')[0]} telah dikeluarkan karena mencapai 3 kali peringatan.`, { mentions: [target] });
            } else {
                m.reply(`⚠️ *PERINGATAN* ⚠️\n\nAnggota: @${target.split('@')[0]}\nStatus: ${count}/3`, { mentions: [target] });
            }
        }

        if (command === 'delwarn') {
            if (!isAdmins && !isOwner) return m.reply('Perintah ini hanya dapat digunakan oleh Admin grup.');
            if (!target) return m.reply('Silakan tag anggota yang ingin dikurangi poinnya.');

            if (!db[m.chat][target] || db[m.chat][target] === 0) return m.reply('Anggota tersebut tidak memiliki poin peringatan.');

            db[m.chat][target] -= 1;
            saveWarnDB(db);
            m.reply(`Poin peringatan @${target.split('@')[0]} berhasil dikurangi. Status: ${db[m.chat][target]}/3`, { mentions: [target] });
        }

        if (command === 'listwarn') {
            let list = Object.entries(db[m.chat]).filter(([_, count]) => count > 0);
            if (list.length === 0) return m.reply('Tidak ada anggota yang memiliki poin peringatan.');

            let teks = '📋 *DAFTAR PERINGATAN* 📋\n\n';
            let mentions = [];
            list.forEach(([jid, count]) => {
                teks += `- @${jid.split('@')[0]} : ${count} Warn\n`;
                mentions.push(jid);
            });
            m.reply(teks, { mentions: mentions });
        }

        if (command === 'resetwarn') {
            if (!isAdmins && !isOwner) return m.reply('Perintah ini hanya dapat digunakan oleh Admin grup.');
            if (!target) return m.reply('Silakan tag anggota yang ingin direset.');

            db[m.chat][target] = 0;
            saveWarnDB(db);
            m.reply(`Seluruh poin peringatan @${target.split('@')[0]} telah dihapus.`, { mentions: [target] });
        }
    }
};