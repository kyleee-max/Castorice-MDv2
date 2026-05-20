const axios = require('axios');
module.exports = {
    name: 'TikTok Stalk',
    command: ['ttstalk', 'ttstalker', 'stalktiktok'],
    category: 'stalker',
    run: async (castorice, m, { text, prefix, command }) => {
        if (!text) return m.reply(`Mana usernamenya?\nContoh: ${prefix + command} m.rasyaputra`)
        const username = text.replace('@', '');
        m.reply('Wait....')
        try {
            const response = await axios.get(`https://www.tikwm.com/api/user/info?unique_id=${username}`)

            if (response.data.code !== 0) return m.reply(`❌ Gagal mengambil data: ${response.data.msg || 'Username tidak ditemukan'}`)
            const { user: u, stats } = response.data.data

            // Helper buat format angka (1.2K, 1.5M, dll)
            const fx = n => Intl.NumberFormat('id-ID', {
                notation: 'compact',
                compactDisplay: 'short'
            }).format(n || 0) + ` (${n || 0})`

            // Helper buat format waktu (Relative Time)
            const rel = (timestamp) => {
                if (!timestamp || timestamp === 0) return '-'
                const diff = Date.now() - (timestamp * 1000)
                const sec = Math.floor(diff / 1000), min = Math.floor(sec / 60),
                      hour = Math.floor(min / 60), day = Math.floor(hour / 24)
                if (day > 0) return `${day} hari lalu`
                if (hour > 0) return `${hour} jam lalu`
                if (min > 0) return `${min} menit lalu`
                return `Baru saja`
            }

            const caption = `
୧✿ 𝗡𝗶𝗰𝗸𝗡𝗮𝗺𝗲: ${u.nickname || '-'}
୧✿ 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲: @${u.uniqueId}
୧✿ 𝗕𝗶𝗼: ${u.signature || '-'}
୧✿ 𝗜𝗻𝘀𝘁𝗮𝗴𝗿𝗮𝗺: ${u.ins_id || '-'}\n
୧✿ 𝗣𝗲𝗻𝗴𝗶𝗸𝘂𝘁: ${fx(stats.followerCount)}
୧✿ 𝗧𝗼𝘁𝗮𝗹 𝗦𝘂𝗸𝗮: ${fx(stats.heart)}
୧✿ 𝗠𝗲𝗻𝗴𝗶𝗸𝘂𝘁𝗶: ${fx(stats.followingCount)}\n
୧✿ 𝗧𝗼𝘁𝗮𝗹 𝗩𝗶𝗱𝗲𝗼: ${fx(stats.videoCount)}
୧✿ 𝗩𝗲𝗿𝗶𝗳𝗶𝗸𝗮𝘀𝗶: ${u.verified ? '✅ Ya' : '❌ Tidak'}
୧✿ 𝗔𝗸𝘂𝗻 𝗣𝗿𝗶𝘃𝗮𝘁: ${u.secret ? 'Ya' : 'Tidak'}\n
୧✿ 𝗔𝗸𝘂𝗻 𝗗𝗶𝗯𝘂𝗮𝘁: ${rel(u.createTime)}
`.trim()

            // Kirim pake format Product biar keren ala bot premium
            await castorice.sendMessage(m.chat, {
                product: {
                    productImage: { url: u.avatarLarger || u.avatarMedium },
                    productId: u.id,
                    title: ` 「 DATA TIKTOK 」`,
                    description: "",
                    currencyCode: null,
                    priceAmount1000: null,
                    retailerId: 'ZyncDev',
                    url: `https://www.tiktok.com/@${u.uniqueId}`,
                    productImageCount: 1
                },
                businessOwnerJid: m.sender,
                caption: caption,
                footer: '',
                Buttons: [
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: 'Kunjungi Profil',
                            url: `https://www.tiktok.com/@${u.uniqueId}`
                        })
                    }
                ],
                headerType: 6
            }, { quoted: m })
        } catch (err) {
            console.error(err)
            m.reply(`⚠️ Error: Username tidak ditemukan atau API sedang down.`)
        }
    }
}