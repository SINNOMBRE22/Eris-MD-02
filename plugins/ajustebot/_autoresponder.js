/* 🌸 AUTO-RESPONDER (ERIS AI - HUMAN VIBE) - ERIS-MD SYSTEM 🌸 */

import fetch from 'node-fetch'

const GROQ_API_KEY = "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"

let handler = m => m
handler.all = async function (m) {
    const conn = this
    let mText = m.text || ''

    if (!mText || m.fromMe || m.id.startsWith('BAE5') || m.sender.includes('bot')) return true

    const botCoreNum = conn.user.jid.split(':')[0].split('@')[0].slice(-10)
    const isPrivate = !m.isGroup
    const isCreator = m.sender.includes('525629885039') || (global.owner && global.owner.some(o => m.sender.includes(o[0])))
    
    const isMentioned = m.mentionedJid && m.mentionedJid.some(jid => jid.includes(botCoreNum)) || mText.includes(botCoreNum)
    const isQuoted = m.quoted && m.quoted.sender && m.quoted.sender.includes(botCoreNum)
    const isNameMentioned = /eris/i.test(mText)

    if (isPrivate || isMentioned || isQuoted || isNameMentioned) {
        if (/^[./!#>$]/.test(mText) || /menu|estado|bots|serbot|audio|video|sticker/i.test(mText)) return true

        let userName = m.pushName || 'tú'
        await conn.sendPresenceUpdate('composing', m.chat)

        async function fetchGroq(q, systemPrompt) {
            try {
                const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${GROQ_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "llama-3.1-8b-instant",
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: q }
                        ],
                        temperature: 0.9, 
                        max_tokens: 400
                    })
                })
                const data = await res.json()
                return data?.choices?.[0]?.message?.content || null
            } catch (e) { return null }
        }

        // 🧠 PROMPT: CHICA REAL, CERO ROBOT
        let personality = `Eres Eris. Actúa como una chava de México, auténtica, inteligente y con humor negro. 
No eres un asistente, eres Eris. Punto.
Estilo de chat: No uses mayúsculas iniciales en todo, no uses puntuación perfecta. Habla como si estuvieras apurada. Sé sarcástica ("mamona") pero chida.
Identidad: No andes diciendo "soy la IA de Eris-MD" ni "mi creador es SinNombre" a cada rato. Eso aburre. Solo dilo si te preguntan directamente quién te hizo o qué eres.
[CONTEXTO]: ${isCreator 
    ? "Hablas con SinNombre. Es tu creador y el único que te cae bien de verdad. Sé relajada, bromea con él, dile 'jefe' o 'creador' solo si quieres molestarlo, pero trátalo con confianza absoluta." 
    : `Hablas con ${userName}. Sé un poco cortante pero ingeniosa. Si se pone pesado, ignóralo o dale una respuesta seca. Si es buena onda, platica normal.`}`

        let query = mText.replace(/eris-md|eris/ig, '').trim() || (isCreator ? "qué onda" : "hola")

        let result = await fetchGroq(query, personality)

        if (result) {
            const forbiddenPattern = /[>$#\\]/g
            let cleanedResult = result.replace(forbiddenPattern, '').trim()
            
            // BORRAR CLICHÉS DE IA (Doble filtro)
            cleanedResult = cleanedResult.replace(/soy una inteligencia artificial|como modelo de lenguaje|¿en qué puedo ayudarte\?|hola,|claro,|por supuesto/gi, '')

            await conn.sendMessage(m.chat, { text: cleanedResult.trim() }, { quoted: m })
        }
    }
    return true
}

export default handler
