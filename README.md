<div align="center">

```txt
 ██████╗ █████╗ ███████╗████████╗ ██████╗ ██████╗ ██╗ ██████╗███████╗
██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗██║██╔════╝██╔════╝
██║     ███████║███████╗   ██║   ██║   ██║██████╔╝██║██║     █████╗
██║     ██╔══██║╚════██║   ██║   ██║   ██║██╔══██╗██║██║     ██╔══╝
╚██████╗██║  ██║███████║   ██║   ╚██████╔╝██║  ██║██║╚██████╗███████╗
 ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝ ╚═════╝╚══════╝
```

# Castorice MD — Free Version

WhatsApp Bot Multi-Feature berbasis Baileys

![Node](https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=node.js&logoColor=white)
![Baileys](https://img.shields.io/badge/Baileys-MultiDevice-25D366?style=flat-square&logo=whatsapp&logoColor=white)
![Version](https://img.shields.io/badge/Version-Free-blue?style=flat-square)
![License](https://img.shields.io/badge/License-Custom-green?style=flat-square)
![Author](https://img.shields.io/badge/Author-KaelSenpai-purple?style=flat-square)
![Naileys Banner]([https://files.catbox.moe/4flt15.jpg](https://raw.githubusercontent.com/kyleee-max/mutsumi-file/main/uploads/1779033636326.jpeg))
</div>

---

## 📌 Tentang

Castorice MD adalah WhatsApp Bot multi-fitur berbasis Baileys dengan sistem plugin modular yang mudah dikembangkan dan dimodifikasi.

Versi ini merupakan **FREE VERSION** yang dapat digunakan, dimodifikasi, dan dibagikan ulang secara gratis sesuai ketentuan Lisensi.

> © 2025–2026 KaelSenpai — Credit wajib dipertahankan.

---

# ✨ Fitur

## 📥 Downloader
- YouTube MP3 / MP4
- TikTok Downloader
- Instagram Downloader
- Media Downloader lainnya

## 🛠️ Tools
- Remove Background
- HD Image
- HD Video
- Sharpify

## 🎨 Sticker & Maker
- Sticker Maker
- Emoji Sticker
- Emoji Mix
- Meme Sticker
- Brat Generator
- IQ Card

## 🎮 Game & RPG
- Profil RPG
- Daily Reward
- Battle RPG
- Transfer Coin
- Leaderboard

## 🔍 Search & Stalker
- GitHub Stalker
- TikTok Stalker
- YouTube Search
- YouTube Channel Info

## 🔄 Converter
- Video to MP3
- Sticker to Image
- Media Converter

## 👥 Group
- Add / Kick Member
- Promote / Demote
- Open / Close Group
- Hidetag
- Warning System
- Anti View Once

---

# ⚙️ Instalasi

## Prasyarat
- Node.js 20+
- npm
- ffmpeg

---

## Install

```bash
git clone https://github.com/kyleee-max/Castorice-MDv2.git
cd Castorice-MD
npm install
```

---

## Konfigurasi

Edit file `settings.js`

```js
global.owner = "Nama Owner"
global.bot = "Castorice MD"
global.nomorown = "628xxxxxxxxxx"
global.nomorbot = "628xxxxxxxxxx"
```

---

## Menjalankan Bot

```bash
npm start
```

Setelah dijalankan:
1. Masukkan nomor WhatsApp bot
2. Pairing code akan muncul
3. Buka WhatsApp
4. Perangkat Tertaut
5. Tautkan perangkat dengan nomor telepon
6. Masukkan pairing code

---

# 📁 Struktur Folder

```txt
Castorice-MD/
├── index.js
├── handler.js
├── settings.js
├── plugins/
│   ├── download/
│   ├── tools/
│   ├── group/
│   ├── game/
│   ├── maker/
│   ├── owner/
│   ├── search/
│   ├── sticker/
│   └── converter/
├── lib/
├── database/
└── session/
```

---

# 🔌 Sistem Plugin

Contoh struktur plugin:

```js
module.exports = {
  name: "plugin-name",
  command: ["cmd"],
  category: "tools",

  async run(client, m, { text }) {

  }
}
```

Plugin akan otomatis dimuat saat bot dijalankan.

---

# 📜 Lisensi

Project ini menggunakan **Custom Free License**.

### Diizinkan
- Menggunakan
- Memodifikasi
- Mengembangkan
- Membagikan ulang secara gratis
- Membuka jasa sewa bot

### Dilarang
- Menjual script
- Menghapus credit
- Mengganti copyright
- Mengklaim script sebagai milik pribadi

Baca file `LICENSE` untuk ketentuan lengkap.

---

# ⚠️ Disclaimer

Segala bentuk modifikasi, penambahan plugin, atau perubahan sistem sepenuhnya menjadi tanggung jawab pengguna.

Author tidak bertanggung jawab atas:
- Bug akibat modifikasi
- Kerusakan sistem
- Penyalahgunaan fitur
- Spam / flood / ddos
- Aktivitas ilegal pengguna

---

<div align="center">

Castorice MD Free Version  
© 2025–2026 KaelSenpai

</div>
