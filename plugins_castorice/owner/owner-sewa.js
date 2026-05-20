const fs = require('fs')
const path = require('path')

const sewaFile = path.join(__dirname, '../../database/sewa.json')

/**
 * Helper untuk mengelola database sewa
 */
function loadSewa() {
    if (!fs.existsSync(sewaFile)) fs.writeFileSync(sewaFile, '{}')
    return JSON.parse(fs.readFileSync(sewaFile, 'utf-8'))
}

function saveSewa(data) {
    fs.writeFileSync(sewaFile, JSON.stringify(data, null, 2))
}

/**
 * Fungsi untuk mendapatkan Group ID dari link invite atau string ID
 */
async function getGroupId(castorice, input) {
    if (!input) return null
    if (input.includes('@g.us')) return input
    if (/^\d{15,100}$/.test(input)) return input + '@g.us'
    
    // Regex untuk link invite WhatsApp
    const linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i
    const match = input.match(linkRegex)
    
    if (match) {
        try {
            // Mengambil metadata grup dari link tanpa harus join dulu
            const res = await castorice.groupGetInviteInfo(match[1])
            return res.id 
        } catch (e) {
            console.error('Gagal parse link invite:', e)
            return null
        }
    }
    return null
}

function parseDuration(str) {
    const match = str.match(/^(\d+)d$/i)
    if (!match) return null
    return parseInt(match[1])
}

function formatExpired(ms) {
    const d = new Date(ms)
    return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
}

function sisaWaktu(expiredAt) {
    const sisa = expiredAt - Date.now()
    if (sisa <= 0) return 'Sudah expired'
    const hari = Math.floor(sisa / 86400000)
    const jam = Math.floor((sisa % 86400000) / 3600000)
    const menit = Math.floor((sisa % 3600000) / 60000)
    return `${hari}h ${jam}j ${menit}m`
}

module.exports = {
    name: 'Sewa Bot',
    command: ['sewa', 'ceksewa', 'stopsewa', 'listsewa'],
    category: 'owner',

    // ─── Auto-check expired setiap pesan masuk ───
    onMessage: async (castorice, m, { isOwner }) => {
        if (!m.isGroup) return
        const sewa = loadSewa()
        const groupId = m.key.remoteJid
        const entry = sewa[groupId]
        if (!entry) return

        if (Date.now() > entry.expiredAt) {
            await castorice.sendMessage(groupId, {
                text: `⏰ *Masa sewa bot telah habis!*\n\nTerima kasih sudah menggunakan Castorice MD.\nSilakan hubungi author untuk perpanjang sewa.\n\n_Bot akan keluar otomatis..._`
            })
            await new Promise(r => setTimeout(r, 3000))
            await castorice.groupLeave(groupId)
            delete sewa[groupId]
            saveSewa(sewa)
        }
    },

    run: async (castorice, m, { args, prefix, command, isAuthor }) => {
        const sewa = loadSewa()

        // ─── .sewa <link/id> <durasi> ───
        if (command === 'sewa') {
            if (!isAuthor) return m.reply('Khusus Author/Owner!')
            if (args.length < 2) return m.reply(
                `❌ Format salah!\n\nContoh:\n› ${prefix}sewa https://chat.whatsapp.com/ExAmPlE 30d\n› ${prefix}sewa 120363xxxxxx 7d`
            )

            const groupId = await getGroupId(castorice, args[0])
            if (!groupId) return m.reply(`❌ Link invite atau ID grup tidak valid! Pastikan link benar.`)

            const hari = parseDuration(args[1])
            if (!hari || hari <= 0) return m.reply(`❌ Format durasi salah! Gunakan format angka + 'd' (Contoh: 30d)`)

            const now = Date.now()
            // Jika grup sudah ada di database, perpanjang dari tanggal expired lama
            const baseTime = sewa[groupId] ? Math.max(sewa[groupId].expiredAt, now) : now
            const newExpired = baseTime + (hari * 24 * 60 * 60 * 1000)
            const isPerpanjang = !!sewa[groupId]

            sewa[groupId] = {
                groupId,
                addedAt: sewa[groupId]?.addedAt || now,
                expiredAt: newExpired,
                totalHari: (sewa[groupId]?.totalHari || 0) + hari
            }
            saveSewa(sewa)

            // Coba join jika input berupa link
            if (args[0].includes('chat.whatsapp.com')) {
                try {
                    const code = args[0].split('/').pop()
                    await castorice.groupAcceptInvite(code)
                } catch (e) {
                    console.log('Bot gagal join atau sudah di dalam grup.')
                }
            }

            const divider = '─────────────────────'
            return m.reply(
                `✅ *${isPerpanjang ? 'PERPANJANG' : 'AKTIVASI'} SEWA BERHASIL*\n${divider}\n` +
                `› Group ID : ${groupId.replace('@g.us', '')}\n` +
                `› Durasi    : ${hari} hari\n` +
                `› Expired   : ${formatExpired(newExpired)}\n` +
                `› Sisa      : ${sisaWaktu(newExpired)}\n${divider}`
            )
        }

        // ─── .ceksewa ───
        if (command === 'ceksewa') {
            if (!m.isGroup) return m.reply('❌ Perintah ini hanya bisa digunakan di dalam grup!')
            const entry = sewa[m.chat]
            if (!entry) return m.reply(`❌ Grup ini tidak terdaftar dalam database sewa.`)

            const expired = Date.now() > entry.expiredAt
            const divider = '─────────────────────'
            return m.reply(
                `📋 *INFO SEWA BOT*\n${divider}\n` +
                `› Status    : ${expired ? '🔴 Expired' : '🟢 Aktif'}\n` +
                `› Group ID  : ${m.chat.replace('@g.us', '')}\n` +
                `› Expired   : ${formatExpired(entry.expiredAt)}\n` +
                `› Sisa      : ${sisaWaktu(entry.expiredAt)}\n${divider}`
            )
        }

        // ─── .stopsewa <link/id> ───
        if (command === 'stopsewa') {
            if (!isAuthor) return m.reply('Khusus Author!')
            const target = args[0] ? await getGroupId(castorice, args[0]) : m.chat
            
            if (!sewa[target]) return m.reply(`❌ Grup tersebut tidak ditemukan di database sewa.`)

            delete sewa[target]
            saveSewa(sewa)

            try {
                await castorice.sendMessage(target, { text: `🛑 *Sewa bot dihentikan.*\nBot akan segera keluar.` })
                await new Promise(r => setTimeout(r, 2000))
                await castorice.groupLeave(target)
            } catch (e) {}

            return m.reply(`✅ Berhasil menghapus sewa untuk grup tersebut.`)
        }

        // ─── .listsewa ───
        if (command === 'listsewa') {
            if (!isAuthor) return m.reply('Khusus Author!')
            const entries = Object.values(sewa)
            if (entries.length === 0) return m.reply(`📋 Belum ada grup yang menyewa bot.`)

            const divider = '─────────────────────'
            const list = entries.map((e, i) => {
                const expired = Date.now() > e.expiredAt
                return `${expired ? '🔴' : '🟢'} *${i + 1}.* ${e.groupId}\n   Exp: ${formatExpired(e.expiredAt)}`
            }).join('\n\n')

            return m.reply(`📋 *LIST SEWA AKTIF*\n${divider}\n${list}\n${divider}\nTotal: ${entries.length} grup`)
        }
    }
}
