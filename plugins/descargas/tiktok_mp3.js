/* ERIS-MD TIKTOK MP3 DOWNLOADER */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

const redes = 'https://github.com/SINNOMBRE22/Eris-MD';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const name = m.pushName || (await conn.getName(m.sender)) || "Usuario";

    // Cargar miniatura oficial de Eris
    let thumb;
    try {
        thumb = fs.readFileSync(path.join(process.cwd(), 'src/imagenes/perfil2.jpeg'));
    } catch {
        thumb = Buffer.alloc(0);
    }

    // --- AYUDA VISUAL ---
    if (!text || !text.includes('tiktok.com')) {
        return conn.sendMessage(m.chat, {
            text: `🌸 *Falta el enlace, ${name}.*\n\nIndica la URL de un video de TikTok para extraer su audio.\n> *Ejemplo:* ${usedPrefix + command} https://vm.tiktok.com/ZM...`,
            contextInfo: {
                externalAdReply: {
                    title: '🌸 ERIS SERVICE - TIKTOK MP3 🌸',
                    body: `Esperando enlace...`,
                    thumbnail: thumb,
                    sourceUrl: redes,
                    mediaType: 1
                }
            }
        }, { quoted: m });
    }

    await m.react('🕓');

    try {
        // 1. Usamos TikWM (API probada que no da error DNS en tu VPS)
        const res = await axios.post('https://www.tikwm.com/api/', { url: text, hd: 1 });
        
        if (!res.data || !res.data.data || !res.data.data.music) {
            throw new Error('No se pudo obtener el audio');
        }

        const audioUrl = res.data.data.music;
        const title = res.data.data.title || 'Audio de TikTok';
        const author = res.data.data.author ? res.data.data.author.nickname : 'Usuario';

        // 2. Descargamos el audio a Buffer (Previene que WhatsApp envíe un archivo corrupto)
        const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
        const audioBuffer = Buffer.from(audioResponse.data);

        // 3. Enviamos el audio con diseño de reproductor
        await conn.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `Eris_${Date.now()}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: `🎵 ${title.substring(0, 30)}${title.length > 30 ? '...' : ''}`,
                    body: `Autor: ${author} | Eris Service`,
                    thumbnail: thumb,
                    mediaType: 2, // Formato de reproductor de audio
                    mediaUrl: text,
                    sourceUrl: redes
                }
            }
        }, { quoted: m });

        await m.react('✅');

    } catch (error) {
        console.error("Error TikTok MP3:", error.message);
        await m.react('❌');
        conn.reply(m.chat, `🌸 *Error:* No pude extraer el audio. Asegúrate de que el enlace sea de un video público válido.`, m);
    }
};

handler.help = ['ttmp3 (url-tiktok)'];
handler.tags = ['descargas'];
handler.command = ['tiktokmp3', 'ttmp3'];
handler.register = false;

export default handler;
