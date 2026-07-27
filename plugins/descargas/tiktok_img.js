/* ERIS-MD TIKTOK SLIDE/IMAGE DOWNLOADER - DNS FIX */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

const redes = 'https://github.com/SINNOMBRE22/Eris-MD';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const name = m.pushName || (await conn.getName(m.sender)) || "Usuario";

    // Cargar miniatura de Eris
    let thumb;
    try {
        thumb = fs.readFileSync(path.join(process.cwd(), 'src/imagenes/perfil2.jpeg'));
    } catch { 
        thumb = Buffer.alloc(0); 
    }

    // --- AYUDA VISUAL ---
    if (!text || !text.includes('tiktok.com')) {
        return conn.sendMessage(m.chat, {
            text: `🌸 *Falta el enlace, ${name}.*\n\nIndica la URL de un TikTok (Formato Carrusel/Fotos).\n> *Ejemplo:* ${usedPrefix + command} https://vm.tiktok.com/ZM...`,
            contextInfo: {
                externalAdReply: {
                    title: '🌸 ERIS SERVICE - TIKTOK IMG 🌸',
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
        let images = [];

        // --- INTENTO 1: TIKWM (Súper estable, evita ENOTFOUND) ---
        try {
            const res1 = await axios.post('https://www.tikwm.com/api/', { url: text, hd: 1 });
            if (res1.data && res1.data.data && res1.data.data.images) {
                images = res1.data.data.images;
            } else {
                throw new Error('No es un carrusel en TikWM');
            }
        } catch (e1) {
            console.log(`[TTIMG] Falló TikWM: ${e1.message}. Intentando respaldo...`);
            
            // --- INTENTO 2: AGATZ (Respaldo) ---
            const res2 = await axios.get(`https://api.agatz.xyz/api/tiktok?url=${encodeURIComponent(text)}`);
            if (res2.data && res2.data.data && res2.data.data.images) {
                images = res2.data.data.images;
            } else {
                throw new Error('No es un carrusel en Agatz');
            }
        }

        if (images.length === 0) throw new Error('Cero imágenes extraídas.');

        // Aviso de que ya se extrajo todo
        await conn.reply(m.chat, `🌸 *Carrusel detectado:* Procesando ${images.length} imágenes...`, m);

        // Enviar imágenes una por una
        for (let i = 0; i < images.length; i++) {
            await conn.sendMessage(m.chat, {
                image: { url: images[i] },
                caption: `> 🌸 *Imagen ${i + 1}/${images.length}* - Eris Service`
            }, { quoted: m });
        }

        await m.react('✅');

    } catch (error) {
        console.error("Error TikTok Img:", error.message);
        await m.react('❌');
        conn.reply(m.chat, `🌸 *Error:* No pude extraer las fotos. El enlace no es un carrusel o los servidores están bloqueados.`, m);
    }
}

handler.help = ['ttimg (url-tiktok)'];
handler.tags = ['descargas'];
handler.command = ['tiktokimg', 'ttimg'];
handler.register = false;

export default handler;
