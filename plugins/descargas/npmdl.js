/* ERIS-MD NPM PACKAGE DOWNLOADER */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter';
const newsletterName = 'Eris Service';
const redes = 'https://github.com/SINNOMBRE22/Eris-MD';

let handler = async (m, { conn, text, usedPrefix, command }) => {
  
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
    const helpText = `🌸 *Falta el paquete, ${name}.*\n\nNecesito el nombre del paquete NPM y su versión (opcional).\n> *Ejemplo:* ${usedPrefix + command} axios,1.6.0`;
    
    return conn.sendMessage(m.chat, {
      text: helpText,
      contextInfo: {
        mentionedJid: [m.sender],
        isForwarded: true,
        forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 },
        externalAdReply: {
          title: `🌸 ERIS SERVICE - NPM DL 🌸`,
          body: `Hola ${name}, indica un paquete.`,
          thumbnail: thumb,
          mediaType: 1,
          renderLargerThumbnail: false,
          sourceUrl: redes
        }
      }
    }, { quoted: m });
  }

  await m.react('🕓');

  const [pkgName, version] = text.split(",");
  const pkg = pkgName.trim();
  const pkgver = (version || 'latest').trim();

  try {
    // Ejecución del comando NPM PACK
    const filePath = await new Promise((resolve, reject) => {
      exec(`npm pack ${pkg}@${pkgver}`, (error, stdout) => {
        if (error) {
          const errMsg = error.message.includes('E404') ? 
            `El paquete "${pkg}" no existe.` : `Error al empaquetar.`;
          reject(new Error(errMsg));
          return;
        }
        resolve(stdout.trim());
      });
    });

    const fileName = path.basename(filePath);
    const data = await fs.promises.readFile(filePath);
    const npmLink = `https://www.npmjs.com/package/${pkg}${pkgver === 'latest' ? '' : '/v/' + pkgver}`;

    let caption = `╭─── [ 📦 *NPM DOWNLOADER* ] ──···\n`;
    caption += `│ 📦 *Paquete:* ${fileName}\n`;
    caption += `│ 🔢 *Versión:* ${pkgver}\n`;
    caption += `│ 🔗 *Link:* ${npmLink}\n`;
    caption += `╰─────────────────────────···\n\n`;
    caption += `> 🌸 *Archivo entregado por Eris Service.*`;

    // Enviamos el archivo
    await conn.sendMessage(m.chat, {
      document: data,
      mimetype: "application/gzip",
      fileName: fileName,
      caption: caption,
      contextInfo: {
        externalAdReply: {
          title: `🌸 PAQUETE ASEGURADO 🌸`,
          body: fileName,
          thumbnail: thumb,
          mediaType: 1,
          sourceUrl: npmLink
        }
      }
    }, { quoted: m });

    // Limpieza de rastro en el VPS
    if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
    await m.react('✅');

  } catch (err) {
    console.error(`Error NPM DL: ${err.message}`);
    await m.react('❌');
    conn.reply(m.chat, `🌸 *Error:* ${err.message}`, m);
  }
};

handler.help = ["npmdl <nombre,versión>"];
handler.tags = ["descargas"];
handler.command = ["npmdl", "npmdownload", "npmd"];
handler.register = false;

export default handler;
