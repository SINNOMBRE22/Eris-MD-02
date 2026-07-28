#!/bin/bash
# ════════════════════════════════════════════════════
#   🌸 ERIS-MD · PM2 (modo ligero, sin logs) 🌸
#   Mantiene el bot 24/7 sin escribir logs a disco.
#   Para ver la consola en vivo usa: node index.js
# ════════════════════════════════════════════════════

# Instalar PM2 solo si falta
command -v pm2 &>/dev/null || npm install -g pm2

# Iniciar el bot:
#   --no-autorestart  NO -> queremos que reinicie si crashea, así que lo dejamos
#   -o /dev/null -e /dev/null  -> descarta logs (no escribe a disco)
#   --max-memory-restart 300M  -> reinicia si se pasa de RAM (protege la VPS)
#   --time false               -> sin timestamps
pm2 start index.js \
    --name eris-bot \
    --max-memory-restart 300M \
    -o /dev/null \
    -e /dev/null \
    --merge-logs

# Persistencia tras reboot
pm2 save
pm2 startup 2>/dev/null | grep -E '^sudo' | bash 2>/dev/null

echo ""
echo "✅ Eris-Bot corriendo en segundo plano (sin logs)."
echo "   • Ver estado:   pm2 list"
echo "   • Detener:      pm2 stop eris-bot"
echo "   • Reiniciar:    pm2 restart eris-bot"
echo "   • Consola viva: node index.js"
