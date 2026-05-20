const fs = require('fs')
const path = require('path')

module.exports = {
    name: 'Delete Session',
    command: ['delsessi', 'ds'],
    category: 'owner',
    run: async (castorice, m, { isOwner }) => {
        if (!isOwner) return m.reply("Fitur ini hanya dapat digunakan oleh Developer.")

        const sessionPath = path.join(process.cwd(), 'nana_session')

        if (!fs.existsSync(sessionPath)) {
            return m.reply("Folder session tidak ditemukan. Periksa kembali path yang digunakan.")
        }

        try {
            const files = fs.readdirSync(sessionPath)
            let counter = 0

            files.forEach(file => {

                if (file !== 'creds.json') {
                    fs.unlinkSync(path.join(sessionPath, file))
                    counter++
                }
            })

            m.reply(`✅ *Session Cleared!*\n\n🗑️ Berhasil hapus *${counter}* file sampah.\n💡`)
        } catch (err) {
            m.reply(`❌ Gagal total: ${err.message}`)
        }
    }
}