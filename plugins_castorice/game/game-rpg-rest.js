/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/
const { getChar, saveChar, CLASSES } = require('../../lib/rpg-helper');
const { getPlayer, savePlayer, MAX_STAMINA } = require('../../lib/mining-helper');

const REST_COOLDOWN = 30 * 60 * 1000; // 30 menit
const HP_RESTORE_PCT = 0.4;            // 40% HP
const STAMINA_RESTORE = 20;            // +20 stamina

function generateBar(current, max, length = 10) {
    const filled = Math.round((Math.min(current, max) / max) * length);
    return `[${'█'.repeat(Math.max(0, filled))}${'░'.repeat(Math.max(0, length - filled))}] ${Math.round((Math.min(current, max) / max) * 100)}%`;
}

function formatDuration(ms) {
    const totalSec = Math.ceil(ms / 1000);
    const menit = Math.floor(totalSec / 60);
    const detik = totalSec % 60;
    if (menit <= 0) return `${detik} detik`;
    return `${menit} menit ${detik > 0 ? `${detik} detik` : ''}`.trim();
}

module.exports = {
    name: "RPG Rest",
    command: ["rpgrest", "rpg-rest", "rpgistirahat"],
    category: "game",
    run: async (castorice, m, { prefix }) => {
        const userId = m.sender;

        const char = getChar(userId);
        if (!char) return m.reply(`❌ Kamu belum punya karakter RPG!\n${prefix}rpg start`);
        if (char.inDungeon) return m.reply(`⚠️ Tidak bisa istirahat saat sedang dalam pertarungan!\nSelesaikan dulu: ${prefix}rpg attack | flee`);

        const cls = CLASSES[char.class];
        const player = getPlayer(userId);
        const now = Date.now();

        // ── Cek cooldown ──
        const lastRest = char.lastRest || 0;
        const elapsed = now - lastRest;

        if (elapsed < REST_COOLDOWN) {
            const sisaMs = REST_COOLDOWN - elapsed;
            const hpBar = generateBar(char.hp, char.maxHp);
            const staminaBar = generateBar(player.stamina, MAX_STAMINA);

            return m.reply(
`😴 *Kamu masih lelah...*

${cls.emoji} *${cls.name}*
❤️ HP: ${char.hp}/${char.maxHp}
${hpBar}
⚡ Stamina: ${player.stamina}/${MAX_STAMINA}
${staminaBar}

⏰ Bisa istirahat lagi dalam: *${formatDuration(sisaMs)}*

_Tip: Heal HP pakai ${prefix}rpgheal_`
            );
        }

        // ── Sudah bisa istirahat ──
        const hpBefore = char.hp;
        const staminaBefore = player.stamina;

        const hpRestore = Math.floor(char.maxHp * HP_RESTORE_PCT);
        const actualHpRestore = Math.min(hpRestore, char.maxHp - char.hp);
        const actualStaminaRestore = Math.min(STAMINA_RESTORE, MAX_STAMINA - player.stamina);

        char.hp = Math.min(char.hp + hpRestore, char.maxHp);
        char.lastRest = now;
        saveChar(userId, char);

        player.stamina = Math.min(player.stamina + STAMINA_RESTORE, MAX_STAMINA);
        savePlayer(userId, player);

        const hpBar = generateBar(char.hp, char.maxHp);
        const staminaBar = generateBar(player.stamina, MAX_STAMINA);

        const hpFull = char.hp >= char.maxHp;
        const stamFull = player.stamina >= MAX_STAMINA;

        return m.reply(
`😴 *Istirahat Sejenak...*
_Kamu beristirahat dan memulihkan tenaga._

${cls.emoji} *${cls.name}*

❤️ HP: ${hpBefore} → *${char.hp}/${char.maxHp}* ${actualHpRestore > 0 ? `_(+${actualHpRestore})_` : '_(sudah penuh)_'}
${hpBar}

⚡ Stamina: ${staminaBefore} → *${player.stamina}/${MAX_STAMINA}* ${actualStaminaRestore > 0 ? `_(+${actualStaminaRestore})_` : '_(sudah penuh)_'}
${staminaBar}

${hpFull && stamFull ? '✨ HP & Stamina sudah penuh!' : hpFull ? '✅ HP sudah penuh!' : stamFull ? '✅ Stamina sudah penuh!' : ''}
⏰ Istirahat berikutnya: *30 menit lagi*

_Lanjut petualangan? ${prefix}rpg dungeon | ${prefix}rpg gali_`
        );
    }
};