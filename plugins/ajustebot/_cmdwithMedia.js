const {
    proto,
    generateWAMessage,
    areJidsSameUser
} = (await import('@whiskeysockets/baileys')).default

export async function all(m, chatUpdate) {
    if (m.isBaileys) return
    if (!m.message) return
    
    // Detectamos si es un sticker
    const stickerObj = m.message.stickerMessage
    if (!stickerObj || !stickerObj.fileSha256) return

    // Convertimos el Hash a Base64 para buscarlo en la DB
    const hash = Buffer.from(stickerObj.fileSha256).toString('base64')
    
    if (!(hash in global.db.data.sticker)) return

    // Obtenemos el comando vinculado al sticker
    let stickerData = global.db.data.sticker[hash]
    let { text, mentionedJid } = stickerData

    console.log(`🌸 [STICKER-CMD] Ejecutando: ${text}`)

    // Generamos el mensaje falso que el bot procesará
    let messages = await generateWAMessage(m.chat, { 
        text: text, 
        mentions: mentionedJid 
    }, {
        userJid: this.user.id,
        quoted: m.quoted && m.quoted.fakeObj
    })

    // Sincronizamos los datos para que el bot crea que es un mensaje real del usuario
    messages.key.fromMe = areJidsSameUser(m.sender, this.user.id)
    messages.key.id = m.key.id
    messages.pushName = m.pushName
    if (m.isGroup) messages.participant = m.sender

    let msg = {
        ...chatUpdate,
        messages: [proto.WebMessageInfo.fromObject(messages)],
        type: 'append'
    }

    // Disparamos el evento para que los demás plugins lo capturen
    this.ev.emit('messages.upsert', msg)
}
