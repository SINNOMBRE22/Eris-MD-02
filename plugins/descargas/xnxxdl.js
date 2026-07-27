/* ERIS-MD XNXX DOWNLOADER - DIRECT SCRAPER */

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

    // Cargar miniatura de Eris
    let thumb;
    try {
        thumb = fs.readFileSync(path.join(process.cwd(), 'src/imagenes/perfil2.jpeg'));
    } catch { 
        thumb = Buffer.alloc(0); 
    }

    // 2. Ayuda Visual si falta el link
    if (!text || !text.includes('xnxx.com')) {
        return conn.sendMessage(m.chat, {
            text: `🌸 *Enlace requerido, ${name}.*\n\nIndica una URL válida de XNXX para extraer el video.\n> *Ejemplo:* ${usedPrefix + command} https://www.xnxx.com/video-14lc...`,
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
        const result = await xnxxdl(text);

        if (!result || !result.videoUrl) {
            throw new Error('No se pudo extraer el archivo multimedia.');
        }

        let caption = `╭─── [ 🔞 *XNXX DL* ] ──···\n`;
        caption += `│ 🎞️ *Título:* ${result.title.substring(0, 60)}${result.title.length > 60 ? '...' : ''}\n`;
        caption += `│ 🕒 *Duración:* ${result.duration}\n`;
        caption += `╰─────────────────────────···\n\n`;
        caption += `> 🌸 *Carga entregada por Eris Service.*`;

        // 4. Enviar el video (Como documento por si es muy pesado y evitar compresión de WA)
        await conn.sendMessage(m.chat, { 
            document: { url: result.videoUrl }, 
            caption: caption,
            mimetype: 'video/mp4',
            fileName: `${result.title}.mp4`
        }, { quoted: m });

        await m.react('✅');

    } catch (error) {
        console.error("Error XNXX DL:", error.message);
        await m.react('❌');
        conn.reply(m.chat, `🌸 *Error:* No pude procesar el video. Puede que el enlace esté roto o el servidor de origen no responda.`, m);
    }
};

handler.help = ['xnxxdl <url>'];
handler.tags = ['nsfw'];
handler.command = ['xnxxdl', 'xnxx'];
handler.register = false;

export default handler;

// --- SCRAPER INTERNO MEJORADO ---
async function xnxxdl(URL) {
    try {
        const { data } = await axios.get(URL);
        const $ = cheerio.load(data);
        
        const title = $('meta[property="og:title"]').attr('content') || 'XNXX_Video';
        const duration = $('meta[property="og:duration"]').attr('content') || 'N/A';
        const videoScript = $('#video-player-bg > script:nth-child(6)').html() || '';

        // Extraer link de Alta o Baja calidad mediante Regex
        const highMatch = videoScript.match(/html5player\.setVideoUrlHigh\('(.*?)'\);/);
        const lowMatch = videoScript.match(/html5player\.setVideoUrlLow\('(.*?)'\);/);

        const videoUrl = (highMatch ? highMatch[1] : null) || (lowMatch ? lowMatch[1] : null);

        return { title, duration, videoUrl };
    } catch (err) {
        console.error("Fallo en Scraper XNXX:", err.message);
        return null;
    }
}
