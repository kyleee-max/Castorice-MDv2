/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const fs = require("fs")
const chalk = require("chalk")

// Settingan Bot
global.owner = "Kael's"
global.bot = "Castorice MD"
global.nomorown = "628386859765"   // Nomor Owner
global.nomorbor = "62xxxx"
global.nomorauthor = "628386859765" // Nomor Author
global.version = "1.0"

// Set thumbnail Bot
global.thumb = {
 menu: "https://raw.githubusercontent.com/kyleee-max/mutsumi-file/main/uploads/1779033636326.jpeg",
}

// Set Message 
global.mess = {
 owner: "Mouu!!!, Kono komando wa Kaeru dake ga tsukaemasu",
 admin: "Ara? Anata wa admin desu ka?",
 gc: "Kore wa guruupu sen'you desu"
}

// Hot Realod Jangan di hapus
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.black(chalk.bgYellow(' UPDATED ')), chalk.white(`Setting baru di-load: ${__filename}`));
    delete require.cache[file];
    require(file);
});
