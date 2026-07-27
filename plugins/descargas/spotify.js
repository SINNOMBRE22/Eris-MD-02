/* ERIS-MD SPOTIFY DOWNLOADER - DUAL API */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

const CAUSA_API_KEY = 'causa-ee5ee31dcfc79da4'; 
const SIZE_LIMIT_MB = 100;
const newsletterJid = '120363407502496951@newsletter';
const newsletterName = 'Eris Service';
const redes = 'https://github.com/SINNOMBRE22/Eris-MD';

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const name = m.pushName || (await conn.getName(m.sender)) || "Usuario";
  const spotifyUrl = args[0];

  let thumb;
  try {
    thumb = fs.readFileSync(path.join(process.cwd(), 'src/imagenes/perfil2.jpeg'));
  } catch {
    thumb = Buffer.alloc(0);
  }

  // Validación estricta de enlace
  if (!spotifyUrl || !spotifyUrl.includes('open.spotify.com/track')) {
    return conn.sendMessage(m.chat, {
        text: `🌸 *Falta un enlace real de Spotify, ${name}.*\n\nDebes enviar la URL de una canción (Track).\n> *Ejemplo:* ${usedPrefix + command} https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT`,
        contextInfo: {
            externalAdReply: {
                title: '🌸 ERIS SERVICE - SPOTIFY 🌸',
                body: `Esperando enlace válido...`,
                thumbnail: thumb, 
                sourceUrl: redes, 
                mediaType: 1
            }
        }
    }, { quoted: m });
  }

  await m.react("🕓");

  try {
    let audioUrl, title, artist, cover;

    // --- INTENTO 1: API RYZEN (Súper rápida para Spotify) ---
    try {
        const res1 = await axios.get(`https://api.ryzendesu.vip/api/downloader/spotify?url=${encodeURIComponent(spotifyUrl)}`);
        if (res1.data && res1.data.success) {
            audioUrl = res1.data.link;
            title = res1.data.metadata.title;
            artist = res1.data.metadata.artists;
            cover = res1.data.metadata.cover;
        } else throw new Error('Ryzen falló');
    } catch (e1) {
        // --- INTENTO 2: API CAUSAS (Tu API original) ---
        const { data: res2 } = await axios.get(`https://rest.apicausas.xyz/api/v1/descargas/spotify`, {
          params: { url: spotifyUrl, apikey: CAUSA_API_KEY }
        });
        if (res2.status && res2.data.download.url) {
            audioUrl = res2.data.download.url;
            title = res2.data.title;
            artist = res2.data.artist;
            cover = res2.data.thumbnail;
        } else throw new Error('Causas falló');
    }

    if (!audioUrl) throw new Error("No se pudo extraer el audio.");

    let caption = `╭─── [ 🎵 *SPOTIFY DL* ] ──···\n`;
    caption += `│ 🎶 *Título:* ${title}\n`;
    caption += `│ 👤 *Artista:* ${artist}\n`;
    caption += `╰─────────────────────────···\n\n`;
    caption += `> 🌸 *Procesando audio, por favor espera...*`;

    // Enviar tarjeta con la portada del álbum
    await conn.sendMessage(m.chat, {
      image: { url: cover },
      caption: caption,
      contextInfo: {
          externalAdReply: {
              title: `🌸 REPRODUCIENDO SPOTIFY 🌸`,
              body: `${title}`,
              thumbnail: thumb,
              mediaType: 1,
              sourceUrl: spotifyUrl
          }
      }
    }, { quoted: m });

    await m.react("🎧");

    // Descargar a Buffer
    const responseAudio = await axios.get(audioUrl, { responseType: 'arraybuffer' });
    const audioBuffer = Buffer.from(responseAudio.data);
    const fileSizeMb = audioBuffer.length / (1024 * 1024);

    // Enviar MP3
    if (fileSizeMb > SIZE_LIMIT_MB) {
        await conn.sendMessage(m.chat, {
            document: audioBuffer,
            fileName: `${title}.mp3`,
            mimetype: 'audio/mpeg',
            caption: `> 🌸 *Archivo pesado. Se envió como documento.*`
        }, { quoted: m });
        await m.react("📄");
    } else {
        await conn.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`
        }, { quoted: m });
        await m.react("✅");
    }

  } catch (e) {
    console.error("Error Spotify:", e.message);
    await m.react("❌");
    conn.reply(m.chat, `🌸 *Error:* No pude descargar la pista. Verifica que el enlace sea de una canción (no playlists ni podcasts).`, m);
  }
};

handler.help = ['spotify <url>'];
handler.tags = ['descargas'];
handler.command = ['spotify', 'sp'];
handler.register = false;

export default handler;
