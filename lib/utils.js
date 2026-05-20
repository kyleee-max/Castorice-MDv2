/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const moment = require('moment-timezone');
const os = require('os');

const runtime = (seconds) => {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
};

const getTime = () => {
    const locale = 'id';
    const gmt = moment.tz('Asia/Jakarta');
    const time = gmt.format('HH:mm:ss');
    const date = gmt.format('DD/MM/YYYY');
    const day = gmt.locale(locale).format('dddd');
    return { time, date, day };
};

const formatSize = (bytes) => {
    if (bytes >= 1000000000) { bytes = (bytes / 1000000000).toFixed(2) + " GB"; }
    else if (bytes >= 1000000) { bytes = (bytes / 1000000).toFixed(2) + " MB"; }
    else if (bytes >= 1000) { bytes = (bytes / 1000).toFixed(2) + " KB"; }
    else if (bytes > 1) { bytes = bytes + " bytes"; }
    else { bytes = "0 bytes"; }
    return bytes;
};

module.exports = { runtime, getTime, formatSize };