/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/

const fs = require('fs');
const path = require('path');

const PLUGINS_DIR = path.join(__dirname, '../plugins_castorice');
const HIDDEN_CATEGORIES = ['owner', 'main'];

// ─── HITUNG FILE .JS REKURSIF (sama kayak .fitur) ───
function countJsFiles(dir) {
    let total = 0;
    if (!fs.existsSync(dir)) return total;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) total += countJsFiles(fullPath);
        else if (entry.isFile() && entry.name.endsWith('.js')) total++;
    }
    return total;
}

// ─── SCAN SEMUA PLUGIN (baca module.exports) ───
function scanPlugins() {
    const results = [];
    if (!fs.existsSync(PLUGINS_DIR)) return results;

    const folders = fs.readdirSync(PLUGINS_DIR).filter(f =>
        fs.statSync(path.join(PLUGINS_DIR, f)).isDirectory()
    );

    for (const folder of folders) {
        const folderPath = path.join(PLUGINS_DIR, folder);
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            try {
                delete require.cache[require.resolve(filePath)];
                const plugin = require(filePath);
                if (!plugin || !plugin.command) continue;
                results.push({
                    name: plugin.name || file.replace('.js', ''),
                    command: Array.isArray(plugin.command) ? plugin.command : [plugin.command],
                    category: folder, // selalu ikut nama folder, bukan module.exports.category
                    file: `${folder}/${file}`
                });
            } catch (e) {
                // skip plugin error
            }
        }
    }

    return results;
}

/**
 * Total fitur = jumlah file .js (konsisten sama .fitur command)
 * @param {boolean} includeHidden
 */
function getTotalFeatures(includeHidden = false) {
    if (includeHidden) return countJsFiles(PLUGINS_DIR);

    // Hitung per folder, exclude hidden
    if (!fs.existsSync(PLUGINS_DIR)) return 0;
    let total = 0;
    const folders = fs.readdirSync(PLUGINS_DIR).filter(f =>
        fs.statSync(path.join(PLUGINS_DIR, f)).isDirectory()
    );
    for (const folder of folders) {
        if (HIDDEN_CATEGORIES.includes(folder)) continue;
        total += countJsFiles(path.join(PLUGINS_DIR, folder));
    }
    return total;
}

/**
 * Total command termasuk alias
 */
function getTotalCommands(includeHidden = false) {
    return scanPlugins()
        .filter(p => includeHidden || !HIDDEN_CATEGORIES.includes(p.category))
        .reduce((acc, p) => acc + p.command.length, 0);
}

/**
 * Group plugin per kategori dari scan
 */
function getPluginsByCategory(includeHidden = false) {
    const plugins = scanPlugins();
    const grouped = {};
    for (const p of plugins) {
        if (!includeHidden && HIDDEN_CATEGORIES.includes(p.category)) continue;
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push(p);
    }
    return grouped;
}

/**
 * Stats ringkas per kategori
 * totalFeatures = jumlah file .js per folder
 */
function getCategoryStats(includeHidden = false) {
    if (!fs.existsSync(PLUGINS_DIR)) return [];

    const folders = fs.readdirSync(PLUGINS_DIR).filter(f =>
        fs.statSync(path.join(PLUGINS_DIR, f)).isDirectory()
    );

    const pluginsByFolder = getPluginsByCategory(true); // ambil semua dulu

    return folders
        .filter(f => includeHidden || !HIDDEN_CATEGORIES.includes(f))
        .map(folder => {
            const plugins = pluginsByFolder[folder] || [];
            const fileCount = countJsFiles(path.join(PLUGINS_DIR, folder));
            return {
                category: folder,
                totalFeatures: fileCount, // konsisten sama .fitur
                totalCommands: plugins.reduce((acc, p) => acc + p.command.length, 0),
                plugins
            };
        })
        .filter(c => c.totalFeatures > 0);
}

module.exports = {
    scanPlugins,
    getTotalFeatures,
    getTotalCommands,
    getPluginsByCategory,
    getCategoryStats,
    HIDDEN_CATEGORIES
};