/* 🌸 ERIS-MD · GET PLUGIN (solo owner) 🌸 */

import fs from 'fs'
import path from 'path'

const PLUGIN_DIR = path.join(process.cwd(), 'plugins')

// Buscar recursivamente. Devuelve { exactos: [], parciales: [] }
function buscarPlugin(dir, nombre) {
    const exactos = []
    const parciales = []
    let items
    try { items = fs.readdirSync(dir, { withFileTypes: true }) } catch { return { exactos, parciales } }

    for (const item of items) {
        const rutaCompleta = path.join(dir, item.name)
        if (item.isDirectory()) {
            const sub = buscarPlugin(rutaCompleta, nombre)
            exactos.push(...sub.exactos)
            parciales.push(...sub.parciales)
        } else if (item.isFile() && item.name.endsWith('.js')) {
            const base = item.name.replace(/\.js$/, '').toLowerCase()
            if (base === nombre) exactos.push(rutaCompleta)
            else if (base.includes(nombre)) parciales.push(rutaCompleta)
        }
    }
    return { exactos, parciales }
}

// Listar todos los .js de una categoría
function listarCategoria(categoria) {
    const dir = path.join(PLUGIN_DIR, categoria)
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return null
    return fs.readdirSync(dir).filter(f => f.endsWith('.js'))
}

// Listar todas las categorías con su cantidad
function listarCategorias() {
    let salida = ''
    let items
    try { items = fs.readdirSync(PLUGIN_DIR, { withFileTypes: true }) } catch { return 'Sin acceso a plugins/' }

    for (const item of items) {
        if (!item.isDirectory()) continue
        const ruta = path.join(PLUGIN_DIR, item.name)
        const cant = fs.readdirSync(ruta).filter(f => f.endsWith('.js')).length
        salida += `┊ ✧ ${item.name} (${cant})\n`
    }
    return salida || 'Sin categorías.'
}

// Enviar el archivo del plugin
async function enviarPlugin(conn, m, ruta) {
    const relativa = path.relative(process.cwd(), ruta)
    const contenido = fs.readFileSync(ruta)
    const peso = (contenido.length / 1024).toFixed(2)
    const lineas = contenido.toString('utf8').split('\n').length

    await conn.sendMessage(
        m.chat,
        {
            document: contenido,
            mimetype: 'application/javascript',
            fileName: path.basename(ruta),
            caption: `╭─── [ 📄 *PLUGIN* ] ──···\n│ 📁 *Ruta:* ${relativa}\n│ 📏 *Peso:* ${peso} KB\n│ 📝 *Líneas:* ${lineas}\n╰─────────────────────────···`
        },
        { quoted: m }
    )
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return conn.reply(
            m.chat,
            `🌸 *GET PLUGIN*\n\nEscribe el nombre del plugin que quieres obtener.\n\n📌 *Ejemplos:*\n${usedPrefix + command} ttp\n${usedPrefix + command} menus/menu.js\n${usedPrefix + command} menus  _(ver la categoría)_\n\n╭─❍「 📂 CATEGORÍAS 」\n${listarCategorias()}╰─────────────❍`,
            m
        )
    }

    let entrada = text.trim()

    // Seguridad: bloquear intentos de salir de la carpeta plugins
    if (entrada.includes('..') || path.isAbsolute(entrada)) {
        return conn.reply(m.chat, '⚠️ Ruta inválida.', m)
    }

    await m.react('🕓')

    try {
        // ── CASO 1: ruta directa tipo "menus/menu.js" o "menus/menu" ──
        if (entrada.includes('/') || entrada.includes('\\')) {
            let rel = entrada.replace(/\\/g, '/')
            if (!rel.endsWith('.js')) rel += '.js'
            const rutaDirecta = path.join(PLUGIN_DIR, rel)

            // Verificar que siga dentro de plugins/
            if (!rutaDirecta.startsWith(PLUGIN_DIR)) {
                await m.react('❌')
                return conn.reply(m.chat, '⚠️ Ruta fuera de plugins/.', m)
            }
            if (fs.existsSync(rutaDirecta) && fs.statSync(rutaDirecta).isFile()) {
                await enviarPlugin(conn, m, rutaDirecta)
                return await m.react('✅')
            }
            await m.react('❌')
            return conn.reply(m.chat, `⚠️ No existe *${rel}*.`, m)
        }

        // ── CASO 2: es el nombre de una categoría -> listar su contenido ──
        const archivosCat = listarCategoria(entrada)
        if (archivosCat) {
            const lista = archivosCat.map(f => `┊ ✧ ${f}`).join('\n')
            await m.react('✅')
            return conn.reply(
                m.chat,
                `╭─❍「 📂 ${entrada.toUpperCase()} 」\n${lista}\n╰─────────────❍\n\n💡 Pide uno con:\n${usedPrefix + command} ${entrada}/${archivosCat[0] || 'archivo.js'}`,
                m
            )
        }

        // ── CASO 3: nombre de plugin ──
        const nombre = entrada.toLowerCase().replace(/\.js$/, '')
        const { exactos, parciales } = buscarPlugin(PLUGIN_DIR, nombre)

        // Coincidencia exacta única -> enviar directo
        if (exactos.length === 1) {
            await enviarPlugin(conn, m, exactos[0])
            return await m.react('✅')
        }

        // Varias exactas (mismo nombre en distintas carpetas) -> mostrar rutas
        if (exactos.length > 1) {
            const lista = exactos.map(r => `┊ ✧ ${path.relative(PLUGIN_DIR, r)}`).join('\n')
            await m.react('✅')
            return conn.reply(
                m.chat,
                `🔍 *Hay varios "${nombre}.js":*\n\n╭─❍「 📄 RESULTADOS 」\n${lista}\n╰─────────────❍\n\n💡 Pide la ruta completa:\n${usedPrefix + command} ${path.relative(PLUGIN_DIR, exactos[0])}`,
                m
            )
        }

        // Sin exactas: si solo hay una parcial, enviarla
        if (parciales.length === 1) {
            await enviarPlugin(conn, m, parciales[0])
            return await m.react('✅')
        }

        // Varias parciales -> mostrar opciones
        if (parciales.length > 1) {
            const lista = parciales.map(r => `┊ ✧ ${path.relative(PLUGIN_DIR, r)}`).join('\n')
            await m.react('✅')
            return conn.reply(
                m.chat,
                `🔍 *Coincidencias para "${nombre}":*\n\n╭─❍「 📄 RESULTADOS 」\n${lista}\n╰─────────────❍\n\n💡 Pide la ruta completa:\n${usedPrefix + command} ${path.relative(PLUGIN_DIR, parciales[0])}`,
                m
            )
        }

        await m.react('❌')
        return conn.reply(m.chat, `⚠️ No encontré ningún plugin llamado *${nombre}*.`, m)

    } catch (e) {
        console.error('Error en getplugin:', e)
        await m.react('❌')
        conn.reply(m.chat, `🌸 *Error interno.* No pude leer el plugin.\n\`${e.message}\``, m)
    }
}

handler.help = ['getplugin <nombre>']
handler.tags = ['owner']
handler.command = ['getplugin', 'verplugin', 'gp']
handler.owner = true // Solo el owner puede usarlo

export default handler
