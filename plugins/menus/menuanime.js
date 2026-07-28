import fs from 'fs'
import path from 'path'

const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

// ── Comandos agrupados por tipo/emoción ──
// Si agregas comandos nuevos al plugin anime, súmalos aquí en el grupo que quieras.
const grupos = [
    {
        titulo: '😢 TRISTE',
        cmds: ['cry', 'llorar', 'cringe', 'bully', 'bullying']
    },
    {
        titulo: '😊 FELIZ',
        cmds: ['happy', 'feliz', 'smile', 'sonreir', 'blush', 'sonrojarse', 'wink', 'dance', 'bailar']
    },
    {
        titulo: '🥰 CARIÑO',
        cmds: ['hug', 'abrazar', 'glomp', 'kiss', 'beso', 'muak', 'cuddle', 'acurrucarse',
               'pat', 'palmadita', 'handhold', 'mano', 'lick', 'lamer']
    },
    {
        titulo: '💥 ACCIÓN',
        cmds: ['slap', 'bofetada', 'kick', 'patear', 'patada', 'kill', 'matar',
               'bonk', 'palmada', 'yeet', 'bite', 'morder', 'poke', 'picar']
    },
    {
        titulo: '👋 SOCIAL',
        cmds: ['wave', 'saludar', 'ola', 'highfive', '5', 'smug', 'presumir', 'nom', 'comer']
    },
    {
        titulo: '🖼️ IMÁGENES',
        cmds: ['waifu', 'waifuh', 'neko', 'shinobu', 'megumin', 'awoo']
    }
]

const handler = async (m, { conn, usedPrefix }) => {
    try {
        // ── Nombre con fallback ──
        let name = 'Usuario'
        try { name = await conn.getName(m.sender) } catch {}

        // ── Miniatura ──
        let thumb = Buffer.alloc(0)
        try {
            const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
            thumb = fs.readFileSync(imgPath)
        } catch {}

        // ── Header tipo tarjeta (mismo estilo que el principal) ──
        const header = `╭━━━〔 🌸 ${toBoldUnicode('MENÚ ANIME')} 🌸 〕━━━⬣
┃ 🎀 *Interacciones y GIFs*
┃ 👑 *Dev:* SINNOMBRE22
┃ 💡 Menciona o responde a alguien
╰━━━━━━━━━━━━━━━━⬣

*Comandos Anime Disponibles* 👇`

        // ── Construir cada grupo con su cajita ──
        const cuerpo = grupos
            .map(g => {
                const lineas = g.cmds
                    .map(c => `┊ ✧ ${usedPrefix}${c}`)
                    .join('\n')
                return `╭─❍「 ${g.titulo} 」\n${lineas}\n╰─────────────❍`
            })
            .join('\n\n')

        const footer = `↩️ Usa ${usedPrefix}menu para el menú principal.`

        const readMore = String.fromCharCode(8206).repeat(1500)
        const texto = `${header}\n${readMore}\n${cuerpo}\n\n${footer}`.trim()

        await conn.sendMessage(m.chat, {
            text: texto,
            contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid,
                    newsletterName,
                    serverMessageId: -1
                },
                externalAdReply: {
                    title:                 `🌸 ${toBoldUnicode('MENÚ ANIME')} 🌸`,
                    body:                  `🌷Usuario: ${toBoldUnicode(name)}`,
                    thumbnail:             thumb,
                    mediaType:             1,
                    renderLargerThumbnail: true,
                    sourceUrl:             redes
                }
            }
        }, { quoted: m })

    } catch (e) {
        console.error('[menuanime] ERROR:', e.message)
        if (conn) conn.reply(m.chat, `❌ Error al generar el menú anime.\n\`${e.message}\``, m)
    }
}

handler.help    = ['menuanime']
handler.tags    = ['info']
handler.command = /^(menuanime|animemenu|menu2)$/i

export default handler

// ── Helper ──
function toBoldUnicode(text) {
    if (!text) return ''
    const fonts = {
        A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',
        K:'𝗞',L:'𝗟',M:'𝗠',N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',
        U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭',
        a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',
        k:'𝗸',l:'𝗹',m:'𝗺',n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',
        u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇',
        0:'𝟬',1:'𝟭',2:'𝟮',3:'𝟯',4:'𝟰',5:'𝟱',6:'𝟲',7:'𝟳',8:'𝟴',9:'𝟵'
    }
    return String(text).split('').map(c => fonts[c] ?? c).join('')
}
