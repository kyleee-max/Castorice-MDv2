const fs = require('fs')
const path = require('path')

module.exports = {
    name: 'Add Library',
    command: ['addlib', 'addfunc', 'al'],
    category: 'owner',
    run: async (castorice, m, { text, isOwner }) => {

        if (!isOwner) return m.reply("Fitur ini hanya dapat digunakan oleh Developer. Dilarang melakukan injeksi kode.")

        if (!text.includes('|')) {
            return m.reply("Format perintah salah. Contoh:\n*.addlib tools | module.exports = { ... }*")
        }

        let [name, ...codeArr] = text.split('|')
        let filename = name.trim()
        let code = codeArr.join('|').trim()

        if (!filename.endsWith('.js')) filename += '.js'

        const targetDir = path.join(process.cwd(), 'lib')
        const targetPath = path.join(targetDir, filename)

        try {

            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true })
            }

            fs.writeFileSync(targetPath, code)

            m.reply(`✅ *Lib Berhasil Ditambah!*\n\n` +
                    `📁 *Folder:* /lib\n` +
                    `📄 *File:* ${filename}\n\n` +
                    `💡 *Catatan:* Jika ini fungsi baru, pastikan di-require di file utama agar dapat digunakan.`)

            console.log(`[LOG] New Lib added by owner: ${filename}`)
        } catch (err) {
            console.error(err)
            m.reply(`❌ Gagal menulis file lib: ${err.message}`)
        }
    }
}