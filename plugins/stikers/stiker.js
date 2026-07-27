/* 🌸 CREADOR DE STICKERS - ERIS-MD EDITION 🌸 */

import { sticker } from '../../lib/sticker.js';
import uploadFile from '../../lib/uploadFile.js';
import uploadImage from '../../lib/uploadImage.js';
import { webp2png } from '../../lib/webp2mp4.js';

let handler = async (m, { conn, args, usedPrefix, command }) => {
  let stiker = false;
  try {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || q.mediaType || '';
    
    // --- 1. PROCESAR MULTIMEDIA (IMAGEN/VIDEO) ---
    if (/webp|image|video/g.test(mime)) {
      if (/video/g.test(mime) && (q.msg || q).seconds > 15) {
        return m.reply(`> ꒰⚠️꒱ ¡El video es muy largo!\nNo puede durar más de 15 segundos. ✨`);
      }
      
      let img = await q.download?.();

      if (!img) {
        return conn.reply(m.chat, `> ꒰🌸꒱ Responde a una imagen, video o GIF con *${usedPrefix + command}* para crear el sticker.`, m);
      }

      let out;
      try {
        const packstickers = global.db.data.users[m.sender];
        const texto1 = packstickers?.text1 || `${global.packsticker || 'Eris-MD'}`;
        const texto2 = packstickers?.text2 || `${global.packsticker2 || 'Sticker'}`;

        stiker = await sticker(img, false, texto1, texto2);
      } catch (e) {
        console.error(e);
      } finally {
        if (!stiker) {
          if (/webp/g.test(mime)) out = await webp2png(img);
          else if (/image/g.test(mime)) out = await uploadImage(img);
          else if (/video/g.test(mime)) out = await uploadFile(img);
          if (typeof out !== 'string') out = await uploadImage(img);
          
          stiker = await sticker(false, out, global.packsticker || 'Eris-MD', global.packsticker2 || 'Sticker');
        }
      }
    } 
    // --- 2. PROCESAR POR URL ---
    else if (args[0]) {
      if (isUrl(args[0])) {
        stiker = await sticker(false, args[0], global.packsticker || 'Eris-MD', global.packsticker2 || 'Sticker');
      } else {
        return m.reply(`> ꒰❌꒱ El enlace proporcionado no es válido o no contiene imagen.`);
      }
    } 
    // --- 3. USO INCORRECTO ---
    else {
        return conn.reply(m.chat, `> ꒰🌸꒱ Responde a una imagen, video o GIF con *${usedPrefix + command}* para crear el sticker.`, m);
    }
  } catch (e) {
    console.error(e);
    if (!stiker) stiker = e;
  } finally {
    // --- 4. ENVÍO FINAL ---
    if (stiker && Buffer.isBuffer(stiker)) {
      await conn.sendFile(m.chat, stiker, 'sticker.webp', '', m);
    } else {
      console.log('Fallo interno al crear el sticker.');
    }
  }
};

handler.help = ['sticker'];
handler.tags = ['sticker'];
handler.command = ['s', 'sticker', 'stiker'];

export default handler;

const isUrl = (text) => {
  return text.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)(jpe?g|gif|png)/, 'gi'));
};
