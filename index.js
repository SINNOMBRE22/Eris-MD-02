process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './settings.js'
import { watchFile, unwatchFile } from 'fs'
import { createRequire } from 'module'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import * as ws from 'ws'
import fs, { readdirSync, statSync, unlinkSync, existsSync, mkdirSync, readFileSync, watch } from 'fs'
import yargs from 'yargs'
import { spawn } from 'child_process'
import lodash from 'lodash'
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import { format } from 'util'
import pino from 'pino'
import path, { join } from 'path'
import { Boom } from '@hapi/boom'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import { Low, JSONFile } from 'lowdb'
import store from './lib/store.js'
import readline from 'readline'
import qrcode from 'qrcode-terminal'
import NodeCache from 'node-cache'

const _bNS = await import('@whiskeysockets/baileys')
const _b = _bNS.proto ? _bNS : (_bNS.default?.proto ? _bNS.default : _bNS)
const { proto } = _b
import pkg from 'google-libphonenumber'
const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()

const {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    jidNormalizedUser
} = _bNS.DisconnectReason ? _bNS : (_bNS.default?.DisconnectReason ? _bNS.default : _bNS)

const { chain } = lodash

// --- CONFIGURACIÓN GLOBAL ---
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp('^[#/!.]')
global.timestamp = { start: new Date() }
const sessionFolder = global.ErisSessions || 'session'

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
    return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString()
}
global.__dirname = function dirname(pathURL) {
    return path.dirname(global.__filename(pathURL, true))
}
const __dirname = global.__dirname(import.meta.url)

// --- PRESENTACIÓN INICIAL ---
console.log(chalk.bold.magenta('\n╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮'))
console.log(chalk.bold.white('  🚀 INICIALIZANDO NÚCLEO DE ERIS...  '))
console.log(chalk.bold.magenta('╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n'))

// --- BASE DE DATOS + BAILEYS VERSION EN PARALELO ---
// Asegura que existan las carpetas requeridas antes de arrancar
// (evita que lowdb crashee al primer inicio si ./src/database no existe)
for (const dir of ['./src/database', './tmp']) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

global.db = new Low(new JSONFile('./src/database/database.json'))
global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) return
    global.db.READ = true
    await global.db.read().catch(console.error)
    global.db.READ = null
    global.db.data = {
        users: {}, chats: {}, stats: {}, msgs: {},
        sticker: {}, settings: {},
        ...(global.db.data || {})
    }
    global.db.chain = chain(global.db.data)
}

// ─────────────────────────────────────────────────────────────
//  VERSIÓN DE WHATSAPP WEB
//  Baileys trae una versión fija que WhatsApp ya rechaza (error 405).
//  Si algún día vuelve a fallar con 405, actualiza este número
//  con el que aparezca en: https://wppconnect.io/whatsapp-versions/
//  (toma solo el último bloque: 2.3000.XXXXXXXXXX -> XXXXXXXXXX)
// ─────────────────────────────────────────────────────────────
const WA_VERSION = [2, 3000, 1043986535]

// Carga en paralelo: DB + credenciales
const [, { state, saveCreds }] = await Promise.all([
    loadDatabase(),
    useMultiFileAuthState(sessionFolder)
])

// Intentamos la versión oficial; si falla o está deprecada, usamos la fija
let version = WA_VERSION
try {
    const latest = await fetchLatestBaileysVersion()
    // Solo la usamos si es más nueva que la nuestra
    if (latest?.version && latest.version[2] > WA_VERSION[2]) {
        version = latest.version
    }
} catch {
    // Sin conexión al servicio de versiones: seguimos con la fija
}

console.log(chalk.green('✓ Base de datos cargada correctamente.\n'))

protoType()
serialize()

// --- PLUGINS ---
const pluginFolder = path.join(__dirname, './plugins')
global.plugins = {}

async function filesInit(folder = pluginFolder) {
    if (!existsSync(folder)) mkdirSync(folder, { recursive: true })
    const entries = readdirSync(folder)
    await Promise.all(entries.map(async filename => {
        const filePath = join(folder, filename)
        if (statSync(filePath).isDirectory()) {
            await filesInit(filePath)
        } else if (filename.endsWith('.js')) {
            try {
                const fileURL = pathToFileURL(filePath).href
                const module = await import(`${fileURL}?update=${Date.now()}`)
                const name = path.relative(pluginFolder, filePath).replace(/\\/g, '/')
                global.plugins[name] = module.default || module
            } catch (e) {
                console.error(
                    chalk.bgRed.white(' ❌ ERROR PLUGIN ') +
                    chalk.redBright(` Fallo al cargar: ${filename}\n`), e
                )
            }
        }
    }))
}

// --- OPCIÓN DE CONEXIÓN ---
let opcionConexion = ''
if (!state.creds.registered) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))

    console.log(chalk.bold.cyan('╭━ ⚙️  MÉTODO DE CONEXIÓN ━━━━━━━━━━━━━━━━━╮'))
    console.log(chalk.white('    1. Escanear Código QR                  '))
    console.log(chalk.white('    2. Código de 8 dígitos (Recomendado)   '))
    console.log(chalk.bold.cyan('╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n'))

    opcionConexion = await question(chalk.yellowBright('➪ Escribe 1 o 2: '))
    rl.close()
}

// --- SOCKET ---
const connectionOptions = {
    logger: pino({ level: 'silent' }),
    // printQRInTerminal fue deprecado: el QR se dibuja a mano en connectionUpdate
    browser: ['Mac OS', 'Safari', '16.5'],
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
    },
    version,
    getMessage: async (clave) => {
        let jid = jidNormalizedUser(clave.remoteJid)
        let msg = await store.loadMessage(jid, clave.id)
        return msg?.message || ''
    }
}

global.conn = makeWASocket(connectionOptions)

// --- MANEJADOR DE CONEXIÓN ---
async function connectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update

    // Dibujar el QR a mano (printQRInTerminal ya no existe en Baileys)
    if (qr && opcionConexion === '1') {
        console.log(chalk.bold.cyan('\n╭━ 📱 ESCANEA ESTE CÓDIGO QR ━━━━━━━━━╮\n'))
        qrcode.generate(qr, { small: true })
        console.log(chalk.bold.cyan('╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯'))
        console.log(chalk.yellowBright('WhatsApp → Dispositivos vinculados → Vincular dispositivo\n'))
    }

    if (connection === 'open') {
        console.log(chalk.bold.green('\n╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮'))
        console.log(chalk.bold.white('  ❀ Eris-Bot Conectado Exitosamente ❀  '))
        console.log(chalk.bold.green('╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n'))
    }
    if (connection === 'close') {
        const boom = new Boom(lastDisconnect?.error)
        const reason = boom?.output?.statusCode

        // Diagnóstico: mostrar el motivo real del cierre
        const motivos = {
            401: 'Sesión inválida / dispositivo eliminado',
            403: 'Número baneado por WhatsApp',
            405: 'Método no permitido (versión rechazada)',
            408: 'Tiempo de espera agotado',
            411: 'Conflicto de multi-dispositivo',
            428: 'Conexión cerrada por WhatsApp',
            440: 'Sesión reemplazada (¿otra instancia con el mismo número?)',
            500: 'Sesión corrupta (borra la carpeta de sesión)',
            503: 'Servicio de WhatsApp no disponible',
            515: 'Reinicio requerido (normal tras vincular)'
        }
        console.log(
            chalk.gray(`   [diagnóstico] código: ${reason ?? 'desconocido'} — ${motivos[reason] || lastDisconnect?.error?.message || 'sin detalle'}`)
        )

        if (reason !== DisconnectReason.loggedOut) {
            console.log(
                chalk.bgYellow.black.bold('\n ⚠️ ALERTA ') +
                chalk.yellowBright(' Conexión cerrada, intentando reconectar...')
            )
            // Espera 3s antes de reconectar para no entrar en loop que quema CPU
            await new Promise(resolve => setTimeout(resolve, 3000))
            await global.reloadHandler(true)
        } else {
            console.log(
                chalk.bgRed.white.bold('\n 🛑 DESCONECTADO ') +
                chalk.redBright(' Sesión cerrada. Por favor, borra la carpeta de sesión y vuelve a iniciar.')
            )
        }
    }
}

let handler = await import('./handler.js')
global.reloadHandler = async function (restatConn) {
    try {
        const Handler = await import(`./handler.js?update=${Date.now()}`)
        if (Object.keys(Handler || {}).length) handler = Handler
    } catch (e) {
        console.error(chalk.redBright('Error al recargar handler:'), e)
    }

    if (restatConn) {
        try { global.conn.ws.close() } catch {}
        conn.ev.removeAllListeners()
        global.conn = makeWASocket(connectionOptions)
    }

    global.conn.handler = handler.handler.bind(global.conn)
    global.conn.connectionUpdate = connectionUpdate.bind(global.conn)
    global.conn.credsUpdate = saveCreds.bind(global.conn, true)

    global.conn.ev.on('messages.upsert', global.conn.handler)
    global.conn.ev.on('connection.update', global.conn.connectionUpdate)
    global.conn.ev.on('creds.update', global.conn.credsUpdate)
}

// --- INICIO ---
async function iniciarEris() {
    if (opcionConexion === '2') {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
        const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))

        console.log(chalk.bgCyan.black.bold('\n 📱 INGRESA TU NÚMERO '))
        console.log(chalk.cyanBright('(ej. 5215629885039)'))
        let numero = await question(chalk.yellowBright('➪ '))
        numero = numero.replace(/[^0-9]/g, '')
        rl.close()

        // Primero cargamos plugins y handler
        await Promise.all([filesInit(), global.reloadHandler()])
        console.log(
            chalk.cyanBright(`✦ Plugins cargados en memoria: `) +
            chalk.bold.white(`${Object.keys(global.plugins).length}\n`)
        )

        // Esperar a que el socket esté listo, con reintentos.
        // "Connection Closed" ocurre si pedimos el código antes de tiempo.
        console.log(chalk.yellowBright('⏳ Conectando con WhatsApp, por favor espera...'))

        try {
            let codigo = null
            let ultimoError = null

            for (let intento = 1; intento <= 5; intento++) {
                await new Promise(resolve => setTimeout(resolve, 3000))
                try {
                    codigo = await global.conn.requestPairingCode(numero)
                    if (codigo) break
                } catch (err) {
                    ultimoError = err
                    console.log(chalk.gray(`   · reintentando (${intento}/5)...`))
                }
            }

            if (!codigo) throw ultimoError || new Error('No se obtuvo el código')

            codigo = codigo.match(/.{1,4}/g)?.join('-') || codigo

            console.log(chalk.bold.magenta('╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮'))
            console.log(chalk.bold.magenta('┃') + chalk.bold.white('     🔗 TU CÓDIGO DE WHATSAPP:     ') + chalk.bold.magenta('┃'))
            console.log(chalk.bold.magenta('┃') + chalk.bold.green(`             ${codigo}             `) + chalk.bold.magenta('┃'))
            console.log(chalk.bold.magenta('╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n'))
            console.log(chalk.yellowBright('⚠️  Tienes ~60 segundos para ingresar el código en WhatsApp.\n'))
        } catch (error) {
            console.error(
                chalk.bgRed.white.bold('\n ❌ ERROR ') +
                chalk.redBright(' No se pudo solicitar el código. Reinicia el bot y vuelve a intentarlo.\n'),
                error.message || ''
            )
        }
    } else {
        await Promise.all([filesInit(), global.reloadHandler()])
        console.log(
            chalk.cyanBright(`✦ Plugins cargados en memoria: `) +
            chalk.bold.white(`${Object.keys(global.plugins).length}\n`)
        )
    }
}

iniciarEris().catch(console.error)

// --- LIMPIEZA TMP CADA 5 MIN ---
setInterval(() => {
    const tmpDir = join(__dirname, 'tmp')
    if (existsSync(tmpDir)) {
        readdirSync(tmpDir).forEach(f => {
            try { unlinkSync(join(tmpDir, f)) } catch {}
        })
    }
}, 1000 * 60 * 5)
