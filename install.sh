#!/bin/bash
# ════════════════════════════════════════════════════════════════
#   🌸 ERIS-MD · INSTALADOR AUTOMÁTICO 🌸
#   Instala TODO lo necesario y deja el bot listo para iniciar.
#   Uso:  bash install.sh
# ════════════════════════════════════════════════════════════════

set -e  # Detener si algún paso falla

# --- Colores ---
ROSA='\033[1;35m'
VERDE='\033[1;32m'
CYAN='\033[1;36m'
AMARILLO='\033[1;33m'
ROJO='\033[1;31m'
NC='\033[0m'

linea() { echo -e "${ROSA}────────────────────────────────────────────────────${NC}"; }

clear
linea
echo -e "${ROSA}        🌸  INSTALADOR DE ERIS-MD  🌸${NC}"
linea
echo ""

# ─── 1. Dependencias del sistema (FFmpeg, git, curl) ───
echo -e "${CYAN}[1/6] Instalando dependencias del sistema...${NC}"
if command -v apt &> /dev/null; then
    sudo apt update -y
    sudo apt install -y ffmpeg git curl
elif command -v yum &> /dev/null; then
    sudo yum install -y ffmpeg git curl
else
    echo -e "${AMARILLO}⚠  No se detectó apt/yum. Instala ffmpeg, git y curl manualmente.${NC}"
fi

# ─── 2. Node.js v20 (vía NVM) ───
echo -e "${CYAN}[2/6] Verificando Node.js...${NC}"
NODE_OK=false
if command -v node &> /dev/null; then
    NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
    if [ "$NODE_MAJOR" -ge 20 ]; then
        echo -e "${VERDE}✓ Node.js $(node -v) ya instalado.${NC}"
        NODE_OK=true
    fi
fi

if [ "$NODE_OK" = false ]; then
    echo -e "${AMARILLO}Instalando Node.js v20 vía NVM...${NC}"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 20
    nvm use 20
    nvm alias default 20
fi

# ─── 3. Dependencias del bot (npm) ───
echo -e "${CYAN}[3/6] Instalando dependencias del bot (npm)...${NC}"
echo -e "${AMARILLO}Esto puede tardar unos minutos...${NC}"
npm install --legacy-peer-deps

# ─── 4. Carpeta temporal ───
echo -e "${CYAN}[4/6] Preparando carpeta temporal...${NC}"
mkdir -p tmp
chmod 777 tmp

# ─── 5. Permisos de scripts ───
echo -e "${CYAN}[5/6] Ajustando permisos...${NC}"
chmod +x pm2-bot.sh 2>/dev/null || true

# ─── 6. Verificación final ───
echo -e "${CYAN}[6/6] Verificando instalación...${NC}"
if [ -d "node_modules" ] && [ -f "index.js" ]; then
    echo -e "${VERDE}✓ Todo instalado correctamente.${NC}"
else
    echo -e "${ROJO}✗ Algo falló. Revisa los mensajes de arriba.${NC}"
    exit 1
fi

echo ""
linea
echo -e "${VERDE}   ✅  ¡INSTALACIÓN COMPLETADA!${NC}"
linea
echo ""
echo -e "${AMARILLO}Antes de iniciar, edita tus datos de owner en:${NC}  ${CYAN}settings.js${NC}"
echo ""
echo -e "${ROSA}▸ Para iniciar el bot (modo normal):${NC}"
echo -e "     ${VERDE}node index.js${NC}"
echo ""
echo -e "${ROSA}▸ Para iniciar 24/7 con PM2 (recomendado en VPS):${NC}"
echo -e "     ${VERDE}bash pm2-bot.sh${NC}"
echo ""
echo -e "${CYAN}   Comandos útiles de PM2:${NC}"
echo -e "     pm2 logs eris-bot    ${AMARILLO}# ver consola / código QR${NC}"
echo -e "     pm2 restart eris-bot ${AMARILLO}# reiniciar${NC}"
echo -e "     pm2 stop eris-bot    ${AMARILLO}# detener${NC}"
linea
