const fs = require('fs')

const path = require('path')

// Fungsi rekursif buat nyari file di dalam sub-folder

function findFile(dir, filename) {
    const files = fs.readdirSync(dir)
    for (const file of files) {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
            const found = findFile(fullPath, filename)
            if (found) return found
        } else if (file === filename) {
            return fullPath
        }
    }
    return null
}

module.exports = {
    name: 'Get Plugin',
    command: ['getplugin', 'gp'],
    category: 'owner',
    run: async (castorice, m, { text, isOwner }) => {

        if (!isOwner) return m.reply("Fitur ini hanya dapat digunakan oleh Developer.")

        if (!text) return m.reply("Masukkan nama file plugin yang ingin dibaca. Contoh: .gp menu.js")
        let filename = text.trim()
        if (!filename.endsWith('.js')) filename += '.js'
        const pluginsDir = path.join(__dirname, '../../plugins_nana') 
        try {
            const targetPath = findFile(pluginsDir, filename)
            if (!targetPath) {
                return m.reply(`File '${filename}' tidak ditemukan di folder mana pun dalam plugins_nana.`)
            }

            let code = fs.readFileSync(targetPath, 'utf8')
            m.reply(code)
        } catch (err) {
            console.error(err)
            m.reply(`Gagal membaca file: ${err.message}`)
        }
    }
}