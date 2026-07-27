/* ERIS-MD XVIDEOS DOWNLOADER - DIRECT SCRAPER */

import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const redes = 'https://github.com/SINNOMBRE22/Eris-MD';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const name = m.pushName || (await conn.getName(m.sender)) || "Usuario";

    // 1. Verificación NSFW
    if (m.isGroup && !global.db.data.chats[m.chat].nsfw) {
        return conn.reply(m.chat, `🌸 *Contenido Bloqueado:* El modo NSFW está desactivado en este grupo.`, m);
    }

    // Cargar miniatura oficial de Eris
    let thumb;
    try {
        thumb = fs.readFileSync(path.join(process.cwd(), 'src/imagenes/perfil2.jpeg'));
    } catch { 
        thumb = Buffer.alloc(0); 
    }

    // 2. Ayuda visual
    if (!text || !text.includes('xvideos.com')) {
        return conn.sendMessage(m.chat, {
            text: `🌸 *Enlace requerido, ${name}.*\n\nIndica una URL válida de XVideos para extraer el video.\n> *Ejemplo:* ${usedPrefix + command} https://www.xvideos.com/video...`,
            contextInfo: {
                externalAdReply: {
                    title: '🌸 ERIS SERVICE - NSFW 🌸',
                    body: `Esperando enlace...`,
                    thumbnail: thumb,
                    sourceUrl: redes,
                    mediaType: 1
                }
            }
        }, { quoted: m });
    }

    await m.react('⏳');

    try {
        // 3. Ejecutar Scraper Directo
        const result = await xvdl(text);

        if (!result || !result.url) {
            throw new Error('No se pudo extraer el enlace del video.');
        }

        let caption = `╭─── [ 🔞 *XVIDEOS DL* ] ──···\n`;
        caption += `│ 🎞️ *Título:* ${result.title.substring(0, 60)}${result.title.length > 60 ? '...' : ''}\n`;
        caption += `│ 👀 *Vistas:* ${result.views}\n`;
        caption += `╰─────────────────────────···\n\n`;
        caption += `> 🌸 *Carga entregada por Eris Service.*`;

        // 4. Enviar el video (Como documento para evitar cortes y compresión en WhatsApp)
        await conn.sendMessage(m.chat, { 
            document: { url: result.url }, 
            caption: caption,
            mimetype: 'video/mp4',
            fileName: `${result.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`
        }, { quoted: m });

        await m.react('✅');

    } catch (error) {
        console.error("Error XVideos DL:", error.message);
        await m.react('❌');
        conn.reply(m.chat, `🌸 *Error:* No pude procesar el video. Puede que el enlace esté roto o los servidores rechacen la conexión.`, m);
    }
};

handler.help = ['xvideosdl <url>'];
handler.tags = ['nsfw'];
handler.command = ['xvideosdl', 'xvdl', 'xvideos'];
handler.register = false;

export default handler;

// --- SCRAPER INTERNO BLINDADO ---
async function xvdl(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        const title = $("meta[property='og:title']").attr("content") || 'XVideos_Video';
        const views = $("div#video-tabs > div > div > div > div > strong.mobile-hide").text() || 'N/A';
        
        // Regex robusta para capturar el MP4 directo (Alta o Baja calidad)
        const highMatch = data.match(/html5player\.setVideoUrlHigh\('(.*?)'\);/);
        const lowMatch = data.match(/html5player\.setVideoUrlLow\('(.*?)'\);/);
        
        const videoUrl = (highMatch ? highMatch[1] : null) || (lowMatch ? lowMatch[1] : null);

        return { title, views, url: videoUrl };
    } catch (err) {
        console.error("Fallo en Scraper XVideos:", err.message);
        return null;
    }
}
