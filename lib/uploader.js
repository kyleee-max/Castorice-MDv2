/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/
const axios = require('axios');
const FormData = require('form-data');
const FileType = require('file-type');

/**
 * Upload Buffer to Catbox
 * @param {Buffer} buffer 
 */
const catbox = async (buffer) => {
    try {
        const { ext } = await FileType.fromBuffer(buffer) || { ext: 'bin' };
        const bodyForm = new FormData();
        bodyForm.append('fileToUpload', buffer, `file.${ext}`);
        bodyForm.append('reqtype', 'fileupload');

        const { data } = await axios.post('https://catbox.moe/user/api.php', bodyForm, {
            headers: {
                ...bodyForm.getHeaders(),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            }
        });
        
        return data; // Output: https://files.catbox.moe/xxxxxx.ext
    } catch (err) {
        throw new Error(`Catbox Upload Error: ${err.message}`);
    }
};

module.exports = { catbox };