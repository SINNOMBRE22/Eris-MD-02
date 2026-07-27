/* 🦈 ERIS-MD BUTTON HANDLER EXTREMO 🦈 */

const handler = m => m;

const recentButtonCommands = new Map();

handler.all = async function (m) {
    try {
        if (!m.message) return true;
        if (m.key?.remoteJid === 'status@broadcast') return true;
        if (m.fromButton) return true;

        const msg = m.message;

        // Sender real (participant en grupos, remoteJid en privado)
        const realSender = m.key?.participant || m.participant || m.key?.remoteJid;

        // Bloquear eco de texto de botón reciente
        const textContent = msg.conversation || msg.extendedTextMessage?.text;
        if (textContent && realSender) {
            const key = `${realSender}:${textContent}`;
            console.log(`🔍 [ECO-DEBUG] realSender=${realSender} text=${textContent}`);
            console.log(`🔍 [ECO-DEBUG] mapKeys=[${[...recentButtonCommands.keys()].join(' | ')}]`);
            if (recentButtonCommands.has(key)) {
                recentButtonCommands.delete(key);
                console.log(`🔇 [ERIS-BUTTON] Eco ignorado: ${textContent} de ${realSender}`);
                return true;
            }
        }

        // Detectar respuesta interactiva
        const interactiveMsg =
            msg.interactiveResponseMessage ||
            msg.buttonsResponseMessage ||
            msg.templateButtonReplyMessage ||
            msg.listResponseMessage;

        if (!interactiveMsg) return true;

        // Extraer el comando
        let command =
            interactiveMsg.selectedButtonId ||
            interactiveMsg.selectedId ||
            interactiveMsg.singleSelectReply?.selectedRowId ||
            null;

        if (!command && interactiveMsg.nativeFlowResponseMessage?.paramsJson) {
            try {
                const parsed = JSON.parse(interactiveMsg.nativeFlowResponseMessage.paramsJson);
                command = parsed.id || parsed.title || null;
            } catch (_) {}
        }

        if (!command) {
            command = interactiveMsg.body?.text || interactiveMsg.title || null;
        }

        if (!command) return true;

        // Registrar con el sender real para que matchee el eco
        const echoKey = `${realSender}:${command}`;
        recentButtonCommands.set(echoKey, Date.now());
        setTimeout(() => recentButtonCommands.delete(echoKey), 5000);

        m.fromButton = true;

        console.log(`🌸 [ERIS-BUTTON] Ejecutando: Comando -> ${command}`);
        console.log(`   🔹 De: ${realSender}`);
        console.log(`   🔹 Protocolo Original: ${m.mtype || 'Unknown'}`);

        m.message = { conversation: command };
        m.text = command;

        Object.defineProperty(m, 'sender', {
            value: realSender,
            writable: true,
            configurable: true,
            enumerable: true
        });

    } catch (err) {
        console.error('❌ Error en el manejador de botones de Eris:', err);
    }
    return true;
};

export default handler;
