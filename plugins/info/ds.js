/*
import { promises as fs } from 'fs'
import path from 'path'

var handler = async (m, { conn }) => {
    // 🌸 MINIATURA: RUTA DE TU PERFIL
    let thumb
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
        thumb = fs.readFileSync(imgPath)
    } catch {
        thumb = Buffer.alloc(0)
    }

    if (global.conn.user.jid !== conn.user.jid) {
        return m.reply(`✦ *AVISO DEL SISTEMA*\n\n✧ Restricción:\n➤ Utiliza este comando directamente en el número principal del Bot.`)
    }

    // 🚀 RUTA AJUSTADA A TU SERVIDOR: sesionEris
    let sessionPath = path.join(process.cwd(), 'sesionEris')

    try {
        let files = await fs.readdir(sessionPath)
        let filesDeleted = 0
        let chatId = m.isGroup ? [m.chat, m.sender] : [m.sender]
        
        for (let file of files) {
            for (let id of chatId) {
                // Filtramos para no borrar el archivo maestro creds.json
                if (file.includes(id.split('@')[0]) && file !== 'creds.json') {
                    await fs.unlink(path.join(sessionPath, file))
                    filesDeleted++
                    break
                }
            }
        }

        if (filesDeleted === 0) {
            return m.reply(`✦ *LIMPIEZA DE SESIÓN*\n\n✧ Estado:\n➤ No se encontraron archivos temporales para este chat en: /sesionEris`)
        }

        const textMessage = `
✦ *SESIÓN OPTIMIZADA*

✧ Archivos eliminados:
➤ ${filesDeleted} archivos.

        await conn.sendMessage(m.chat, { 
            text: textMessage, 
            contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363407502496951@newsletter',
                    newsletterName: '✨ Eris-MD Oficial',
                },
                externalAdReply: {
                    title: '🌸 ERIS-MD: SESSION FIXER 🌸',
                    body: 'Mantenimiento ERIS-MD',
                    thumbnail: thumb,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m })

    } catch (err) {
        console.error('🌸❌ Error en DS:', err)
        m.reply(`✦ *ERROR TÉCNICO*\n\n✧ Detalles:\n➤ No se pudo leer la carpeta /sesionEris. Verifica los permisos en Ubuntu.`)
    }
}

handler.help = ['ds', 'fixmsgespera']
handler.tags = ['group']
handler.command = ['fixmsgespera', 'ds']

export default handler
*/

/* 🌸 FIX DEFINITIVO: ds.js - ERIS-MD 🌸 */

import { promises as fs, readFileSync, existsSync } from 'fs'
import path from 'path'

var handler = async (m, { conn }) => {
    // 🌸 FIX IMAGEN: Usamos readFileSync directo
    let thumb
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
        if (existsSync(imgPath)) {
            thumb = readFileSync(imgPath)
        } else {
            thumb = Buffer.alloc(0)
        }
    } catch {
        thumb = Buffer.alloc(0)
    }

    if (global.conn.user.jid !== conn.user.jid) {
        return m.reply(`✦ *AVISO DEL SISTEMA*\n\n✧ Restricción:\n➤ Utiliza este comando directamente en el número principal del Bot.`)
    }

    let sessionPath = path.join(process.cwd(), 'sesionEris')

    try {
        let files = await fs.readdir(sessionPath)
        let filesDeleted = 0
        let chatId = m.isGroup ? [m.chat, m.sender] : [m.sender]

        for (let file of files) {
            for (let id of chatId) {
                if (file.includes(id.split('@')[0]) && file !== 'creds.json') {
                    await fs.unlink(path.join(sessionPath, file))
                    filesDeleted++
                    break
                }
            }
        }

        if (filesDeleted === 0) {
            return m.reply(`✦ *LIMPIEZA DE SESIÓN*\n\n✧ Estado:\n➤ No se encontraron archivos temporales para este chat en: /sesionEris`)
        }

        // ✅ AQUÍ ESTABA EL ERROR: Ya cerramos el texto correctamente
        const textMessage = `
✦ *SESIÓN OPTIMIZADA*

✧ Archivos eliminados:
➤ ${filesDeleted} archivos.`.trim()

        await conn.sendMessage(m.chat, {
            text: textMessage,
            contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363407502496951@newsletter',
                    newsletterName: '✨ Eris-MD Oficial',
                },
                externalAdReply: {
                    title: '🌸 ERIS-MD: SESSION FIXER 🌸',
                    body: 'Mantenimiento ERIS-MD',
                    thumbnail: thumb,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m })

    } catch (err) {
        console.error('🌸❌ Error en DS:', err)
        m.reply(`✦ *ERROR TÉCNICO*\n\n✧ Detalles:\n➤ No se pudo leer la carpeta /sesionEris.`)
    }
}

handler.help = ['ds']
handler.tags = ['info', 'grupos']
handler.command = ['ds']

export default handler

