/* 🦈 ERIS-MD INTERACTIVE HANDLER (ADVANCED) 🦈 */

const { proto, generateWAMessage, areJidsSameUser } = (await import('@whiskeysockets/baileys')).default;

export async function all(m, chatUpdate) {
    if (m.isBaileys || !m.message) return;

    // 1. Detectar el tipo de respuesta (Botón, Lista o Flujo Nativo)
    const interactiveTypes = [
        'buttonsResponseMessage',
        'templateButtonReplyMessage',
        'listResponseMessage',
        'interactiveResponseMessage'
    ];
    
    const type = interactiveTypes.find(t => m.message[t]);
    if (!type) return;

    let id, text;
    const msg = m.message[type];

    // 2. Extraer ID y Texto según el formato
    if (type === 'buttonsResponseMessage') {
        id = msg.selectedButtonId;
        text = msg.selectedDisplayText;
    } else if (type === 'templateButtonReplyMessage') {
        id = msg.selectedId;
        text = msg.selectedDisplayText;
    } else if (type === 'listResponseMessage') {
        id = msg.singleSelectReply?.selectedRowId;
        text = msg.title;
    } else if (type === 'interactiveResponseMessage') {
        id = JSON.parse(msg.nativeFlowResponseMessage.paramsJson).id;
        text = "Interactive Response";
    }

    if (!id) return;

    // 3. Verificar si el ID es un comando válido en los plugins instalados
    let isCommand = false;
    for (const name in global.plugins) {
        const plugin = global.plugins[name];
        if (!plugin || plugin.disabled) continue;

        const _prefix = plugin.customPrefix ? plugin.customPrefix : (this.prefix ? this.prefix : global.prefix);
        const str2Regex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
        
        // Lógica de detección de prefijo
        const prefixes = Array.isArray(_prefix) ? _prefix : [_prefix];
        for (let p of prefixes) {
            const re = p instanceof RegExp ? p : new RegExp(str2Regex(p));
            const match = re.exec(id);
            if (match) {
                const noPrefix = id.replace(match[0], '').trim();
                const [cmd] = noPrefix.split(' ');
                const command = cmd.toLowerCase();

                const isMatch = plugin.command instanceof RegExp ? 
                    plugin.command.test(command) : 
                    Array.isArray(plugin.command) ? 
                    plugin.command.some(c => c instanceof RegExp ? c.test(command) : c === command) : 
                    plugin.command === command;

                if (isMatch) {
                    isCommand = true;
                    break;
                }
            }
        }
        if (isCommand) break;
    }

    console.log(`🌸 [ERIS-BUTTON] Ejecutando: ${isCommand ? 'Comando' : 'Texto'} -> ${id}`);

    // 4. Crear el mensaje simulado
    const messages = await generateWAMessage(m.chat, { 
        text: isCommand ? id : text, 
        mentions: m.mentionedJid 
    }, {
        userJid: this.user.id,
        quoted: m.quoted && m.quoted.fakeObj,
    });

    // Sincronizar metadatos
    messages.key.fromMe = areJidsSameUser(m.sender, this.user.id);
    messages.key.id = m.key.id;
    messages.pushName = m.name;
    if (m.isGroup) messages.key.participant = messages.participant = m.sender;

    const upsertMsg = {
        ...chatUpdate,
        messages: [proto.WebMessageInfo.fromObject(messages)].map((v) => (v.conn = this, v)),
        type: 'append',
    };

    // Lanzar al núcleo del bot
    this.ev.emit('messages.upsert', upsertMsg);
}
