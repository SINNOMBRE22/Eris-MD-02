/* ERIS-MD TERABOX DOWNLOADER */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

// --- DATOS DE ERIS ---
const newsletterJid = '120363407502496951@newsletter';
const newsletterName = 'Eris Service';
const redes = 'https://github.com/SINNOMBRE22/Eris-MD';

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const name = m.pushName || (await conn.getName(m.sender)) || "Usuario";

  // Cargar miniatura oficial de Eris
  let thumb;
  try {
    const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg');
    thumb = fs.readFileSync(imgPath);
  } catch {
    thumb = Buffer.alloc(0);
  }

  // --- AYUDA VISUAL ---
  if (!text || !text.includes('terabox')) {
    return conn.sendMessage(m.chat, {
        text: `🌸 *Falta el enlace de Terabox, ${name}.*\n\nIndica la URL del archivo para iniciar la extracción.\n> *Ejemplo:* ${usedPrefix + command} https://teraboxapp.com/s/1xyz...`,
        contextInfo: {
            mentionedJid: [m.sender],
            isForwarded: true,
            forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 },
            externalAdReply: {
                title: '🌸 ERIS SERVICE - TERABOX 🌸',
                body: `Esperando enlace...`,
                thumbnail: thumb, 
                sourceUrl: redes, 
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
    }, { quoted: m });
  }

  await m.react('🕓');

  try {
    // 1. Llamada al Scraper de Terabox
    const result = await terabox(text);

    if (!result || result.length === 0) {
      await m.react('❌');
      return conn.reply(m.chat, `🌸 *Sin resultados:* No encontré archivos válidos en ese enlace, o requiere contraseña.`, m);
    }

    // 2. Notificación de inicio
    await conn.reply(m.chat, `🌸 *Terabox Localizado:* Encontré ${result.length} archivo(s). Iniciando descarga...`, m);

    // 3. Límite de seguridad: máximo 3 archivos por link para no saturar el VPS
    const limit = Math.min(result.length, 3); 

    for (let i = 0; i < limit; i++) {
      const { fileName, url } = result[i];

      if (!fileName || !url) continue;

      let caption = `╭─── [ ☁️ *TERABOX DL* ] ──···\n`;
      caption += `│ 📄 *Archivo:* ${fileName}\n`;
      caption += `╰─────────────────────────···\n\n`;
      caption += `> 🌸 *Contenido entregado por Eris Service.*`;

      try {
        // Enviar como documento (más seguro para archivos grandes de Terabox)
        await conn.sendMessage(m.chat, {
            document: { url: url },
            mimetype: 'application/octet-stream',
            fileName: fileName,
            caption: caption
        }, { quoted: m });
        
        await m.react('✅');
      } catch (fileSendError) {
        console.error(`Error enviando ${fileName}:`, fileSendError.message);
        await conn.reply(m.chat, `⚠️ *Aviso:* El archivo "${fileName}" es demasiado pesado para enviarse por WhatsApp.`, m);
      }
    }

    if (result.length > 3) {
        await conn.reply(m.chat, `🌸 *Aviso:* Se omitieron ${result.length - 3} archivos para evitar saturar el servidor.`, m);
    }

  } catch (err) {
    console.error('Error Terabox:', err.message);
    await m.react('❌');
    conn.reply(m.chat, `🌸 *Error:* Los servidores de Terabox están saturados o el enlace expiró. Intenta más tarde.`, m);
  }
};

handler.help = ["terabox <url>"];
handler.tags = ["descargas"];
handler.command = ['terabox', 'tb'];
handler.register = false;

export default handler;

// --- Funciones Auxiliares del Scraper ---
async function terabox(url) {
  return new Promise(async (resolve, reject) => {
    try {
      const response1 = await axios.post('https://teradl-api.dapuntaratya.com/generate_file', {
        mode: 1,
        url: url
      });

      const data1 = response1.data;
      if (!data1.list || data1.list.length === 0) return reject(new Error('Vacio'));

      const array = [];
      for (const x of data1.list) {
        try {
          const response2 = await axios.post('https://teradl-api.dapuntaratya.com/generate_link', {
            js_token: data1.js_token,
            cookie: data1.cookie,
            sign: data1.sign,
            timestamp: data1.timestamp,
            shareid: data1.shareid,
            uk: data1.uk,
            fs_id: x.fs_id
          });

          const dl = response2.data;
          if (dl.download_link && dl.download_link.url_1) {
            array.push({
              fileName: x.name,
              type: x.type,
              url: dl.download_link.url_1
            });
          }
        } catch (innerError) {
          console.error(`Fallo enlace Terabox:`, innerError.message);
        }
      }
      resolve(array);
    } catch (e) {
      reject(new Error(`API Fallida`));
    }
  });
}
