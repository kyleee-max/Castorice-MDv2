const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const TMP_DIR = './sampah';
const MAX_INLINE = 3000;

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

async function sendOutput(castorice, m, label, output) {
  const str = typeof output === 'string' ? output : util.inspect(output, { depth: 4 });

  if (str.length <= MAX_INLINE) {
    return m.reply(`${label}\n\`\`\`\n${str}\n\`\`\``);
  }

  const tmpFile = path.join(TMP_DIR, `output_${Date.now()}.txt`);
  fs.writeFileSync(tmpFile, str);
  await castorice.sendMessage(m.chat, {
    document: fs.readFileSync(tmpFile),
    mimetype: 'text/plain',
    fileName: `output_${Date.now()}.txt`,
    caption: `${label} _(output terlalu panjang, dikirim sebagai file)_`,
  }, { quoted: m });
  fs.unlinkSync(tmpFile);
}

module.exports = {
  name: 'Eval & Exec',
  command: ['eval', '>', 'exec', '$'],
  category: 'owner',

  run: async (castorice, m, { text, command, isOwner }) => {
    if (!isOwner) return m.reply('❌ Owner only!');
    if (!text) return m.reply(`❌ Kodenya mana?\nContoh: \`.${command} 1 + 1\``);

    const isExec = command === 'exec' || command === '$';

    if (isExec) {
      await m.reply('⏳ Running...');
      return exec(text, { timeout: 15000 }, async (err, stdout, stderr) => {
        const output = err
          ? `❌ Error:\n${err.message}${stderr ? `\n\nSTDERR:\n${stderr}` : ''}`
          : (stdout || stderr || '(no output)');
        await sendOutput(castorice, m, '📟 *Shell Output:*', output.trim());
      });
    }

    try {
      await m.reply('⏳ Evaluating...');

      const sock = castorice;
      const chat = m.chat;
      const sender = m.sender;

      let result = await eval(`(async () => { ${text} })()`);

      if (result === undefined) result = '✅ Done (undefined)';
      await sendOutput(castorice, m, '📤 *Eval Output:*', result);

    } catch (e) {
      await sendOutput(castorice, m, '❌ *Eval Error:*', e.stack || e.message);
    }
  },
};