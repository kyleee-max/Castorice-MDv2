const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

module.exports = {
    name: 'Backup Script',
    command: ['backup', 'bckp'],
    category: 'owner',
    run: async (castorice, m, { command, isOwner }) => {

        if (!isOwner) return m.reply("Akses ditolak.");

        const fileName = `Castorice_${new Date().getTime()}.zip`;
        const output = fs.createWriteStream(fileName);
        const archive = archiver('zip', { zlib: { level: 9 } });

        m.reply("⏳ *Processing backup...* Mengirim ke Private Chat Bot.");

        output.on('close', async () => {
            const size = (archive.pointer() / 1024 / 1024).toFixed(2);

            const botNumber = castorice.user.id.split(':')[0] + '@s.whatsapp.net';

            await castorice.sendMessage(botNumber, {
                document: fs.readFileSync(fileName),
                mimetype: 'application/zip',
                fileName: fileName,
                caption: `✅ *BACKUP SUCCESS*\n📦 *Size:* ${size} MB\n📅 *Date:* ${new Date().toLocaleString()}`
            });

            m.reply(`✅ Backup selesai. File telah dikirim ke chat pribadi.`);

            fs.unlinkSync(fileName);
        });

        archive.on('error', (err) => { throw err; });
        archive.pipe(output);

        const files = fs.readdirSync('./');
        files.forEach(file => {
            const fullPath = path.join('./', file);
            const isDirectory = fs.lstatSync(fullPath).isDirectory();

            if (
                file !== 'node_modules' &&
                file !== 'package-lock.json' &&
                file !== 'castorice_session' &&
                file !== '.npm' &&
                !file.endsWith('.zip')
            ) {
                if (isDirectory) {
                    archive.directory(fullPath, file);
                } else {
                    archive.file(fullPath, { name: file });
                }
            }
        });

        await archive.finalize();
    }
};