const fs = require('fs')
const path = require('path')

module.exports = {
    name: 'Get Library',
    command: ['getlib', 'gl', 'readlib'],
    category: 'owner',
    run: async (castorice, m, { text, isOwner }) => {

        if (!isOwner) return m.reply("Fitur ini hanya dapat digunakan oleh Developer.")

        if (!text) return m.reply("Masukkan nama file yang ingin dibaca. Contoh: *.getlib tools*")

        let filename = text.trim()
        if (!filename.endsWith('.js')) filename += '.js'

        const targetPath = path.join(process.cwd(), 'lib', filename)

        if (!fs.existsSync(targetPath)) {
            return m.reply(`❌ File *${filename}* tidak ditemukan di folder /lib.`)
        }

        try {
            const code = fs.readFileSync(targetPath, 'utf8')
            m.reply(`📄 *File:* ${filename}\n\n\`\`\`javascript\n${code}\n\`\`\``)
        } catch (err) {
            m.reply(`❌ Gagal baca file: ${err.message}`)
        }
    }
}