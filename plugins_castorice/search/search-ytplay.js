const yts = require("yt-search");
const axios = require("axios");

/**
 * Format views biar enak dibaca
 */
function formatViews(n) {
    if (!n) return "0";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return n.toString();
}

/**
 * Fungsi download audio via API Nexray
 */
async function getAudio(url) {
    try {
        const { data } = await axios.get(`https://api.nexray.eu.cc/downloader/v1/ytmp3?url=${encodeURIComponent(url)}`);
        if (data?.result?.url) {
            return { 
                download: data.result.url, 
                title: data.result.title 
            };
        }
        throw new Error("Result URL not found");
    } catch (err) {
        throw new Error("Gagal mendapatkan audio URL");
    }
}

module.exports = {
    name: "play",
    command: ["play", "playaudio"],
    category: "search",
    run: async (castorice, m, { text }) => {
        if (!text) return m.reply(`Contoh: .play komang`);

        m.react("🕐");

        try {
            const search = await yts(text);
            if (!search.videos.length) throw "Video tidak ditemukan";

            const video = search.videos[0];
            let info = `🎵 *PLAYING*\n\n`;
            info += `📌 *Judul:* ${video.title}\n`;
            info += `👤 Channel: ${video.author.name}\n`;
            info += `⏱️ Durasi: ${video.duration.timestamp}\n`;
            info += `👀 Views: ${formatViews(video.views)}\n`;
            info += `📅 Upload: ${video.ago}\n\n`;
            info += `_⏳ Mohon tunggu..._`;

            // Kirim preview thumbnail & info dulu
            await castorice.sendMessage(m.chat, {
                image: { url: video.thumbnail },
                caption: info
            }, { quoted: m });

            // Proses ambil audio
            const audio = await getAudio(video.url);

            // Kirim Audio
            await castorice.sendMessage(m.chat, {
                audio: { url: audio.download },
                mimetype: "audio/mpeg",
                fileName: `${audio.title}.mp3`
            }, { quoted: m });

            m.react("✅");

        } catch (err) {
            console.error(err);
            m.react("😭");
            m.reply(`Gagal memutar lagu. API limit atau server down.`);
        }
    }
};