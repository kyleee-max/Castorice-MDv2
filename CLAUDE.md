# Castorice MD — Project Context

## Identitas Bot
- **Nama Bot:** Castorice MD (sebelumnya Castorice MD)
- **Owner:** Kaelsenpai
- **Credit header wajib:**
```js
/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/
```

---

## Struktur Folder
```
bot_root/
├── castorice-handler.js       # Handler utama
├── settings.js              # Config global (prefix, owner, apiKey, dll)
├── lib/
│   ├── stats-helper.js      # Database game (getUser, recordGame, claimDaily, dll)
│   ├── rpg-helper.js        # Database RPG (getChar, saveChar, CLASSES, dll)
│   ├── mining-helper.js     # Database mining (getPlayer, savePlayer, MAX_STAMINA, getGuildRank)
│   └── plugin-scanner.js    # Scanner plugin otomatis
└── plugins_castorice/
    ├── ai/         (2 file)
    ├── converter/  (2 file)
    ├── download/   (5 file)
    ├── game/       (20 file)
    ├── group/      (11 file)
    ├── main/       (2 file)
    ├── maker/      (1 file)
    ├── owner/      (14 file)
    ├── primbon/    (1 file)
    ├── search/     (1 file)
    ├── stalker/    (3 file)
    ├── sticker/    (7 file)
    └── tools/      (7 file)
```

---

## Format Plugin
```js
module.exports = {
    name: "Nama Fitur",
    command: ["cmd1", "cmd2"],
    category: "game", // ai | converter | download | game | group | info | main | maker | owner | primbon | search | stalker | sticker | tools
    run: async (nana, m, { prefix, command, args, text, isOwner, runtime }) => {
        // logic
    }
};
```

### Parameter `run`:
- `nana` — instance Baileys (sendMessage, dll)
- `m` — pesan masuk (m.chat, m.sender, m.reply(), m.mentionedJid, m.quoted, m.key, m.isGroup, dll)
- `prefix` — prefix bot (misal `.`)
- `command` — command yang dipanggil
- `args` — array argumen setelah command
- `text` — args.join(' ')
- `isOwner` — boolean apakah pengirim adalah owner
- `isAdmins` — boolean apakah pengirim admin grup
- `isBotAdmins` — boolean apakah bot admin grup
- `runtime` — fungsi format uptime

---

## Database Game — `lib/stats-helper.js`
Fungsi yang tersedia:
```js
getUser(userId)         // → { koin, xp, level, rank, streak, stats: { win, loss, draw, totalGame } }
recordGame(userId, result, koinReward, xpReward)  // result: 'win' | 'loss' | 'draw'  → { levelUp, newLevel }
claimDaily(userId)      // → { success, reward, bonusStreak, streak, sisaJam, sisaMenit }
addKoin(userId, amount)
deductKoin(userId, amount)
xpToNextLevel(level)
getLeaderboard(type, limit) // type: 'koin' | 'win' | 'xp'
```

## Database RPG — `lib/rpg-helper.js`
```js
getChar(userId)         // → { class, hp, maxHp, atk, def, int, agi, crit, floor, inDungeon, inventory, equipment, buffs, lastRest, ... }
saveChar(userId, char)
CLASSES                 // object semua kelas RPG beserta base stats & emoji
```

## Database Mining — `lib/mining-helper.js`
```js
getPlayer(userId)       // → { stamina, guildPoint, ... }
savePlayer(userId, data)
getGuildRank(guildPoint) // → { label, ... }
MAX_STAMINA             // konstanta max stamina
```

---

## Aturan Plugin Game
- Semua fitur game **wajib** pakai `recordGame()` dari `stats-helper`
- Sesi game disimpan di object `sessions` per `chatId`
- Timeout sesi: **60 detik** (default)
- Reward standar:
  | Game | WIN_KOIN | XP_WIN | XP_LOSS |
  |------|----------|--------|---------|
  | Ringan (tebak teks) | 60–75 | 20 | 5 |
  | Sedang (gambar) | 75–100 | 25–30 | 5 |
  | Berat (pengetahuan) | 90–100 | 30 | 5 |

---

## NativeFlow Button
Beberapa plugin sudah pakai NativeFlow button dari Baileys:
```js
const { generateWAMessageFromContent } = require('@whiskeysocket/baileys');
```
- Gunakan `quick_reply` untuk aksi langsung (tombol biasa)
- Gunakan `single_select` untuk menu pilihan (dropdown)
- Pakai kalau ada menu/pilihan yang cocok, tidak wajib di semua plugin

---

## Progress File & Target
- **Total file:** 77 file (termasuk owner & main)
- **File publik di menu:** ~60 file
- **Target:** 100 file total
- **Sisa yang perlu dibuat:** ~23 file lagi

### Semua file yang sudah ada:
```
converter/convert-tomp3.js
converter/converter-toimg.js
download/capcut-dl.js
download/ig-dl.js
download/tiktok-dl.js
download/ytmp3-dl.js
download/ytmp4-dl.js
game/game-asahotak.js
game/game-balance.js
game/game-daily.js
game/game-lengkapikalimat.js
game/game-profile.js
game/game-rpg.js
game/game-siapakahaku.js
game/game-suit.js
game/game-susunkata.js
game/game-tebak.js
game/game-tebakgambar.js
game/game-tebakgame.js
game/game-tebakkartun.js
game/game-tebakkata.js
game/game-tebaklogo.js
game/game-tekateki.js
game/game-transfer.js
game/gane-leaderboard.js
game/rpg-duel.js
game/rpg-equip.js
game/rpg-heal.js
game/rpg-rest.js
game/rpg-status.js
group/group-add.js
group/group-del.js
group/group-demote.js
group/group-hidetag.js
group/group-kick.js
group/group-link.js
group/group-open-close.js
group/group-promote.js
group/group-rvo.js
group/group-upsw.js
group/group_warn.js
main/main-menu.js
main/msin-category.js
maker/maker-iqc.js
owner/owner-addjson.js
owner/owner-addlib.js
owner/owner-addplugin.js
owner/owner-deljson.js
owner/owner-dellib.js
owner/owner-delplugin.js
owner/owner-delsessi.js
owner/owner-depen.js
owner/owner-eval.js
owner/owner-getlib.js
owner/owner-getplugin.js
owner/owner-sewa.js
owner/owner_backup.js
primbon/primbon-artinama.js
search/search-ytplay.js
stalker/stalk-github.js
stalker/stalk-tiktok.js
stalker/stalk-youtube.js
sticker/sticker-brat.js
sticker/sticker-emoji.js
sticker/sticker-emojimix.js
sticker/sticker-meme.js
sticker/sticker-vid.js
sticker/sticker-wm.js
sticker/sticker.js
tools/sharpify.js
tools/tools-cekid.js
tools/tools-hdvid.js
tools/tools-ssweb.js
tools/tools_hd.js
tools/tools_removebg.js
tools/tourl-github.js
```

---

## Saran File Berikutnya (belum dibuat)
Prioritas untuk ngejar 100 file:
- **download:** facebook-dl, pinterest-dl, twitter-dl, spotify-dl
- **tools:** tools-qr, tools-translate, tools-cuaca, tools-tts
- **search:** search-google, search-anime, search-npm
- **maker:** maker-wanted, maker-ship, maker-tiktokprofile
- **group:** group-antispam
- **game:** game-tebaktebakan (belum masuk)

---

## API yang Dipakai
- Base game API: `https://api.siputzx.my.id/api/games/<endpoint>`
- Base primbon/info: `https://api.siputzx.my.id/api/primbon/<endpoint>`
- Base download: `https://api.siputzx.my.id/api/d/<endpoint>`
- Screenshot web: `https://www.sankavolereii.my.id/tools/ssweb?apikey=planaai&url=`

---

## Catatan Penting
- Bahasa semua **Indonesia** — tidak ada romaji Jepang di response bot
- Cek dulu struktur API sebelum bikin plugin baru
- Tanya dulu fitur apa yang mau ditambah, jangan langsung gas bikin file
- Output tidak perlu di-zip, kirim file satu-satu atau per batch
- Penambahan file dilakukan **bertahap** sesuai arahan owner
- File owner & main **disembunyikan** dari menu (`HIDDEN_CATEGORIES`)
- Scanner pakai nama folder sebagai kategori, tapi `main-menu.js` baca dari `plugin.category` — pastikan keduanya konsisten
- `main-menu.js` sudah ada console log debug untuk detect plugin "other"
- Jangan buatin fitur kecil (fix 1 baris) via Claude, sayang limit — owner bisa fix sendiri