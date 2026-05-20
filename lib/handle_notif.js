/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const fs = require('fs')
const chalk = require('chalk')

async function handleParticipantsUpdate(update, kael) {
    const { id, participants, action } = update
    const dbPath = './database/group.json'
    if (!fs.existsSync(dbPath)) return
    
    let groupDB = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
    const db = groupDB[id]
    if (!db) return

    try {
        const groupMetadata = await kael.groupMetadata(id)
        const groupName = groupMetadata.subject

        for (let jid of participants) {
            let user = jid.split('@')[0]
            if (action === 'add' && db.welcome?.enabled) {
                let txt = (db.welcome.text || "Welcome @user").replace(/@user/g, `@${user}`).replace(/@group/g, groupName)
                await kael.sendMessage(id, { text: txt, mentions: [jid] })
            }
            if (action === 'remove' && db.goodbye?.enabled) {
                let txt = (db.goodbye.text || "Goodbye @user").replace(/@user/g, `@${user}`).replace(/@group/g, groupName)
                await kael.sendMessage(id, { text: txt, mentions: [jid] })
            }
            if (action === 'promote') {
                await kael.sendMessage(id, { text: `🚀 @${user} naik jadi Admin!`, mentions: [jid] })
            }
            if (action === 'demote') {
                await kael.sendMessage(id, { text: `📉 @${user} turun jabatan.`, mentions: [jid] })
            }
        }
    } catch (err) {
        console.log(chalk.red("Error Group Update: "), err)
    }
}

module.exports = { handleParticipantsUpdate } 