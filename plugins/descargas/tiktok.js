/* ERIS-MD TIKTOK DOWNLOADER - FAST & DIRECT */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

// --- CONFIGURACIÓN ---
const CAUSA_API_KEY = 'causa-ee5ee31dcfc79da4';
const CAUSA_ENDPOINT = 'https://rest.apicausas.xyz/api/v1/descargas/tiktok';

// --- DATOS DE ERIS ---
const newsletterJid = '120363407502496951@newsletter';
const newsletterName = 'Eris Service';
const redes = 'https://github.com/SINNOMBRE22/Eris-MD';

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const name = m.pushName || (await conn.getName(m.sender)) || "Usuario";

    // Cargar miniatura oficial de Eris
    let thumb;
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg');
        thumb = fs.readFileSync(imgPath);
    } catch {
        thumb = Buffer.alloc(0);
    }

    // --- AYUDA VISUAL (Si falta el link) ---
    if (!args[0]) {
        return conn.sendMessage(m.chat, {
            text: `🌸 *Falta el enlace de TikTok, ${name}.*\n\nIndica la URL del video.\n> *Ejemplo:* ${usedPrefix + command} https://vm.tiktok.com/ZM...\n\n_Tip: Para solo audio usa:_ \`${usedPrefix + command} audio <link>\``,
            contextInfo: {
                externalAdReply: {
                    title: '🌸 ERIS SERVICE - TIKTOK 🌸',
                    body: `Esperando enlace...`,
                    thumbnail: thumb,
                    sourceUrl: redes,
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: m });
    }

    // Detectar si el usuario quiere "audio" o video por defecto
    const isAudio = args[0].toLowerCase() === 'audio';
    const targetUrl = isAudio ? args[1] : args[0];
    const type = isAudio ? 'mp3' : 'mp4';

    if (!targetUrl || !targetUrl.includes('tiktok.com')) {
        return conn.reply(m.chat, `🌸 *Enlace inválido:* Asegúrate de enviar un link correcto de TikTok.`, m);
    }

    await m.react('🕓');

    try {
        // 1. Petición a tu API de Causas
        const { data: res } = await axios.get(CAUSA_ENDPOINT, {
            params: {
                url: targetUrl,
                type: type,
                apikey: CAUSA_API_KEY
            }
        });

        if (!res.status || !res.data || !res.data.download || !res.data.download.url) {
            throw new Error('No se obtuvo el enlace de descarga.');
        }

        const videoData = res.data;
        const downloadUrl = videoData.download.url;
        const title = videoData.titulo || 'TikTok Video';
        const author = videoData.autor || videoData.nickname || 'Usuario';

        let caption = `╭─── [ 📱 *TIKTOK DL* ] ──···\n`;
        caption += `│ 👤 *Autor:* ${author}\n`;
        caption += `│ 💬 *Título:* ${title.substring(0, 50)}${title.length > 50 ? '...' : ''}\n`;
        caption += `╰─────────────────────────···\n\n`;
        caption += `> 🌸 *Sin marca de agua. Entregado por Eris Service.*`;

        // 2. Descargar a Buffer (Garantiza que WhatsApp no corrompa el archivo)
        const fileResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
        const fileBuffer = Buffer.from(fileResponse.data);

        // 3. Enviar al chat
        if (isAudio) {
            await conn.sendMessage(m.chat, {
                audio: fileBuffer,
                mimetype: 'audio/mpeg',
                fileName: `tiktok_audio.mp3`
            }, { quoted: m });
            await m.react('🎧');
        } else {
            await conn.sendMessage(m.chat, {
                video: fileBuffer,
                caption: caption,
                mimetype: 'video/mp4',
                fileName: `tiktok_video.mp4`
            }, { quoted: m });
            await m.react('✅');
        }

    } catch (e) {
        console.error("Error TikTok:", e.message);
        await m.react('❌');
        conn.reply(m.chat, `🌸 *Error:* No pude procesar el TikTok. Puede que sea un carrusel de fotos (Slide) o el servidor esté saturado.`, m);
    }
}

handler.help = ['tiktok <url>'];
handler.tags = ['descargas'];
handler.command = ['tiktok', 'tt', 'ttdl'];
handler.register = false;

export default handler;
