const fs = require('fs')
const path = require('path')

module.exports = {
    name: 'Delete Library',
    command: ['dellib', 'dl', 'removelib'],
    category: 'owner',
    run: async (castorice, m, { text, isOwner }) => {
        if (!isOwner) return m.reply("Fitur ini hanya dapat digunakan oleh Developer.")

        if (!text) return m.reply("Masukkan nama file yang ingin dihapus. Contoh: *.dellib sampah*")

        let filename = text.trim()
        if (!filename.endsWith('.js')) filename += '.js'

        const targetPath = path.join(process.cwd(), 'lib', filename)

        if (!fs.existsSync(targetPath)) {
            return m.reply(`❌ File *${filename}* tidak ditemukan.`)
        }

        try {
            fs.unlinkSync(targetPath)
            m.reply(`🗑️ *Lib Berhasil Dihapus!*\n\n` +
                    `📄 *File:* ${filename}\n` +
                    `💡 *Note:* Kalau file ini tadinya di-require, siap-siap bot lu error/crash pas restart.`)
        } catch (err) {
            m.reply(`❌ Gagal menghapus file: ${err.message}`)
        }
    }
}