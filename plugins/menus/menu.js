import fs from 'fs'
import path from 'path'

const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

const handler = async (m, { conn, usedPrefix }) => {
    try {
        // ── DEBUG: verificar que global.plugins existe ──
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

        const styles = {
            header: '╾╾╾╾ ⌬ @category ⌬ ╾╾╾╾',
            body:   '›  @cmd'
        }

        const muptime      = formatUptime(process.uptime())
        const ram          = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
        const totalPlugins = Object.keys(global.plugins).length

        const headerInfo = `💖✌️ (Paz y Amor ✌️💖)

┣🎀 *RAM:* ${ram} MB
┣💞 *Live:* ${muptime}

--- 📂 *INFO* ---
🧩 Plugins: ${totalPlugins}

━━━━━━━━━━━━━━
👑 Dev: SINNOMBRE22
📱 wa.me/5215629885039

*Mis Comandos Disponibles*`

        // ── Construir lista de comandos ──
        const pluginList = Object.values(global.plugins)

        // DEBUG: mostrar cuántos plugins tienen help y tags
        const withHelp = pluginList.filter(p => !p.disabled && p.help && p.tags)
        console.log(`[menu] Plugins totales: ${pluginList.length} | Con help+tags: ${withHelp.length}`)

        const help = withHelp.map(p => ({
            help:   Array.isArray(p.help) ? p.help  : [p.help],
            tags:   Array.isArray(p.tags) ? p.tags  : [p.tags],
            prefix: 'customPrefix' in p
        }))

        const categories = [...new Set(help.flatMap(p => p.tags))].sort()
        console.log('[menu] Categorías:', categories)

        const menuList = categories
            .map(tag => {
                const commands = help
                    .filter(p => p.tags.includes(tag))
                    .flatMap(p =>
                        p.help.map(h =>
                            styles.body.replace('@cmd', p.prefix ? h : usedPrefix + h)
                        )
                    )
                    .join('\n')

                if (!commands) return ''
                return `${styles.header.replace('@category', tag.toUpperCase())}\n${commands}`
            })
            .filter(Boolean)
            .join('\n\n')

        const readMore = String.fromCharCode(8206).repeat(1500)
        const menuText = `${headerInfo}\n${readMore}\n${menuList}`.trim()

        console.log('[menu] Texto generado, largo:', menuText.length)

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

        console.log('[menu] Mensaje enviado correctamente')

    } catch (e) {
        // ── Log completo del error real ──
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
