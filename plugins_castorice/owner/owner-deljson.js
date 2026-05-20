const fs = require('fs');
const path = require('path');

module.exports = {
 name: 'Delete JSON Database',
 command: ['deljson', 'dj'],
 category: 'owner',
 description: 'Hapus file JSON dari folder database',

 run: async (castorice, m, { text, isOwner }) => {
 if (!isOwner) return m.reply('❌ Fitur ini hanya dapat digunakan oleh Developer.');

 if (!text) return m.reply(
 `📋 *FORMAT DELJSON*\n\n` +
 `*.deljson <namafile>*\n\n` +
 `*Contoh:*\n` +
 `*.deljson kbbi*\n` +
 `*.deljson points.json*\n\n` +
 `_File akan dihapus permanen dari /database/_`
 );

 let filename = text.trim();
 if (!filename.endsWith('.json')) filename += '.json';

 const dbDir = path.join(process.cwd(), 'database');
 const filePath = path.join(dbDir, filename);

 if (!filePath.startsWith(dbDir)) return m.reply('❌ Akses di luar folder database tidak diizinkan.');

 if (!fs.existsSync(filePath)) {
 return m.reply(`❌ File *${filename}* tidak ditemukan.`);
 }

 try {
 fs.unlinkSync(filePath);
 m.reply(
 `🗑️ *BERHASIL HAPUS!*\n\n` +
 `📄 *File:* ${filename}\n` +
 `📁 *Path:* /database/${filename}\n\n` +
 `_File udah dihapus permanen._`
 );
 console.log(`[DELJSON] File dihapus: /database/${filename}`);
 } catch (err) {
 console.error('[DELJSON ERROR]', err);
 m.reply(`❌ Gagal menghapus file.\n_${err.message}_`);
 }
 }
};