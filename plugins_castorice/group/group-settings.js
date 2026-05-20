const fs = require('fs');
const groupFile = './database/group.json';

function saveGroupDB(groupDB) {
    fs.writeFileSync(groupFile, JSON.stringify(groupDB, null, 2));
}

module.exports = {
    name: "Group Feature Setting",
    command: ["on", "off", "set"],
    category: "group",
    run: async (castorice, m, { args, command, reply, groupDB }) => {
        if (!m.isGroup) return reply("❌ Khusus grup!");
        if (!groupDB[m.chat]) groupDB[m.chat] = {};

        const action = command;
        const feature = args[0]?.toLowerCase();
        const value = args.slice(1).join(" ");

        const allowed = ["welcome", "goodbye", "hidetag"];
        if (!feature || !allowed.includes(feature)) return reply(`⚠️ Fitur: ${allowed.join(", ")}`);

        if (action === "on" || action === "off") {
            const status = action === "on";
            if (["welcome", "goodbye"].includes(feature)) {
                groupDB[m.chat][feature].enabled = status;
            } else {
                groupDB[m.chat][feature] = status;
            }
        } else if (action === "set") {
            if (!["welcome", "goodbye"].includes(feature)) return reply("❌ Fitur ini tidak memerlukan teks tambahan.");
            if (!value) return reply("⚠️ Teksnya mana?");
            groupDB[m.chat][feature].text = value;
        }

        saveGroupDB(groupDB);
        return reply(`✅ *${feature.toUpperCase()}* berhasil di-${action.toUpperCase()}`);
    }
};