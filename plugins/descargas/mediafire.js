/* ERIS-MD MEDIAFIRE DOWNLOADER - ANTI-BLOCK VERSION */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter';
const newsletterName = 'Eris Service';
const redes = 'https://github.com/SINNOMBRE22/Eris-MD';

// --- HEADERS PARA EVITAR BLOQUEOS (ERROR 320/404) ---
const DEFAULT_HEADERS = {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'accept-language': 'es-ES,es;q=0.9,en;q=0.8',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
    'sec-ch-ua-platform': '"Windows"',
    'upgrade-insecure-requests': '1'
};

async function mediafiredlScraper(url) {
    const response = await axios.get(url, { headers: DEFAULT_HEADERS });
    const $ = cheerio.load(response.data);

    const downloadUrl = ($('#downloadButton').attr('href') || '').trim();
    const $intro = $('div.dl-info > div.intro');
    const filename = $intro.find('div.filename').text().trim();
    const filesizeH = $('div.dl-info > ul.details > li').eq(0).find('span').text().trim();
    const filetype = $intro.find('div.filetype > span').eq(0).text().trim();
    const extMatch = /\(\.(.*?)\)/.exec($intro.find('div.filetype > span').eq(1).text());
    const ext = extMatch?.[1]?.trim() || 'bin';

    if (!downloadUrl) throw new Error("No se pudo extraer el enlace. El archivo podría ser privado o requiere verificación manual.");

    return { url: downloadUrl, filename, filesizeH, filetype, ext };
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    
    let thumb;
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg');
        thumb = fs.readFileSync(imgPath);
    } catch {
        thumb = Buffer.alloc(0);
    }

    const name = m.pushName || (await conn.getName(m.sender)) || "Usuario";

    if (!text) {
        const helpText = `🌸 *Enlace requerido, ${name}.*\n\nIndica una URL de MediaFire.\n> *Ejemplo:* ${usedPrefix + command} https://www.mediafire.com/file/...`;
        
        return conn.sendMessage(m.chat, {
            text: helpText,
            contextInfo: {
                mentionedJid: [m.sender],
                isForwarded: true,
                forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 },
                externalAdReply: {
                    title: `🌸 ERIS SERVICE - MEDIAFIRE 🌸`,
                    body: `Hola ${name}, te falta el link.`,
                    thumbnail: thumb,
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    sourceUrl: redes
                }
            }
        }, { quoted: m });
    }

    await m.react('🕓');

    try {
        let fileData = await mediafiredlScraper(text); 

        let caption = `╭─── [ 📂 *MEDIAFIRE DL* ] ──···\n`;
        caption += `│ 📦 *Archivo:* ${fileData.filename}\n`;
        caption += `│ ⚖️ *Tamaño:* ${fileData.filesizeH}\n`;
        caption += `│ 📂 *Tipo:* ${fileData.filetype} (.${fileData.ext})\n`;
        caption += `╰─────────────────────────···\n\n`;
        caption += `> 🌸 *Enviando archivo...*`;

        await conn.sendMessage(m.chat, {
            text: caption,
            contextInfo: {
                mentionedJid: [m.sender],
                externalAdReply: {
                    title: `🌸 ERIS SERVICE - DOWNLOAD 🌸`,
                    body: fileData.filename,
                    thumbnail: thumb,
                    mediaType: 1,
                    sourceUrl: text
                }
            }
        }, { quoted: m });

        await conn.sendMessage(m.chat, {
            document: { url: fileData.url },
            fileName: fileData.filename,
            mimetype: 'application/octet-stream'
        }, { quoted: m });

        await m.react('✅'); 

    } catch (error) {
        console.error("Error MediaFire:", error.message);
        await m.react('❌'); 
        conn.reply(m.chat, `🌸 *Fallo en la operación:*\nEl servidor de MediaFire bloqueó la conexión automática. Intenta con otro enlace o verifica que sea público.`, m);
    }
}

handler.help = ['mediafire <url>'];
handler.tags = ['descargas'];
handler.command = ['mf', 'mediafire'];
handler.register = false;

export default handler;
