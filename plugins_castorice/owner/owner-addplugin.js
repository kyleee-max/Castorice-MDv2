const fs = require('fs')
const path = require('path')

module.exports = {
    name: 'Add Plugin',
    command: ['addplugin', 'ap'],
    category: 'owner',
    run: async (castorice, m, { text, isOwner }) => {
        if (!isOwner) return m.reply("Fitur ini hanya dapat digunakan oleh Developer.")
        if (!text.includes('|')) {
            return m.reply("Format salah! Contoh:\n.ap owner/test.js | module.exports = { ... }")
        }
        let [filePath, ...codeArr] = text.split('|')
        let pathClean = filePath.trim()
        let code = codeArr.join('|').trim()
        const baseDir = path.join(__dirname, '../../plugins_nana')
        const targetPath = path.join(baseDir, pathClean)
        try {
            // Cek folder tujuannya ada gak? Kalau gak ada, bikin dulu
            const folder = path.dirname(targetPath)
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder, { recursive: true })
            }
            fs.writeFileSync(targetPath, code)
            m.reply(`✅ *Plugin Berhasil Dibuat!*\n\n` +
                    `📁 *Path:* plugins_nana/${pathClean}\n` +
                    `🚀 *Status:* Aktif`)
        } catch (err) {
            console.error(err)
            m.reply(`❌ Gagal: ${err.message}`)
        }
    }
}