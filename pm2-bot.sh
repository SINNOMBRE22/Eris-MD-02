#!/bin/bash

echo "--- 🚀 Optimizando configuración de PM2 para Eris-Bot ---"

# 1. Instalar PM2 y pm2-logrotate si no existen
if ! command -v pm2 &> /dev/null; then
    echo "[1/5] Instalando PM2 globalmente..."
    npm install -g pm2
else
    echo "[1/5] PM2 ya está instalado."
fi

# Instalar el módulo para rotar logs (evita que crezcan infinitamente)
echo "[2/5] Configurando sistema de limpieza de logs (500KB)..."
pm2 install pm2-logrotate

# Configurar pm2-logrotate:
# max_size: 500K (medio mega)
# retain: 3 (mantiene solo los últimos 3 archivos para no llenar el disco)
pm2 set pm2-logrotate:max_size 500K
pm2 set pm2-logrotate:retain 3
pm2 set pm2-logrotate:compress true

# 2. Iniciar el bot con auto-restart por memoria (opcional pero recomendado)
echo "[3/5] Iniciando eris-bot con límites de recursos..."
# --max-memory-restart evita que el bot sature la VPS si hay una fuga de memoria
pm2 start index.js --name "eris-bot" --max-memory-restart 300M

# 3. Configurar el inicio automático con el sistema
echo "[4/5] Configurando persistencia tras el reboot..."
# Genera y ejecuta el comando de startup automáticamente
PM2_STARTUP=$(pm2 startup | grep "sudo")
if [ -n "$PM2_STARTUP" ]; then
    eval "$PM2_STARTUP"
else
    echo "El comando startup ya está configurado o requiere intervención manual."
fi

# 4. Guardar el estado actual
echo "[5/5] Guardando dump de procesos..."
pm2 save

echo "----------------------------------------------------"
echo "✅ ¡Configuración Completada!"
echo "• Logs limitados a: 500 KB"
echo "• Auto-reinicio: Activado tras reboot"
echo "• Basura: pm2-logrotate eliminará registros viejos"
echo "----------------------------------------------------"
