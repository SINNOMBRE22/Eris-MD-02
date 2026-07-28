import fs from 'fs'
import path from 'path'

const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

// ── Categorías que NO se muestran en el menú principal (tienen su propio menú) ──
const hiddenTags = ['anime']

// ── Sub-menús disponibles (para que el usuario sepa que existen) ──
const subMenus = [
    { cmd: 'menuanime', emoji: '🌸', desc: 'Interacciones anime' }
]

// ── Emojis por categoría (fallback: 📌) ──
const tagEmojis = {
    admins:         '⚙️',
    anime:          '🌸',
    buscadores:     '🔎',
    convertidores:  '🔁',
    descargas:      '📥',
    grupos:         '👥',
    info:           'ℹ️',
    netfree:        '🌐',
    nsfw:           '🔞',
    owner:          '👑',
    sticker:        '🎨',
    tools:          '🛠️'
}

const handler = async (m, { conn, usedPrefix }) => {
    try {
        if (!global.plugins) {
            console.error('[menu] ERROR: global.plugins no está definido')
            return conn.reply(m.chat, '❌ global.plugins no está disponible.', m)
        }

        // ── Cargar nombre con fallback seguro ──
        let name = 'Usuario'
        try { name = await conn.getName(m.sender) } catch (e) {
            console.warn('[menu] getName falló:', e.message)
        }

        // ── Cargar miniatura ──
        let thumb = Buffer.alloc(0)
        try {
            const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
            thumb = fs.readFileSync(imgPath)
        } catch (e) {
            console.warn('[menu] Miniatura no encontrada:', e.message)
        }

        const muptime      = formatUptime(process.uptime())
        const ram          = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
        const totalPlugins = Object.keys(global.plugins).length

        // ── Header tipo tarjeta ──
        const headerInfo = `╭━━━〔 ✌️ ${toBoldUnicode('ERIS - MD')} ✌️ 〕━━━⬣
┃ 🎀 *RAM:* ${ram} MB
┃ 💞 *Activo:* ${muptime}
┃ 🧩 *Plugins:* ${totalPlugins}
┃ 👑 *Dev:* SINNOMBRE22
┃ 📱 wa.me/5215629885039
╰━━━━━━━━━━━━━━━━⬣

*Mis Comandos Disponibles* 👇`

        // ── Sección de sub-menús ──
        const subMenuSection = subMenus.length
            ? `╭─❍「 📚 MENÚS 」\n` +
              subMenus.map(s => `┊ ✧ ${usedPrefix}${s.cmd} ${s.emoji} ${s.desc}`).join('\n') +
              `\n╰─────────────❍`
            : ''

        // ── Construir lista de comandos (excluyendo categorías ocultas) ──
        const pluginList = Object.values(global.plugins)

        const withHelp = pluginList.filter(p => !p.disabled && p.help && p.tags)

        const help = withHelp.map(p => ({
            help:   Array.isArray(p.help) ? p.help  : [p.help],
            tags:   Array.isArray(p.tags) ? p.tags  : [p.tags],
            prefix: 'customPrefix' in p
        }))

        // Filtrar las categorías ocultas
        const categories = [...new Set(help.flatMap(p => p.tags))]
            .filter(tag => !hiddenTags.includes(tag.toLowerCase()))
            .sort()

        const menuList = categories
            .map(tag => {
                const commands = help
                    .filter(p => p.tags.includes(tag))
                    .flatMap(p =>
                        p.help.map(h =>
                            `┊ ✧ ${p.prefix ? h : usedPrefix + h}`
                        )
                    )
                    .join('\n')

                if (!commands) return ''
                const emoji = tagEmojis[tag.toLowerCase()] ?? '📌'
                return `╭─❍「 ${emoji} ${tag.toUpperCase()} 」\n${commands}\n╰─────────────❍`
            })
            .filter(Boolean)
            .join('\n\n')

        const footer = `💖 Paz y Amor ✌️`

        const readMore = String.fromCharCode(8206).repeat(1500)
        const menuText = `${headerInfo}\n${readMore}\n${subMenuSection}\n\n${menuList}\n\n${footer}`.trim()

        await conn.sendMessage(m.chat, {
            text: menuText,
            contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid,
                    newsletterName,
                    serverMessageId: -1
                },
                externalAdReply: {
                    title:                 `🌸 ¡Hola! Soy ${toBoldUnicode('ERIS - MD')} 🌸`,
                    body:                  `🌷Usuario: ${toBoldUnicode(name)}`,
                    thumbnail:             thumb,
                    mediaType:             1,
                    renderLargerThumbnail: true,
                    sourceUrl:             redes
                }
            }
        }, { quoted: m })

    } catch (e) {
        console.error('[menu] ERROR COMPLETO:')
        console.error('  Mensaje:', e.message)
        console.error('  Stack:', e.stack)
        if (conn) conn.reply(m.chat, `❌ Error al generar el menú.\n\`${e.message}\``, m)
    }
}

handler.help    = ['menu']
handler.tags    = ['info']
handler.command = /^(menu|help|comandos|commands|cmd|cmds)$/i

export default handler

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return `${h}h ${m}m ${s}s`
}

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
