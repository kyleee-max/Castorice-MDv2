/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

require("./settings.js")
const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    Browsers,
    downloadContentFromMessage
} = require('@whiskeysocket/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path')
const chalk = require('chalk');
const FileType = require('file-type');
const fetch = require('node-fetch');
const readline = require("readline");
const { smsg } = require('./lib/helper');
const { writeExif } = require('./lib/exif');
const { handleParticipantsUpdate } = require('./lib/handle_notif')
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));


async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('castorice_session');

 console.clear();

    // ─── Warna tema ungu ───
    const rgb = (r, g, b) => `\x1b[38;2;${r};${g};${b}m`;
    const BOLD = `\x1b[1m`;
    const RESET = `\x1b[0m`;
    const p  = chalk.hex('#9b59b6');  // border ungu
    const pp = chalk.hex('#c39bd3');  // ungu muda
    const pk = chalk.hex('#e056fd');  // pink ungu accent

    // ─── Gradient per karakter ───
    const gradLine = (text) => {
        const colors = [
            [160,60,220],[175,50,232],[190,45,242],
            [200,70,238],[210,95,235],[195,75,228],[175,55,235]
        ];
        let out = BOLD;
        for (let i = 0; i < text.length; i++) {
            const c = colors[i % colors.length];
            out += rgb(c[0], c[1], c[2]) + text[i];
        }
        return out + RESET;
    };

    // ─── Box builder — lebar INNER W karakter, teks di-center ───
    const W = 36;
    const boxTop    = () => p('  ╔' + '═'.repeat(W) + '╗');
    const boxBot    = () => p('  ╚' + '═'.repeat(W) + '╝');
    const boxDiv    = () => p('  ╠' + '═'.repeat(W) + '╣');
    const boxEmpty  = () => p('  ║' + ' '.repeat(W) + '║');
    const boxRow    = (text, color = pp) => {
        const plain = text.replace(/\x1b\[[0-9;]*m/g, '');
        const pad = Math.max(0, W - plain.length);
        const l = Math.floor(pad / 2);
        const r = pad - l;
        return p('  ║') + ' '.repeat(l) + color(text) + ' '.repeat(r) + p('║');
    };

    console.log('');
    console.log(gradLine('  ██████╗  █████╗ ███████╗████████╗'));
    console.log(gradLine('  ██╔════╝██╔══██╗██╔════╝╚══██╔══╝'));
    console.log(gradLine('  ██║     ███████║███████╗   ██║   '));
    console.log(gradLine('  ██║     ██╔══██║╚════██║   ██║   '));
    console.log(gradLine('  ╚██████╗██║  ██║███████║   ██║   '));
    console.log(gradLine('   ╚═════╝╚═╝  ╚═╝╚══════╝  ╚═╝   '));
    console.log('');
    console.log(gradLine('  ██████╗ ██╗ ██████╗███████╗'));
    console.log(gradLine('  ██╔══██╗██║██╔════╝██╔════╝'));
    console.log(gradLine('  ██████╔╝██║██║     █████╗  '));
    console.log(gradLine('  ██╔══██╗██║██║     ██╔══╝  '));
    console.log(gradLine('  ██║  ██║██║╚██████╗███████╗'));
    console.log(gradLine('  ╚═╝  ╚═╝╚═╝ ╚═════╝╚══════╝'));
    console.log('');
    const sub = `✦  ${global.bot} v${global.version || '2.0'}  —  by ${global.owner}  ✦`;
    const subPad = Math.max(0, (W + 4) - sub.replace(/\x1b\[[0-9;]*m/g,'').length);
    console.log(p('  ' + '═'.repeat(W + 2)));
    console.log(' '.repeat(2 + Math.floor(subPad/2)) + pk('✦') + pp(`  ${global.bot} v${global.version || '2.0'}`) + chalk.gray('  —  by ') + pp(global.owner) + pk('  ✦'));
    console.log(p('  ' + '═'.repeat(W + 2) + '\n'));

    const kael = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.ubuntu('Chrome'),
        markOnlineOnConnect: true
    });

if (!kael.authState.creds.registered) {
    console.log('');
    console.log(boxTop());
    console.log(boxRow('✦  AUTHENTICATION SYSTEM  ✦', pk));
    console.log(boxBot() + '\n');

    let number = await question(pp('  ➤ Nomor WA (628xxx): '));
    number = number.replace(/[^0-9]/g, '');
    const pair = "CASTKAEL";

    // Animasi loading dots
    process.stdout.write(p('  ◆ Requesting pairing code'));
    let dots = 0;
    const loadAnim = setInterval(() => {
        process.stdout.write(pp('.'));
        if (++dots >= 6) { clearInterval(loadAnim); process.stdout.write('\n'); }
    }, 400);

    setTimeout(async () => {
        clearInterval(loadAnim);
        process.stdout.write('\n');
        try {
            const code = await kael.requestPairingCode(number, pair);
            const display = code.slice(0,4) + ' - ' + code.slice(4);

            console.log('');
            console.log(boxTop());
            console.log(boxRow('── PAIRING CODE ──', pk));
            console.log(boxDiv());
            console.log(boxRow(display, chalk.bold.white));
            console.log(boxDiv());
            console.log(boxRow(`No: ${number}  |  Mode: CUSTOM`, chalk.gray));
            console.log(boxBot() + '\n');

        } catch (e) {
            console.log(chalk.red('\n  [!] Gagal: ' + e.message));
        }
    }, 3000);
}
 kael.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'connecting') {
            let frame = 0;
            const spinner = ['◐', '◓', '◑', '◒'];
            const anim = setInterval(() => {
                process.stdout.write('\r  ' + p(spinner[frame % 4]) + pp(' Connecting to WhatsApp...'));
                frame++;
            }, 150);
            kael._connectingAnim = anim;
        }

        if (connection === 'open') {
            if (kael._connectingAnim) { clearInterval(kael._connectingAnim); process.stdout.write('\r' + ' '.repeat(42) + '\r'); }
            const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            const name = kael.user.name || 'Kael';

            console.log('');
            console.log(boxTop());
            console.log(boxRow('● CONNECTED', chalk.bold.greenBright));
            console.log(boxDiv());
            console.log(boxRow(`Bot    : ${global.bot} v${global.version || '2.0'}`, pp));
            console.log(boxRow(`User   : ${name}`, chalk.white));
            console.log(boxRow(`RAM    : ${ram} MB`, pk));
            console.log(boxRow('Status : Listening...', chalk.greenBright));
            console.log(boxBot() + '\n');
        }

        if (connection === 'close') {
            if (kael._connectingAnim) clearInterval(kael._connectingAnim);
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = reason !== DisconnectReason.loggedOut;

            const rBox = (t, c = chalk.red) => {
                const plain = t.replace(/\x1b\[[0-9;]*m/g,'');
                const pad = Math.max(0, W - plain.length);
                return chalk.red('  ║') + ' '.repeat(Math.floor(pad/2)) + c(t) + ' '.repeat(pad - Math.floor(pad/2)) + chalk.red('║');
            };
            console.log('');
            console.log(chalk.red('  ╔' + '═'.repeat(W) + '╗'));
            console.log(rBox('✖  CONNECTION CLOSED', chalk.bold.red));
            console.log(chalk.red('  ╠' + '═'.repeat(W) + '╣'));
            console.log(rBox(`Reason: ${String(reason || 'Unknown')}`, chalk.gray));
            console.log(chalk.red('  ╚' + '═'.repeat(W) + '╝'));

            if (shouldReconnect) {
                console.log(chalk.yellow('\n  ↺ Reconnecting in 5s...\n'));
                setTimeout(() => connectToWhatsApp(), 5000);
            } else {
                console.log(chalk.red.bold('\n  ✖ Logged out! Delete session folder & restart.\n'));
                process.exit();
            }
        }
    });

    kael.ev.on('creds.update', saveCreds);
    kael.ev.on('messages.upsert', async ({ messages }) => {
        try {
            let mek = messages[0];
            if (!mek.message) return;

            if (mek.key && mek.key.remoteJid === 'status@broadcast') return;

            const m = smsg(kael, mek);
            require("./castorice-handler")(kael, m);
        } catch (err) {
            console.log("Error Upsert:", err);
        }
    });
kael.ev.on('group-participants.update', async (update) => {
        await handleParticipantsUpdate(update, kael)
    })

    kael.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jid.match(/(\d+):/);
            if (decode && decode[1]) return `${decode[1]}@s.whatsapp.net`;
        }
        return jid;
    };

    kael.downloadMediaMessage = async (m) => {
        let quoted = m.msg ? m.msg : m;
        let streamType = (m.mtype || m.type || '').replace(/Message/gi, '');
        if (!streamType) streamType = Object.keys(m)[0]?.replace(/Message/gi, '');

        if (quoted.mediaKey && !Buffer.isBuffer(quoted.mediaKey)) {
            quoted.mediaKey = Buffer.from(Object.values(quoted.mediaKey));
        }

        try {
            const stream = await downloadContentFromMessage(quoted, streamType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            return buffer;
        } catch (e) {
            return Buffer.alloc(0);
        }
    };

    kael.downloadAndSaveMediaMessage = async (message, filename) => {
        let buffer = await kael.downloadMediaMessage(message);
        if (buffer.length === 0) return null;
        const type = await FileType.fromBuffer(buffer);
        if (!fs.existsSync('./sampah')) fs.mkdirSync('./sampah');
        const path = `./sampah/${filename || Date.now()}.${type?.ext || 'bin'}`;
        fs.writeFileSync(path, buffer);
        return path;
    };

        kael.sendImgAsSticker = async (jid, path, quoted, options = {}) => {

        let buff = Buffer.isBuffer(path) ? path : /^https?:\/\//.test(path) ? await (await fetch(path)).buffer() : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);

        let buffer = await writeExif(buff, { packname: options.packname || "Castorice Bot", author: options.author || "Kael Dev" });

        return await kael.sendMessage(jid, { sticker: buffer }, { quoted });

    };

    kael.sendVidAsSticker = async (jid, path, quoted, options = {}) => {

        let buff = Buffer.isBuffer(path) ? path : /^https?:\/\//.test(path) ? await (await fetch(path)).buffer() : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);

        let buffer = await writeExif(buff, { packname: options.packname || "Castorice Bot", author: options.author || "Kael Dev" });

        return await kael.sendMessage(jid, { sticker: buffer }, { quoted });

    };
global.plugins = {}
let pluginsFolder = path.join(__dirname, 'plugins_castorice')

function getAllPluginFiles(dir) {
    let results = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            results = results.concat(getAllPluginFiles(fullPath))
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            results.push(fullPath)
        }
    }
    return results
}

const loadPlugins = () => {
    const files = getAllPluginFiles(pluginsFolder)
    for (let filePath of files) {
        let name = path.parse(filePath).name
        delete require.cache[require.resolve(filePath)]
        const plugin = require(filePath)
        plugin.file = path.relative(pluginsFolder, filePath)
        global.plugins[name] = plugin
    }
    console.log(`✅ Loaded ${Object.keys(global.plugins).length} plugins`)
}

loadPlugins()

    fs.watch(pluginsFolder, { recursive: true }, (event, filename) => {
    if (filename && filename.endsWith('.js')) loadPlugins()
})
    fs.watchFile(__filename, () => {
        console.log(chalk.yellow('File index.js berubah! Restarting...'));
        setTimeout(() => process.exit(), 1000);
    });
}

connectToWhatsApp();