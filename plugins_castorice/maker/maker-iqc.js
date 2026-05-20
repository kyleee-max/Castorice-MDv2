const axios = require('axios');

module.exports = {
    name: 'iPhone Quoted Chat',
    command: ['iqc', 'iphonequote', 'qcapple'],
    category: 'maker',
    run: async (castorice, m, { text, prefix, command }) => {
        // Validasi input
        if (!text) return m.reply(`Teksnya mana?\nContoh: ${prefix + command} Hai ganteng, lagi apa?`)
        if (text.length > 500) return m.reply('Teks kepanjangan, maksimal 500 karakter.')

        m.reply('Wait..')

        try {
            // Encode teks biar aman di URL
            const encodedText = encodeURIComponent(text);

            // BAGIAN HARDCODE (Sesuai contoh API)
            const jam = '11:20';
            const carrier = 'INDOSAT';
            const battery = '89';

            // Susun URL API
            const apiUrl = `https://brat.siputzx.my.id/iphone-quoted?time=${jam}&messageText=${encodedText}&carrierName=${encodeURIComponent(carrier)}&batteryPercentage=${battery}&emojiStyle=apple`;

            // Tarik data sebagai ArrayBuffer karena respons API langsung gambar
            const response = await axios.get(apiUrl, { 
                responseType: 'arraybuffer'
            });

            // Convert buffer ke tipe yang dimengerti sendMessage
            const imageBuffer = Buffer.from(response.data, 'binary');

            // Kirim hasilnya sebagai gambar
            await castorice.sendMessage(m.chat, { 
                image: imageBuffer, 
                caption: `Done` 
            }, { quoted: m });

        } catch (err) {
            console.error('Error IQC Maker:', err);
            m.reply(`⚠️ Error: Gagal membuat gambar. API mungkin sedang down.`);
        }
    }
}