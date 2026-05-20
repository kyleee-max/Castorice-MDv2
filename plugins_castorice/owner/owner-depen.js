const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

module.exports = {
 name: 'Tambah Dependency',
 command: ['adddepen', 'tambahdepen'],
 category: 'owner',
 run: async (castorice, m, { text, isOwner }) => {
 if (!isOwner) return m.reply("Maaf, fitur ini hanya untuk owner bot.");
 if (!text) return m.reply(`📦 *CARA MENGGUNAKAN:*\n\n.adddepen <nama_package> <version>\n\n*Contoh:*\n.adddepen express\n.adddepen mongoose ^5.13.0`);

 const args = text.split(' ');
 const depName = args[0];
 let depVersion = args[1] || "latest";

 if (depVersion !== "latest" && !depVersion.startsWith('^') && !depVersion.startsWith('~')) {
 depVersion = `^${depVersion}`;
 }

 m.reply(`⏳ Menambahkan *${depName}@${depVersion}*...`);

 try {
 const packagePath = path.join(process.cwd(), 'package.json');
 const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

 if (packageJson.dependencies[depName]) {
 return m.reply(`⚠️ *${depName}* sudah ada (${packageJson.dependencies[depName]})`);
 }

 packageJson.dependencies[depName] = depVersion;

 const sorted = {};
 Object.keys(packageJson.dependencies).sort().forEach(key => sorted[key] = packageJson.dependencies[key]);
 packageJson.dependencies = sorted;

 fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

 m.reply(`📦 Install *${depName}*...`);

 exec(`npm install ${depName}@${depVersion}`, (error) => {
 if (error) {
 return m.reply(`❌ Install gagal, tapi sudah ditambahkan ke package.json\n\nManual: npm install ${depName}`);
 }

 m.reply(`✅ *${depName}* berhasil diinstall!\n\n🔄 Restart...`);
 setTimeout(() => process.exit(), 2000);
 });

 } catch (e) {
 m.reply(`❌ Error: ${e.message}`);
 }
 }
};