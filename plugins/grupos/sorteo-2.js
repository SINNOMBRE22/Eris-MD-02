/* 🌸 SORTEO INTERACTIVO 2.0 (AUTO-FIX) - ERIS-MD 🌸 */

import { readFileSync } from 'fs'
import path from 'path'

// memoria
global.sorteo2 = global.sorteo2 || {}

// 🔥 FUNCIÓN PARA LEER BOTONES (CLAVE DEL FIX)
function getTextFromMessage(m) {
    try {
        if (m.message?.buttonsResponseMessage)
            return m.message.buttonsResponseMessage.selectedButtonId

        if (m.message?.listResponseMessage)
            return m.message.listResponseMessage.singleSelectReply.selectedRowId

        if (m.message?.templateButtonReplyMessage)
            return m.message.templateButtonReplyMessage.selectedId

        if (m.message?.interactiveResponseMessage) {
            let json = m.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson
            let data = JSON.parse(json)
            return data.id || data.button_id
        }
    } catch {}

    return m.text
}

async function handler(m, { conn, text, usedPrefix, command }) {
    const chat = m.chat

    // 🔥 FIX: detectar botones aquí mismo
    let btn = getTextFromMessage(m)
    if (btn) {
        text = btn
        command = btn.replace(usedPrefix, '').trim().split(' ')[0]
    }

    const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
    let thumb = Buffer.alloc(0)
    try { thumb = readFileSync(imgPath) } catch {}

    // ==============================
    // 🎉 INICIAR SORTEO
    // ==============================
    if (command === 'sorteo2') {

        if (!text.includes('|')) {
            return conn.reply(chat, `> ꒰🌸꒱ Uso:\n${usedPrefix}sorteo2 Premio | 5`, m)
        }

        let [premio, cupo] = text.split('|').map(v => v.trim())
        cupo = parseInt(cupo)

        if (isNaN(cupo) || cupo <= 1) {
            return conn.reply(chat, `> ꒰🌸꒱ El cupo debe ser mayor a 1`, m)
        }

        global.sorteo2[chat] = {
            premio,
            cupo,
            participantes: [],
            status: 'open'
        }

        const txt = `> ꒰✨꒱ *SORTEO ACTIVO*

🎁 Premio: ${premio}
👥 Cupo: ${cupo}

Pulsa el botón o escribe:
${usedPrefix}unirme`

        await conn.sendMessage(chat, {
            text: txt,
            footer: 'ERIS-MD',
            interactiveButtons: [
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🎟️ PARTICIPAR",
                        id: `${usedPrefix}unirme`
                    })
                }
            ]
        }, { quoted: m })
    }

    // ==============================
    // 🎟️ UNIRSE
    // ==============================
    if (command === 'unirme') {

        let sorteo = global.sorteo2[chat]

        if (!sorteo || sorteo.status !== 'open') {
            return conn.reply(chat, '> ꒰🌸꒱ No hay sorteo activo.', m)
        }

        if (sorteo.participantes.includes(m.sender)) {
            return conn.reply(chat, `> ꒰🌸꒱ @${m.sender.split('@')[0]} ya estás dentro.`, m, {
                mentions: [m.sender]
            })
        }

        sorteo.participantes.push(m.sender)
        let restantes = sorteo.cupo - sorteo.participantes.length

        // ==============================
        // 📊 SIGUE ABIERTO
        // ==============================
        if (restantes > 0) {

            let lista = sorteo.participantes
                .map((v, i) => `${i + 1}. @${v.split('@')[0]}`)
                .join('\n')

            let msg = `> ꒰✅꒱ NUEVO PARTICIPANTE

👤 @${m.sender.split('@')[0]}

📋 Lista:
${lista}

Faltan ${restantes}`

            await conn.sendMessage(chat, {
                text: msg,
                mentions: sorteo.participantes,
                footer: 'ERIS-MD',
                interactiveButtons: [
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: "🎟️ PARTICIPAR",
                            id: `${usedPrefix}unirme`
                        })
                    }
                ]
            }, { quoted: m })

        } else {

            // ==============================
            // 🏆 FINAL
            // ==============================
            sorteo.status = 'closed'

            let winner = sorteo.participantes[
                Math.floor(Math.random() * sorteo.participantes.length)
            ]

            let finalMsg = `> ꒰🥳꒱ SORTEO FINALIZADO

🏆 Ganador: @${winner.split('@')[0]}
🎁 Premio: ${sorteo.premio}`

            await conn.sendMessage(chat, {
                text: finalMsg,
                mentions: [winner]
            }, { quoted: m })

            delete global.sorteo2[chat]
        }
    }
}

// config
handler.help = ['sorteo2']
handler.tags = ['grupos']
handler.command = ['sorteo2', 'unirme']
handler.group = true

export default handler
