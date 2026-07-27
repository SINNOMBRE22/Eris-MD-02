/* ERIS-MD ANIME SEARCHER - PERSONALIZADO */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter';
const newsletterName = 'Eris Service';
const redes = 'https://github.com/SINNOMBRE22/Eris-MD';

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const text = args.join(" ");
  if (!text) {
    return conn.reply(m.chat, `🌸 *¡Hola! Necesito el nombre de un anime para buscarlo por ti.*\n\n*Ejemplo:* ${usedPrefix + command} Solo Leveling`, m);
  }

  // Miniatura pequeña local (perfil2.jpeg)
  let thumb;
  try {
    const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg');
    thumb = fs.readFileSync(imgPath);
  } catch {
    thumb = Buffer.alloc(0); 
  }

  const name = await conn.getName(m.sender);

  try {
    await m.react('🕓');
    
    // Búsqueda de información técnica
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(text)}&limit=1`);
    const json = await res.json();

    if (!json.data || json.data.length === 0) {
      await m.react('❌');
      return conn.reply(m.chat, `🌸 *Lo siento, ${name}, no encontré nada bajo ese nombre.*`, m);
    }

    const anime = json.data[0];
    const title = anime.title;
    
    // Traducción de la sinopsis al español
    const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=es&dt=t&q=${encodeURIComponent(anime.synopsis || 'Sin descripción.')}`;
    const trRes = await fetch(translateUrl);
    const trJson = await trRes.json();
    const synopsisEs = trJson[0][0][0];

    // Link a la página principal sugerida
    const linkPrincipal = `https://www.animelatinohd.com/`;

    let caption = `🌸 *¡Aquí tienes la información, ${name}!* 🌸\n\n` +
                  `🎌 *Título:* ${title}\n` +
                  `⭐ *Puntuación:* ${anime.score || 'N/A'}\n` +
                  `📺 *Estado:* ${anime.status}\n\n` +
                  `📝 *Sinopsis:* ${synopsisEs.slice(0, 350)}...\n\n` +
                  `🚀 *¿Dónde verlo?* \n` +
                  `Puedes buscarlo directamente en **AnimeLatinoHD** para verlo doblado al español:\n` +
                  `🔗 ${linkPrincipal}\n\n` +
                  `> 💡 *Consejo de Eris:*  *Usa El Navegador Brave* Copia el nombre del anime y pégalo en el buscador de la página para ir a la segura.`;

    await conn.sendMessage(m.chat, {
        image: { url: anime.images.jpg.large_image_url },
        caption: caption.trim(),
        contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid,
                newsletterName,
                serverMessageId: -1
            },
            externalAdReply: {
                title: `🌸 ERIS - ANIME FINDER 🌸`,
                body: `Servicio de búsqueda para: ${name}`,
                thumbnail: thumb,
                mediaType: 1,
                renderLargerThumbnail: false, 
                sourceUrl: redes
            }
        }
      }, { quoted: m });

    await m.react('✅');

  } catch (e) {
    console.error(e);
    await m.react('❌');
    conn.reply(m.chat, `🌸 *Ups...* Hubo un problema con la base de datos de anime.`, m);
  }
};

handler.help = ['animesearch <nombre>'];
handler.command = ['animesearch', 'animes'];
handler.tags = ['buscadores'];

export default handler;
