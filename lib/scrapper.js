/* 
========================================
   Kaelsenpai Castorice MD © 2025-2026 
   Dilarang menghapus Creadit 
   Castorice MD - Hak cipta di lindungi
========================================
*/
const axios = require('axios');
const FormData = require('form-data');

/**
 * Remini / Image Enhancer using Vyro AI Engine
 * @param {Buffer} buffer - Image Buffer
 * @param {String} method - 'enhance', 'recolor', or 'dehaze'
 */
async function remini(buffer, method = "enhance") {
    const methods = ["enhance", "recolor", "dehaze"];
    const type = methods.includes(method) ? method : "enhance";
    
    const formData = new FormData();
    formData.append("model_version", 1, {
        "Content-Transfer-Encoding": "binary",
        contentType: "multipart/form-data; charset=utf-8"
    });
    formData.append("image", Buffer.from(buffer), {
        filename: "image.jpg",
        contentType: "image/jpeg"
    });

    try {
        const response = await axios.post(`https://inferenceengine.vyro.ai/${type}`, formData, {
            headers: {
                ...formData.getHeaders(),
                "User-Agent": "okhttp/4.9.3",
                "Connection": "Keep-Alive",
                "Accept-Encoding": "gzip",
            },
            responseType: "arraybuffer" 
        });

        return Buffer.from(response.data);
    } catch (err) {
        throw new Error(err.response?.statusText || "Server Busy");
    }
}
/**
 * Pinterest Search
 * @param {String} query - Search keyword
 */
async function pinterest(query) {
    return new Promise(async (resolve, reject) => {
        const baseUrl = 'https://www.pinterest.com/resource/BaseSearchResource/get/';
        const params = {
            source_url: '/search/pins/?q=' + encodeURIComponent(query),
            data: JSON.stringify({
                options: {
                    isPrefetch: false,
                    query: query,
                    scope: 'pins',
                    no_fetch_context_on_resource: false
                },
                context: {}
            }),
            _: Date.now()
        };

        const url = new URL(baseUrl);
        Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

        try {
            const response = await axios.get(url.toString(), {
                headers: {
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
                    "referer": "https://www.pinterest.com/",
                    "accept": "application/json, text/javascript, */*; q=0.01",
                    "x-requested-with": "XMLHttpRequest"
                }
            });
            
            // Cek daleman datanya, Pinterest strukturnya agak dalem
            const results = response.data.resource_response?.data?.results || [];
            
            if (results.length === 0) return resolve([]); // Balikin array kosong kalo emang zonk

            const data = results.map(item => ({
                id: item.id,
                title: item.grid_title || "No Title",
                pin: 'https://www.pinterest.com/pin/' + item.id,
                image: item.images?.['736x']?.url || item.images?.orig?.url,
                created_at: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : ''
            }));
            resolve(data);
        } catch (e) {
            console.error("Error Pinterest:", e.message);
            reject([]);
        }
    });
}

module.exports = { 
    remini, 
    pinterest 
};