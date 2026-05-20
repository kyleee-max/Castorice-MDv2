const axios = require('axios');

module.exports = {
    name: 'YouTube Stalk',
    command: ['ytstalk', 'ytstalker', 'channelstalk'],
    category: 'stalker',
    run: async (castorice, m, { text, prefix, command }) => {
        if (!text) return m.reply(`Mana usernamenya?\nContoh: ${prefix + command} kael`)

        const username = text.replace('@', ''); // Bersihin @ kalo ada
        m.reply('Wait...')

        try {
            const response = await axios.get(`https://api.siputzx.my.id/api/stalk/youtube?username=${username}`)
            
            if (!response.data.status) return m.reply(`❌ Gagal mengambil data: Channel tidak ditemukan.`)

            const { channel: ch } = response.data.data

            const caption = `
୧✿ 𝗡𝗮𝗺𝗮: ${ch.name || ch.username}
୧✿ 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲: ${ch.username}
୧✿ 𝗗𝗲𝘀𝗰: ${ch.description || '-'}\n
୧✿ 𝗦𝘂𝗯𝘀𝗰𝗿𝗶𝗯𝗲𝗿𝘀: ${ch.subscriberCount || '0'}
୧✿ 𝗧𝗼𝘁𝗮𝗹 𝗩𝗶𝗱𝗲𝗼: ${ch.videoCount || '0'}\n
୧✿ 𝗟𝗶𝗻𝗸 𝗖𝗵𝗮𝗻𝗻𝗲𝗹: 
${ch.channelUrl}
`.trim()

            await castorice.sendMessage(m.chat, {
                product: {
                    productImage: { url: ch.avatarUrl },
                    productId: ch.username,
                    title: ` 「 YT DATA 」`,
                    description: caption,
                    currencyCode: null,
                    priceAmount1000: null,
                    retailerId: 'ZyncDev',
                    url: ch.channelUrl,
                    productImageCount: 1
                },
                businessOwnerJid: m.sender,
                caption: caption,
                footer: '',
                buttons: [
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: 'Buka YouTube',
                            url: ch.channelUrl
                        })
                    }
                ],
                headerType: 6
            }, { quoted: m })

        } catch (err) {
            console.error(err)
            m.reply(`⚠️ Error: Terjadi kesalahan saat menghubungi API.`)
        }
    }
}