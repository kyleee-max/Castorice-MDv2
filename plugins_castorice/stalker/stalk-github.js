const axios = require('axios');

module.exports = {
    name: 'Github Stalk',
    command: ['ghstalk', 'githubstalk', 'gh'],
    category: 'stalker',
    run: async (castorice, m, { text, prefix, command }) => {
        if (!text) return m.reply(`Mana usernamenya?\nContoh: ${prefix + command} octocat`)

        const user = text.replace('@', '');
        m.reply('Wait...')

        try {
            const response = await axios.get(`https://api.siputzx.my.id/api/stalk/github?user=${user}`)
            
            if (!response.data.status) return m.reply(`❌ Gagal mengambil data: User tidak ditemukan.`)

            const gh = response.data.data

            // Format angka
            const fx = n => Intl.NumberFormat('id-ID').format(n || 0)

            // Format Tanggal (Join)
            const formatDate = (dateStr) => {
                const date = new Date(dateStr)
                return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
            }

            const caption = `
୧✿ 𝗡𝗮𝗺𝗮: ${gh.nickname || gh.username}
୧✿ 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲: ${gh.username}
୧✿ 𝗕𝗶𝗼: ${gh.bio || '-'}\n
୧✿ 𝗣𝗲𝗻𝗴𝗶𝗸𝘂𝘁: ${fx(gh.followers)}
୧✿ 𝗠𝗲𝗻𝗴𝗶𝗸𝘂𝘁𝗶: ${fx(gh.following)}
୧✿ 𝗥𝗲𝗽𝗼 𝗣𝘂𝗯𝗹𝗶𝗸: ${fx(gh.public_repo)}\n
୧✿ 𝗟𝗼𝗸𝗮𝘀𝗶: ${gh.location || '-'}
୧✿ 𝗕𝗹𝗼𝗴/𝗪𝗲𝗯: ${gh.blog || '-'}
୧✿ 𝗔𝗱𝗺𝗶𝗻: ${gh.admin ? '✅ Ya' : '❌ Tidak'}
୧✿ 𝗧𝗶𝗽𝗲: ${gh.type}\n
୧✿ 𝗗𝗶𝗯𝘂𝗮𝘁: ${formatDate(gh.created_at)}
୧✿ 𝗨𝗽𝗱𝗮𝘁𝗲: ${formatDate(gh.updated_at)}
`.trim()

            await castorice.sendMessage(m.chat, {
                product: {
                    productImage: { url: gh.profile_pic },
                    productId: gh.id.toString(),
                    title: ` 「 GITHUB DATA 」`,
                    description: caption,
                    currencyCode: null,
                    priceAmount1000: null,
                    retailerId: 'ZyncDev',
                    url: gh.url,
                    productImageCount: 1
                },
                businessOwnerJid: m.sender,
                caption: caption,
                footer: '',
                buttons: [
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: 'Buka Profil',
                            url: gh.url
                        })
                    }
                ],
                headerType: 6
            }, { quoted: m })

        } catch (err) {
            console.error(err)
            m.reply(`⚠️ Error: Terjadi kesalahan saat mengambil data Github.`)
        }
    }
}