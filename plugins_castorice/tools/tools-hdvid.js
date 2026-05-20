const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const API_URL = "https://fgsi.dpdns.org/api/tools/enchantVideo";
const DEFAULT_API_KEY = "fgsiapi-20c1605c-6d";
const PENDING_STATUSES = new Set(["pending", "processing", "queued", "running"]);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function videoenhancer(video, options = {}) {
    const { 
        apiKey = DEFAULT_API_KEY, 
        pollIntervalMs = 3000, 
        timeoutMs = 10 * 60 * 1000 
    } = options;

    if (!video) throw new Error("video is required");

    const safeName = `hdvid-${crypto.randomBytes(8).toString("hex")}.mp4`;
    const filePath = path.join(os.tmpdir(), safeName);
    
    // Write buffer ke file sementara
    await fs.promises.writeFile(filePath, video);

    try {
        // 1. Create Task
        const form = new FormData();
        form.append("file", fs.createReadStream(filePath), safeName);

        const response = await axios.post(API_URL, form, {
            headers: {
                ...form.getHeaders(),
                apikey: apiKey,
            },
            maxBodyLength: Infinity,
            timeout: 120000,
        });

        const payload = response.data;
        if (!payload?.status || !payload?.data?.pollUrl) {
            throw new Error(payload?.message || "Gagal membuat task");
        }

        const pollUrl = payload.data.pollUrl;

        // 2. Polling Task
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeoutMs) {
            const pollRes = await axios.get(pollUrl, { headers: { apikey: apiKey } });
            const resData = pollRes.data;
            const status = String(resData?.data?.status || "").toLowerCase();

            if (status === "success") {
                return resData.data.result.res_url;
            }

            if (["failed", "error", "cancelled"].includes(status)) {
                throw new Error(resData.message || "Task failed");
            }

            if (!resData.status && !PENDING_STATUSES.has(status)) {
                throw new Error("Polling failed");
            }

            await delay(pollIntervalMs);
        }
        throw new Error("Timeout");

    } finally {
        if (fs.existsSync(filePath)) await fs.promises.unlink(filePath).catch(() => {});
    }
}

module.exports = {
    name: 'Video HD',
    command: ['vhd', 'hdvid'],
    category: 'tools',
    run: async (castorice, m) => {
        const q = m.quoted ? m.quoted : m;
        if (!/video/.test(q.mtype || q.msg?.mimetype)) return m.reply('Balas videonya.');

        m.reply('Processing...');

        try {
            const buffer = await q.download();
            const resultUrl = await videoenhancer(buffer);

            await castorice.sendMessage(m.chat, {
                video: { url: resultUrl },
                caption: 'Done.'
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            m.reply('Gagal.');
        }
    }
};