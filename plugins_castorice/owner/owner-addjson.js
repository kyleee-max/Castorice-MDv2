const fs = require('fs');
const path = require('path');

module.exports = {
 name: 'Add JSON Database',
 command: ['addjson', 'aj'],
 category: 'owner',
 description: 'Bikin file JSON baru di folder database',

 run: async (castorice, m, { text, isOwner }) => {
 if (!isOwner) return m.reply('❌ Fitur ini hanya dapat digunakan oleh Developer.');

 if (!text) return m.reply(
 `📋 *FORMAT ADDJSON*\n\n` +
 `*.addjson <namafile> | <isi json>*\n\n` +
 `*Contoh:*\n` +
 `*.addjson points | {}*\n` +
 `*.addjson blacklist | []*\n` +
 `*.addjson config | {"prefix":".","limit":10}*\n\n` +
 `_Otomatis disimpen ke folder /database/_`
 );

 if (!text.includes('|')) return m.reply(
 `⚠️ Format perintah salah.\n\n` +
 `*.addjson <namafile> | <isi json>*\n` +
 `Contoh: *.addjson points | {}*`
 );

 let [namePart, ...jsonParts] = text.split('|');
 let filename = namePart.trim();
 let jsonStr = jsonParts.join('|').trim();

 if (!filename.endsWith('.json')) filename += '.json';

 let parsed;
 try {
 parsed = JSON.parse(jsonStr);
 } catch (e) {
 return m.reply(
 `❌ *Format JSON tidak valid.*\n\n` +
 `Error: _${e.message}_\n\n` +
 `Pastiin format JSON-nya bener ya, contoh:\n` +
 `• Object: *{}*\n` +
 `• Array: *[]*\n` +
 `• Data: *{"key":"value"}*`
 );
 }

 const dbDir = path.join(process.cwd(), 'database');
 const filePath = path.join(dbDir, filename);

 try {

 if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

 if (fs.existsSync(filePath)) {
 return m.reply(
 `⚠️ *File sudah ada.*\n\n` +
 `📄 *File:* ${filename}\n` +
 `📁 *Path:* /database/${filename}\n\n` +
 `Kalau mau overwrite, hapus dulu pake *.deljson ${filename}*`
 );
 }

 fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf8');

 m.reply(
 `✅ *BERHASIL BIKIN JSON!*\n\n` +
 `📄 *File:* ${filename}\n` +
 `📁 *Path:* /database/${filename}\n` +
 `📦 *Isi awal:* ${jsonStr}\n\n` +
 `_Sekarang bisa di-require di kode lu pake:_\n` +
 `\`require('./database/${filename}')\``
 );

 console.log(`[ADDJSON] File baru dibuat: /database/${filename}`);

 } catch (err) {
 console.error('[ADDJSON ERROR]', err);
 m.reply(`❌ Gagal membuat file.\n_${err.message}_`);
 }
 }
};