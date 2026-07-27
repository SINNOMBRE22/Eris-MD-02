import fetch from 'node-fetch';
import fs from 'fs';

const handler = async (m, { conn, usedPrefix, command, args, text }) => {
  const q = m.quoted ? m.quoted : m;
  const mime = (q.msg || q).mimetype || '';

  if (!mime) throw `*⚠️ Responde a una imagen o video para cambiar su peso.*`;
  if (!text) throw `*⚠️ Ingresa el nuevo tamaño en bytes.*\n\n*Ejemplo:* ${usedPrefix + command} 9999999`;
  if (isNaN(text)) throw `*⚠️ El valor debe ser numérico.*`;

  await m.reply('*⌛ Procesando y alterando peso...*');

  try {
    // Descargamos el contenido directamente a un Buffer
    const media = await q.download();

    const caption = `✅ *Tamaño Ajustado Correctamente*\n\n*➤ Peso visual:* ${text} bytes\n*➤ Aplicado por:* @${m.sender.split('@')[0]}`;

    if (/image\/(jpe?g|png)/.test(mime)) {
      await conn.sendMessage(m.chat, { 
        image: media, // Enviamos el buffer directamente
        caption: caption, 
        fileLength: text, // Aquí aplicamos el peso falso
        mentions: [m.sender] 
      }, { quoted: m });

    } else if (/video/.test(mime)) {
      await conn.sendMessage(m.chat, { 
        video: media, // Enviamos el buffer directamente
        caption: caption, 
        fileLength: text, // Aquí aplicamos el peso falso
        mentions: [m.sender] 
      }, { quoted: m });
    }
  } catch (e) {
    console.error(e);
    m.reply('*❌ Error: No se pudo procesar el archivo. Asegúrate de que el bot tenga permisos de escritura.*');
  }
};

handler.tags = ['tools'];
handler.help = ['tamaño <cantidad>'];
handler.command = /^(length|filelength|edittamaño|totamaño|tamaño)$/i;

export default handler;
