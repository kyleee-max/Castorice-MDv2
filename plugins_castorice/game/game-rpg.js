/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const { generateWAMessageFromContent } = require('@whiskeysocket/baileys');
const {
    CLASSES, CLASS_CHANGE_COST,
    getChar, saveChar, createChar,
    getDungeonRank, getRandomMonster,
    processTurn
} = require('../../lib/rpg-helper');
const { getUser, addKoin, addXP, deductKoin } = require('../../lib/stats-helper');
const {
    getPlayer, savePlayer, getStamina, getGuildRank, getNextGuildRank,
    doMine, sellOres, craftItem, checkQuestComplete,
    MAX_STAMINA, MINING_STAMINA_COST, ORES, QUESTS
} = require('../../lib/mining-helper');
const ITEMS = require('../../database/items.json');

const MAX_KOIN_OWNER = 10000;
const MAX_XP_OWNER = 500;

function resolveTarget(m, args, argIndex = 1) {
    if (m.mentionedJid?.[0]) return m.mentionedJid[0];
    if (m.quoted?.sender) return m.quoted.sender;
    const num = args[argIndex];
    if (num && /^\d+$/.test(num)) return num.replace(/^0/, '62') + '@s.whatsapp.net';
    return null;
}

module.exports = {
    name: "RPG — Dunia Lain",
    command: ["rpg"],
    category: "game",
    run: async (castorice, m, { prefix, args, isOwner }) => {
        const sub = args[0]?.toLowerCase();
        const userId = m.sender;

        // ─── MENU ───
        if (!sub || sub === 'menu' || sub === 'help') {
            const char = getChar(userId);
            const cls = char ? CLASSES[char.class] : null;
            const clsInfo = char
                ? `${cls.emoji} ${cls.name} • Floor ${char.floor || 1} • HP ${char.hp}/${char.maxHp}`
                : '❌ Belum punya karakter';

            let player = getPlayer(userId);
            player = getStamina(player);
            const rankData = getGuildRank(player.guildPoint);

            const sections = [
                {
                    title: "🧭 Umum",
                    rows: [
                        { title: "⚔️ Mulai / Buat Karakter", description: "Buat karakter RPG baru", id: `${prefix}rpg start` },
                        { title: "👤 Profile", description: "Lihat stats karaktermu", id: `${prefix}rpg profile` },
                        { title: "🎒 Inventory", description: "Lihat semua item & ore", id: `${prefix}rpg inv` }
                    ]
                },
                {
                    title: "⚔️ Battle",
                    rows: [
                        { title: "🏰 Dungeon", description: "Masuk dungeon & lawan monster", id: `${prefix}rpg dungeon` },
                        { title: "⚔️ Attack", description: "Serang monster", id: `${prefix}rpg attack` },
                        { title: "✨ Skill", description: "Pakai skill kelas", id: `${prefix}rpg skill` },
                        { title: "💊 Pakai Item", description: "Pakai item saat battle", id: `${prefix}rpg item` },
                        { title: "💨 Flee", description: "Kabur dari pertarungan", id: `${prefix}rpg flee` }
                    ]
                },
                {
                    title: "⛏️ Mining",
                    rows: [
                        { title: "⛏️ Gali Ore", description: `Stamina: ${player.stamina}/${MAX_STAMINA} • Area: ${ORES.areas[rankData.area]?.name}`, id: `${prefix}rpg gali` },
                        { title: "💰 Jual Ore", description: "Jual ore ke guild", id: `${prefix}rpg jual` },
                        { title: "🔨 Craft Item", description: "Buat equipment dari ore", id: `${prefix}rpg craft` }
                    ]
                },
                {
                    title: "🏛️ Guild",
                    rows: [
                        { title: "🏛️ Guild Profile", description: `${rankData.label} • ${player.guildPoint} GP`, id: `${prefix}rpg guild` },
                        { title: "📜 Quest Aktif", description: "Lihat progress story quest", id: `${prefix}rpg quest` }
                    ]
                },
                {
                    title: "🏪 Lainnya",
                    rows: [
                        { title: "🏪 Shop", description: "Beli potion & equipment", id: `${prefix}rpg shop` },
                        { title: "🔄 Ganti Kelas", description: `Ganti kelas (${CLASS_CHANGE_COST} koin)`, id: `${prefix}rpg ganti` }
                    ]
                }
            ];

            if (isOwner) {
                sections.push({
                    title: "👑 Owner",
                    rows: [
                        { title: "💰 Add Koin", description: `Max ${MAX_KOIN_OWNER.toLocaleString('id-ID')}/sekali`, id: `${prefix}rpg addkoin` },
                        { title: "✨ Add XP", description: `Max ${MAX_XP_OWNER}/sekali`, id: `${prefix}rpg addxp` }
                    ]
                });
            }

            const buttons = [{ name: "single_select", buttonParamsJson: JSON.stringify({ title: "📋 Pilih Menu RPG", sections }) }];

            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: { message: { interactiveMessage: {
                    body: { text: `⚔️ *RPG — Dunia Lain*\n_Selamat datang, Petualang!_\n\n👤 *Karakter:* ${clsInfo}\n🏛️ *Guild:* ${rankData.label} • ${player.guildPoint} GP\n⚡ *Stamina:* ${player.stamina}/${MAX_STAMINA}\n\n🗺️ Pilih menu di bawah~` },
                    footer: { text: `` },
                    nativeFlowMessage: { buttons }
                }}}
            }, { quoted: m });

            return await castorice.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
        }

        // ─── START ───
        if (sub === 'start') {
            if (getChar(userId)) return m.reply(`⚠️ Kamu sudah punya karakter!\n${prefix}rpg profile`);

            const classList = Object.entries(CLASSES).map(([id, cls], i) =>
                `${i + 1}. ${cls.emoji} *${cls.name}*\n   ${cls.desc}`
            ).join('\n\n');

            const buttons = Object.entries(CLASSES).map(([id, cls]) => ({
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({ display_text: `${cls.emoji} ${cls.name}`, id: `${prefix}rpg pilih ${id}` })
            }));

            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: { message: { interactiveMessage: {
                    body: { text: `⚔️ *Selamat Datang — Petualang!*\n\nKamu telah dipanggil ke dunia lain...\n\n\nPilih kelasmu!\n\n${classList}` },
                    footer: { text: `` },
                    nativeFlowMessage: { buttons }
                }}}
            }, { quoted: m });

            return await castorice.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
        }

        // ─── PILIH KELAS ───
        if (sub === 'pilih') {
            const className = args[1]?.toLowerCase();
            if (!CLASSES[className]) return m.reply(`❌ Kelas tidak valid!\nKelas: ${Object.keys(CLASSES).join(', ')}`);
            if (getChar(userId)) return m.reply(`⚠️ Kamu sudah punya karakter!`);

            const char = createChar(userId, className);
            saveChar(userId, char);
            const cls = CLASSES[className];

            return m.reply(
`✅ *Karakter Berhasil Dibuat!*

${cls.emoji} *${cls.name}*
❤️ HP: ${char.maxHp} | ⚔️ ATK: ${char.atk}
🛡️ DEF: ${char.def} | ✨ INT: ${char.int}
💨 AGI: ${char.agi} | 🎯 CRIT: ${char.crit}%

Gunakan ${prefix}rpg dungeon untuk battle!
Gunakan ${prefix}rpg gali untuk mining!`
            );
        }

        // ─── OWNER: ADD KOIN ───
        if (sub === 'addkoin') {
            if (!isOwner) return m.reply(global.mess.owner);
            const target = resolveTarget(m, args, 1) || userId;
            const amount = parseInt(m.mentionedJid?.[0] ? args[1] : m.quoted ? args[1] : args[2] || args[1]);
            if (!amount || isNaN(amount) || amount <= 0)
                return m.reply(`❌ Format salah!\n• Tag: ${prefix}rpg addkoin @tag <jumlah>\n• Reply: reply → ${prefix}rpg addkoin <jumlah>\n• Nomor: ${prefix}rpg addkoin 628xxx <jumlah>\n\nMaks: ${MAX_KOIN_OWNER.toLocaleString('id-ID')} koin/sekali`);
            if (amount > MAX_KOIN_OWNER) return m.reply(`❌ Maks ${MAX_KOIN_OWNER.toLocaleString('id-ID')} koin/sekali!`);
            const newBal = addKoin(target, amount);
            return m.reply(`👑 *Add Koin*\n\n👤 @${target.split('@')[0]}\n💰 +${amount.toLocaleString('id-ID')} Koin\n💴 Saldo: ${newBal.toLocaleString('id-ID')} Koin`, { mentions: [target] });
        }

        // ─── OWNER: ADD XP ───
        if (sub === 'addxp') {
            if (!isOwner) return m.reply(global.mess.owner);
            const target = resolveTarget(m, args, 1) || userId;
            const amount = parseInt(m.mentionedJid?.[0] ? args[1] : m.quoted ? args[1] : args[2] || args[1]);
            if (!amount || isNaN(amount) || amount <= 0)
                return m.reply(`❌ Format salah!\n• Tag: ${prefix}rpg addxp @tag <jumlah>\n• Reply: reply → ${prefix}rpg addxp <jumlah>\n• Nomor: ${prefix}rpg addxp 628xxx <jumlah>\n\nMaks: ${MAX_XP_OWNER} XP/sekali`);
            if (amount > MAX_XP_OWNER) return m.reply(`❌ Maks ${MAX_XP_OWNER} XP/sekali!`);
            const { levelUp, newLevel } = addXP(target, amount);
            return m.reply(`👑 *Add XP*\n\n👤 @${target.split('@')[0]}\n✨ +${amount} XP\n${levelUp ? `🎉 *LEVEL UP! → Lv.${newLevel}*` : `📊 Level: ${newLevel}`}`, { mentions: [target] });
        }

        // Cek karakter untuk command selanjutnya
        const char = getChar(userId);
        if (!char && !['gali', 'guild', 'quest', 'jual', 'craft'].includes(sub)) {
            return m.reply(`❌ Kamu belum punya karakter!\n${prefix}rpg start`);
        }

        const cls = char ? CLASSES[char.class] : null;

        // ─── PROFILE ───
        if (sub === 'profile' || sub === 'profil') {
            const hpBar = generateBar(char.hp, char.maxHp);
            return m.reply(
`${cls.emoji} *RPG Profile — @${userId.split('@')[0]}*

🎭 Kelas: ${cls.name} | 🌍 Floor: ${char.floor || 1}
❤️ HP: ${char.hp}/${char.maxHp}
${hpBar}

⚔️ ATK: ${char.atk} | 🛡️ DEF: ${char.def}
✨ INT: ${char.int} | 💨 AGI: ${char.agi} | 🎯 CRIT: ${char.crit}%

🎒 Inventory: ${char.inventory?.length || 0} item`,
            { mentions: [userId] });
        }

        // ─── INVENTORY (GABUNGAN item + ore) ───
        if (sub === 'inv' || sub === 'inventory') {
            const player = getPlayer(userId);
            const items = char?.inventory || [];
            const ores = player.ores || {};

            let txt = `🎒 *Inventory — @${userId.split('@')[0]}*\n`;

            // Items
            if (items.length) {
                txt += `\n*🗡️ Items & Equipment:*\n`;
                txt += items.map((id, i) => {
                    const item = ITEMS.consumables[id] || ITEMS.drops[id]
                        || ITEMS.equipment?.weapons?.[id]
                        || ITEMS.equipment?.armor?.[id]
                        || ITEMS.equipment?.accessory?.[id];
                    return item ? `${i + 1}. ${item.emoji} ${item.name} (\`${id}\`)` : `${i + 1}. ❓ ${id}`;
                }).join('\n');
            } else {
                txt += `\n*🗡️ Items:* Kosong`;
            }

            // Ores
            const oreEntries = Object.entries(ores);
            if (oreEntries.length) {
                txt += `\n\n*⛏️ Ore:*\n`;
                txt += oreEntries.map(([id, qty]) => {
                    const ore = ORES.ores[id];
                    return ore ? `${ore.emoji} ${ore.name} x${qty}` : `❓ ${id} x${qty}`;
                }).join('\n');
            } else {
                txt += `\n\n*⛏️ Ore:* Kosong`;
            }

            txt += `\n\n_${prefix}rpg item <id> — Pakai item saat battle_`;
            txt += `\n_${prefix}rpg jual <ore> <qty> — Jual ore_`;

            return m.reply(txt, { mentions: [userId] });
        }

        // ─── DUNGEON ───
        if (sub === 'dungeon') {
            if (!char) return m.reply(`❌ Belum punya karakter!\n${prefix}rpg start`);
            if (char.inDungeon) return m.reply(`⚠️ Kamu sedang dalam pertarungan!\n${prefix}rpg attack | skill | item | flee`);

            const globalUser = getUser(userId);
            const rank = getDungeonRank(globalUser.level);
            const monster = getRandomMonster(rank);
            monster._maxHp = monster.hp;

            char.inDungeon = true;
            char.dungeonMonster = monster;
            saveChar(userId, char);

            const buttons = [
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "⚔️ Attack", id: `${prefix}rpg attack` }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "✨ Skill", id: `${prefix}rpg skill` }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "💊 Item", id: `${prefix}rpg item` }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "💨 Flee", id: `${prefix}rpg flee` }) }
            ];

            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: { message: { interactiveMessage: {
                    body: { text: `⚔️ *DUNGEON ENCOUNTER!*\n\n${monster.emoji} *${monster.name}* muncul!\n\n👾 Monster HP: ${monster.hp}\n❤️ Kamu HP: ${char.hp}/${char.maxHp}\n\nPilih aksimu!` },
                    footer: { text: `` },
                    nativeFlowMessage: { buttons }
                }}}
            }, { quoted: m });

            return await castorice.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
        }

        // ─── BATTLE ACTIONS ───
        if (['attack', 'skill', 'flee'].includes(sub)) {
            if (!char) return m.reply(`❌ Belum punya karakter!\n${prefix}rpg start`);
            if (!char.inDungeon) return m.reply(`❌ Tidak sedang di dungeon!\n${prefix}rpg dungeon`);
            const turnResult = processTurn(userId, sub);
            // Update quest kill progress
            if (turnResult.result === 'win' && turnResult.monster) {
                const { recordKill } = require('../../lib/mining-helper');
                recordKill(userId, turnResult.monster.id);
            }
            return sendBattleResult(castorice, m, prefix, turnResult);
        }

        if (sub === 'item') {
            if (!char) return m.reply(`❌ Belum punya karakter!\n${prefix}rpg start`);
            if (!char.inDungeon) return m.reply(`❌ Tidak sedang di dungeon!`);
            const itemId = args[1];
            if (!itemId) {
                const inv = char.inventory?.length
                    ? char.inventory.map(id => {
                        const it = ITEMS.consumables[id];
                        return it ? `${it.emoji} ${it.name} (\`${id}\`)` : null;
                    }).filter(Boolean).join('\n') || 'Tidak ada consumable'
                    : 'Kosong';
                return m.reply(`🎒 *Consumable Items:*\n${inv}\n\nCara: ${prefix}rpg item <id>`);
            }
            const turnResult = processTurn(userId, 'item', itemId);
            return sendBattleResult(castorice, m, prefix, turnResult);
        }

        // ─── MINING ───
        if (sub === 'gali' || sub === 'mine' || sub === 'dig') {
            const result = doMine(userId);

            if (!result.success && result.reason === 'stamina') {
                return m.reply(
`⚡ *Stamina Habis!*

Stamina: ${result.stamina}/${MAX_STAMINA}
Butuh: ${MINING_STAMINA_COST} stamina

⏰ Recharge berikutnya: ~${result.nextRecharge} menit
_Stamina recharge otomatis 15/jam_`
                );
            }

            const staminaBar = generateBar(result.stamina, MAX_STAMINA);
            if (!result.mined) {
                return m.reply(`⛏️ *Mining di ${result.area.emoji} ${result.area.name}*\n\n😔 Tidak menemukan ore...\n\n⚡ Stamina: ${result.stamina}/${MAX_STAMINA}\n${staminaBar}\n\nCoba lagi! ${prefix}rpg gali`);
            }

            const questResult = checkQuestComplete(userId);
            let questTxt = '';
            if (questResult.complete) {
                questTxt = `\n\n🎉 *QUEST COMPLETE!*\n📜 ${questResult.quest.title}\n💰 +${questResult.quest.reward.koin} Koin | ✨ +${questResult.quest.reward.xp} XP\n${questResult.rankUp ? `🏆 *GUILD RANK UP → ${questResult.newRank.label}!*` : ''}`;
            }

            return m.reply(
`⛏️ *Mining di ${result.area.emoji} ${result.area.name}*

✅ ${result.mined.emoji} *${result.mined.name}*
🏆 +${result.mined.guildPoint} Guild Point

⚡ Stamina: ${result.stamina}/${MAX_STAMINA}
${staminaBar}${questTxt}

Lanjut: ${prefix}rpg gali`
            );
        }

        // ─── JUAL ORE ───
        if (sub === 'jual' || sub === 'sell') {
            const oreId = args[1]?.toLowerCase();
            const amount = args[2] || '1';
            const player = getPlayer(userId);

            if (!oreId) {
                const ores = player.ores || {};
                if (!Object.keys(ores).length) return m.reply(`🎒 Ore inventory kosong!\nMining dulu: ${prefix}rpg gali`);
                const list = Object.entries(ores).map(([id, qty]) => {
                    const ore = ORES.ores[id];
                    return ore ? `${ore.emoji} *${ore.name}* x${qty} — ${ore.sellPrice} koin/pcs (ID: \`${id}\`)` : null;
                }).filter(Boolean).join('\n');
                return m.reply(`💰 *Jual Ore ke Guild*\n\n${list}\n\nCara: ${prefix}rpg jual <id> <jumlah/all>`);
            }

            const result = sellOres(userId, oreId, amount);
            if (!result.success) {
                if (result.reason === 'invalid_ore') return m.reply(`❌ Ore *${oreId}* tidak valid!`);
                if (result.reason === 'not_enough') return m.reply(`❌ Ore tidak cukup!`);
            }

            return m.reply(
`💰 *Ore Terjual ke Guild!*

${ORES.ores[oreId]?.emoji} *${ORES.ores[oreId]?.name}* x${result.qty}
💴 +${result.totalKoin} Koin
🏆 +${result.totalGP} Guild Point
${result.rankUp ? `\n🎉 *GUILD RANK UP → ${result.newRank.label}!*\n🗺️ Area mining baru terbuka!` : ''}`
            );
        }

        // ─── CRAFT ───
        if (sub === 'craft') {
            const recipeId = args[1]?.toLowerCase();
            if (!recipeId) {
                const list = Object.entries(ORES.craftRecipes).map(([id, r]) => {
                    const mats = Object.entries(r.materials).map(([oreId, qty]) =>
                        `${ORES.ores[oreId]?.emoji || ''} ${ORES.ores[oreId]?.name || oreId} x${qty}`
                    ).join(', ');
                    return `${r.emoji} *${r.name}*\n   🔨 ${mats}\n   ID: \`${id}\``;
                }).join('\n\n');
                return m.reply(`🔨 *Craft Recipes*\n\n${list}\n\nCara: ${prefix}rpg craft <id>`);
            }

            const result = craftItem(userId, recipeId);
            if (!result.success) {
                if (result.reason === 'invalid_recipe') return m.reply(`❌ Recipe tidak ditemukan!`);
                if (result.reason === 'missing_material') {
                    const ore = ORES.ores[result.missing];
                    return m.reply(`❌ Bahan kurang!\n${ore?.emoji} ${ore?.name}: punya ${result.have}, butuh ${result.need}`);
                }
            }

            return m.reply(`🔨 *Craft Berhasil!*\n\n${result.recipe.emoji} *${result.recipe.name}* berhasil dibuat!\n📦 Masuk ke inventory RPG`);
        }

        // ─── GUILD ───
        if (sub === 'guild') {
            let player = getPlayer(userId);
            player = getStamina(player);
            const rankData = getGuildRank(player.guildPoint);
            const nextRank = getNextGuildRank(player.guildPoint);
            const area = ORES.areas[rankData.area];
            const staminaBar = generateBar(player.stamina, MAX_STAMINA);
            const oreCount = Object.values(player.ores || {}).reduce((a, b) => a + b, 0);

            return m.reply(
`🏛️ *Guild Profile — @${userId.split('@')[0]}*
${player.title ? `\n🎖️ Gelar: ${player.title}\n` : ''}
${rankData.label}
🗺️ Area: ${area.emoji} ${area.name}

🏆 Guild Point: ${player.guildPoint}
${nextRank ? `📈 Menuju ${nextRank.label}: butuh ${nextRank.min - player.guildPoint} GP lagi` : '✨ Rank Tertinggi!'}

⚡ Stamina: ${player.stamina}/${MAX_STAMINA}
${staminaBar}

⛏️ Total Mining: ${player.totalMined} kali
🎒 Ore di Inventory: ${oreCount} pcs`,
            { mentions: [userId] });
        }

        // ─── QUEST ───
        if (sub === 'quest') {
            const player = getPlayer(userId);
            if (!player.currentQuest) return m.reply(`🎉 Semua quest selesai!\nKamu adalah *Pahlawan Dunia Lain*! 🌸`);

            const quest = QUESTS.quests[player.currentQuest];
            if (!quest) return m.reply(`❌ Quest tidak ditemukan.`);

            const prog = player.questProgress[player.currentQuest] || {};
            const objList = Object.entries(quest.objectives).map(([type, targets]) =>
                Object.entries(targets).map(([target, needed]) => {
                    const current = Math.min(prog[target] || 0, needed);
                    const bar = generateBar(current, needed, 8);
                    const typeLabel = type === 'mine' ? '⛏️' : type === 'kill' ? '⚔️' : '💀';
                    return `${typeLabel} *${target}*\n${bar} ${current}/${needed}`;
                }).join('\n')
            ).join('\n\n');

            return m.reply(
`📜 *Quest Aktif*

*${quest.title}*
_${quest.story}_

📋 *Objective:*
${objList}

🎁 *Reward:*
💰 ${quest.reward.koin} Koin | ✨ ${quest.reward.xp} XP
🏆 ${quest.reward.guildPoint} GP${quest.reward.rankUp ? ` | ⬆️ Rank Up ke ${quest.reward.rankUp}` : ''}${quest.reward.title ? `\n🎖️ Gelar: ${quest.reward.title}` : ''}`
            );
        }

        // ─── SHOP ───
        if (sub === 'shop') {
            const category = args[1]?.toLowerCase();
            if (!category) {
                const player = getPlayer(userId);
                const globalUser = getUser(userId);
                const buttons = [{ name: "single_select", buttonParamsJson: JSON.stringify({
                    title: "🏪 Pilih Kategori",
                    sections: [{ title: "🛒 Kategori Shop", rows: [
                        { title: "🧪 Consumables", description: "Potion & item sekali pakai", id: `${prefix}rpg shop consumables` },
                        { title: "⚔️ Weapons", description: "Senjata per kelas", id: `${prefix}rpg shop weapons` },
                        { title: "🛡️ Armor", description: "Pelindung", id: `${prefix}rpg shop armor` },
                        { title: "💍 Accessory", description: "Cincin & aksesoris", id: `${prefix}rpg shop accessory` }
                    ]}]
                })}];

                const msg = generateWAMessageFromContent(m.chat, {
                    viewOnceMessage: { message: { interactiveMessage: {
                        body: { text: `🏪 *Dunia Lain — Shop*\n\n💰 Koin: ${globalUser.koin.toLocaleString('id-ID')}\n\nPilih kategori item~\n\nCara beli: ${prefix}rpg buy <id>` },
                        footer: { text: `` },
                        nativeFlowMessage: { buttons }
                    }}}
                }, { quoted: m });

                return await castorice.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
            }

            const validCats = ['consumables', 'weapons', 'armor', 'accessory'];
            if (!validCats.includes(category)) return m.reply(`❌ Kategori tidak valid!`);

            const itemsInCat = category === 'consumables' ? ITEMS.consumables : ITEMS.equipment[category] || {};
            const globalUser = getUser(userId);

            const list = Object.entries(itemsInCat).map(([id, item]) => {
                const classReq = item.class ? ` [${item.class.join('/')}]` : '';
                const stats = [];
                if (item.heal) stats.push(`+${item.heal} HP`);
                if (item.atk) stats.push(`+${item.atk} ATK`);
                if (item.def) stats.push(`+${item.def} DEF`);
                if (item.int) stats.push(`+${item.int} INT`);
                if (item.crit) stats.push(`+${item.crit} CRIT`);
                return `${item.emoji} *${item.name}*${classReq} — 💰 ${item.price} koin${stats.length ? ` • ${stats.join(', ')}` : ''}\n   ID: \`${id}\``;
            }).join('\n\n');

            return m.reply(`🏪 *Shop — ${capitalize(category)}*\n\n${list}\n\n💰 Koin: ${globalUser.koin.toLocaleString('id-ID')}\n\nCara beli: ${prefix}rpg buy <id>`);
        }

        // ─── BUY ───
        if (sub === 'buy') {
            const itemId = args[1];
            if (!itemId) return m.reply(`❌ Cara: ${prefix}rpg buy <id>\nLihat ID di ${prefix}rpg shop`);

            const item = ITEMS.consumables[itemId]
                || ITEMS.equipment?.weapons?.[itemId]
                || ITEMS.equipment?.armor?.[itemId]
                || ITEMS.equipment?.accessory?.[itemId];

            if (!item) return m.reply(`❌ Item *${itemId}* tidak ditemukan!`);
            if (item.class && !item.class.includes(char?.class)) return m.reply(`❌ Item ini hanya untuk: *${item.class.join(', ')}*`);

            const globalUser = getUser(userId);
            if (globalUser.koin < item.price) return m.reply(`❌ Koin tidak cukup!\nHarga: ${item.price} | Kamu: ${globalUser.koin}`);

            deductKoin(userId, item.price);
            char.inventory = char.inventory || [];
            char.inventory.push(itemId);
            saveChar(userId, char);

            return m.reply(`✅ *Pembelian Berhasil!*\n\n${item.emoji} *${item.name}*\n💰 -${item.price} koin\n🎒 Masuk ke inventory`);
        }

        // ─── GANTI KELAS ───
        if (sub === 'ganti') {
            const newClass = args[1]?.toLowerCase();
            if (!newClass) {
                const list = Object.entries(CLASSES).map(([id, c]) => `${c.emoji} \`${id}\` — ${c.desc}`).join('\n');
                return m.reply(`🔄 *Ganti Kelas*\n\n${list}\n\nCara: ${prefix}rpg ganti <kelas>\nBiaya: ${CLASS_CHANGE_COST} koin`);
            }
            if (!CLASSES[newClass]) return m.reply(`❌ Kelas tidak valid!`);
            if (newClass === char.class) return m.reply(`⚠️ Kamu sudah kelas ${cls.name}!`);

            const globalUser = getUser(userId);
            if (globalUser.koin < CLASS_CHANGE_COST) return m.reply(`❌ Koin tidak cukup! Butuh: ${CLASS_CHANGE_COST}`);

            deductKoin(userId, CLASS_CHANGE_COST);
            const newChar = createChar(userId, newClass);
            newChar.floor = char.floor;
            newChar.inventory = char.inventory;
            newChar.equipment = char.equipment;
            saveChar(userId, newChar);

            const newCls = CLASSES[newClass];
            return m.reply(`✅ *Kelas Diganti!*\n\n${newCls.emoji} *${newCls.name}*\n❤️ HP: ${newChar.maxHp} | ⚔️ ATK: ${newChar.atk}\n🛡️ DEF: ${newChar.def} | ✨ INT: ${newChar.int}\n\n💰 -${CLASS_CHANGE_COST} Koin`);
        }
        if (sub === 'boss') {
            if (!char) return m.reply(`❌ Belum punya karakter!\n${prefix}rpg start`);
            if (char.inDungeon) return m.reply(`⚠️ Selesaikan pertarungan dulu!\n${prefix}rpg attack | flee`);

            const MONSTERS = require('../../database/monsters.json');

            // Boss berdasarkan guild rank
            let player = getPlayer(userId);
            const rankData = getGuildRank(player.guildPoint);
            const bossList = MONSTERS.monsters.boss.filter(b => b.rank === rankData.rank);

            if (!bossList.length) return m.reply(`❌ Tidak ada boss di rank ${rankData.rank}!`);

            const boss = { ...bossList[Math.floor(Math.random() * bossList.length)] };
            boss._maxHp = boss.hp;
            boss._isBoss = true;

            char.inDungeon = true;
            char.dungeonMonster = boss;
            saveChar(userId, char);

            const buttons = [
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "⚔️ Attack", id: `${prefix}rpg attack` }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "✨ Skill", id: `${prefix}rpg skill` }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "💊 Item", id: `${prefix}rpg item` }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "💨 Flee", id: `${prefix}rpg flee` }) }
            ];

            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: { message: { interactiveMessage: {
                    body: { text: `💀 *BOSS ENCOUNTER!*\n\n${boss.emoji} *${boss.name}* telah muncul!\n_Boss ${rankData.label} yang paling ditakuti..._\n\n👾 Boss HP: ${boss.hp}\n❤️ Kamu HP: ${char.hp}/${char.maxHp}\n\n⚠️ Boss lebih kuat dari monster biasa!\nPilih aksimu dengan bijak, Adventurer!` },
                    footer: { text: `` },
                    nativeFlowMessage: { buttons }
                }}}
            }, { quoted: m });

            return await castorice.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
        }

        return m.reply(`⚔️ Gunakan ${prefix}rpg untuk lihat menu!`);
    }
};

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function generateBar(current, max, length = 10) {
    const filled = Math.round((Math.min(current, max) / max) * length);
    return `[${'█'.repeat(Math.max(0, filled))}${'░'.repeat(Math.max(0, length - filled))}] ${Math.round((Math.min(current, max) / max) * 100)}%`;
}

async function sendBattleResult(castorice, m, prefix, turnResult) {
    if (turnResult.error) return m.reply(`❌ ${turnResult.error}`);
    const logText = turnResult.log.join('\n');

    if (turnResult.result === 'win') return m.reply(`${logText}\n\n🎉 *Floor ${turnResult.floor - 1} Selesai!*\n${prefix}rpg dungeon untuk lanjut.`);
    if (turnResult.result === 'lose') return m.reply(`${logText}\n\n💀 *Kamu dikalahkan!*\nHP dipulihkan ke 30%.`);
    if (turnResult.result === 'fled') return m.reply(logText);

    const hpBar = generateBar(turnResult.charHp, turnResult.charMaxHp);
    const monHpBar = generateBar(Math.max(0, turnResult.monsterHp), turnResult.monsterMaxHp || 100);

    const buttons = [
        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "⚔️ Attack", id: `${prefix}rpg attack` }) },
        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "✨ Skill", id: `${prefix}rpg skill` }) },
        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "💨 Flee", id: `${prefix}rpg flee` }) }
    ];

    const msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: { message: { interactiveMessage: {
            body: { text: `${logText}\n\n${turnResult.monster.emoji} Monster: ${Math.max(0, turnResult.monsterHp)} HP\n${monHpBar}\n\n❤️ Kamu: ${turnResult.charHp} HP\n${hpBar}` },
            footer: { text: `` },
            nativeFlowMessage: { buttons }
        }}}
    }, { quoted: m });

    await castorice.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}