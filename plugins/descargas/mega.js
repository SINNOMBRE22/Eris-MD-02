/* ERIS-MD MEGA DOWNLOADER */

import { File } from "megajs";
import path from "path";
import fs from "fs";

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter';
const newsletterName = 'Eris Service';
const redes = 'https://github.com/SINNOMBRE22/Eris-MD';

let handler = async (m, { conn, args, usedPrefix, text, command }) => {
    
    // Miniatura de Eris
    let thumb;
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg');
        thumb = fs.readFileSync(imgPath);
    } catch {
        thumb = Buffer.alloc(0);
    }

    const name = m.pushName || (await conn.getName(m.sender)) || "Usuario";

    // --- MENSAJE DE AYUDA CON MINIATURA ---
    if (!text) {
        const helpText = `🌸 *Enlace requerido, ${name}.*\n\nNecesito un link de MEGA para procesar la descarga.\n> *Ejemplo:* ${usedPrefix + command} https://mega.nz/file/...`;
        
        return conn.sendMessage(m.chat, {
            text: helpText,
            contextInfo: {
                mentionedJid: [m.sender],
                isForwarded: true,
                forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 },
                externalAdReply: {
                    title: `🌸 ERIS SERVICE - MEGA 🌸`,
                    body: `Hola ${name}, te falta el link.`,
                    thumbnail: thumb,
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    sourceUrl: redes
                }
            }
        }, { quoted: m });
    }

    try {
        const file = File.fromURL(text);
        await file.loadAttributes();

        // Límite de seguridad: 300MB
        if (file.size >= 300000000) {
            return conn.reply(m.chat, `🌸 *Archivo muy pesado:* El límite de transmisión es de 300MB. Tu archivo pesa ${formatBytes(file.size)}.`, m);
        }

        await m.react('🕓');

        let caption = `╭─── [ ☁️ *MEGA DOWNLOADER* ] ──···\n`;
        caption += `│ 📄 *Archivo:* ${file.name}\n`;
        caption += `│ 📏 *Tamaño:* ${formatBytes(file.size)}\n`;
        caption += `╰─────────────────────────···\n\n`;
        caption += `> 🌸 *Descargando y cifrando carga...*`;

        // Aviso de inicio
        await conn.sendMessage(m.chat, {
            text: caption,
            contextInfo: {
                externalAdReply: {
                    title: `🌸 ERIS SERVICE - MEGA 🌸`,
                    body: `Descargando: ${file.name}`,
                    thumbnail: thumb,
                    mediaType: 1,
                    sourceUrl: text
                }
            }
        }, { quoted: m });

        const data = await file.downloadBuffer();
        const fileExtension = path.extname(file.name).toLowerCase();
        
        // Mimetypes comunes
        const mimeTypes = {
            ".mp4": "video/mp4",
            ".pdf": "application/pdf",
            ".zip": "application/zip",
            ".rar": "application/x-rar-compressed",
            ".7z": "application/x-7z-compressed",
            ".jpg": "image/jpeg",
            ".png": "image/png",
            ".mp3": "audio/mpeg"
        };

        let mimetype = mimeTypes[fileExtension] || "application/octet-stream";

        await conn.sendMessage(m.chat, {
            document: data,
            fileName: file.name,
            mimetype: mimetype,
            caption: `> 🌸 *Archivo entregado por Eris Service.*`
        }, { quoted: m });

        await m.react('✅');

    } catch (error) {
        console.error("Error MEGA:", error);
        await m.react('❌');
        conn.reply(m.chat, `🌸 *Error:* No pude procesar el enlace de MEGA. Verifica que el archivo no esté borrado o requiera clave de cifrado.`, m);
    }
}

handler.help = ["mega <url>"];
handler.tags = ["descargas"];
handler.command = ['mega', 'mg'];
handler.register = false;

export default handler;

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
