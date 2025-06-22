#!/bin/bash

# Fastmail MCP Server - Instalación automática
# Este script instala el servidor MCP de Fastmail en tu sistema

set -e

echo "📧 ╔════════════════════════════════════════════════════════════════╗"
echo "   ║              INSTALADOR FASTMAIL MCP SERVER                   ║"
echo "   ╚════════════════════════════════════════════════════════════════╝"
echo ""

# Verificar que Node.js está instalado
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Error: Node.js no está instalado"
    echo "   Instala Node.js desde: https://nodejs.org/"
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$NODE_MAJOR" -lt 18 ]; then
    echo "❌ Error: Se requiere Node.js 18 o superior"
    echo "   Versión actual: $NODE_VERSION"
    exit 1
fi

echo "✅ Node.js encontrado: v$NODE_VERSION"

# Definir directorio de instalación
INSTALL_DIR="$HOME/.local/share/fastmail-mcp-server"
CONFIG_DIR="$HOME/.config/claude-desktop"

echo "📁 Directorio de instalación: $INSTALL_DIR"

# Crear directorios si no existen
mkdir -p "$INSTALL_DIR"
mkdir -p "$CONFIG_DIR"

# Descargar o clonar el repositorio
if [ -d "$INSTALL_DIR/.git" ]; then
    echo "🔄 Actualizando repositorio existente..."
    cd "$INSTALL_DIR"
    git pull
else
    echo "⬇️  Clonando repositorio..."
    git clone https://github.com/TU_USUARIO/fastmail-mcp-server.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Compilar proyecto
echo "🔨 Compilando proyecto..."
npm run build

# Configurar archivo .env
if [ ! -f ".env" ]; then
    echo "⚙️  Configurando credenciales..."
    cp .env.example .env
    
    echo ""
    echo "🔑 Necesitas configurar tus credenciales de Fastmail"
    echo "   1. Ve a: https://www.fastmail.com/settings/security/tokens"
    echo "   2. Crea un nuevo token con permisos: Mail, Submission"
    echo "   3. Edita el archivo: $INSTALL_DIR/.env"
    echo ""
    
    read -p "¿Quieres abrir el archivo .env ahora? [s/N]: " OPEN_ENV
    if [[ $OPEN_ENV =~ ^[Ss]$ ]]; then
        ${EDITOR:-nano} "$INSTALL_DIR/.env"
    fi
fi

# Configurar Claude Desktop (si existe)
CLAUDE_CONFIG="$CONFIG_DIR/claude_desktop_config.json"

if [ -f "$CLAUDE_CONFIG" ]; then
    echo "📝 Actualizando configuración de Claude Desktop..."
    
    # Backup de la configuración existente
    cp "$CLAUDE_CONFIG" "$CLAUDE_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Aquí podrías usar jq para modificar el JSON, o mostrar instrucciones
    echo "⚠️  Configuración manual requerida:"
    echo "   Archivo: $CLAUDE_CONFIG"
    echo "   Añade esta configuración al objeto 'mcpServers':"
    echo ""
    echo '   "fastmail": {'
    echo '     "command": "node",'
    echo "     \"args\": [\"$INSTALL_DIR/build/index.js\"]"
    echo '   }'
    echo ""
else
    echo "📝 Creando configuración de Claude Desktop..."
    cat > "$CLAUDE_CONFIG" << EOF
{
  "mcpServers": {
    "fastmail": {
      "command": "node",
      "args": ["$INSTALL_DIR/build/index.js"]
    }
  }
}
EOF
fi

echo ""
echo "✅ ¡Instalación completada!"
echo ""
echo "📋 Pasos finales:"
echo "   1. Configura tus credenciales en: $INSTALL_DIR/.env"
echo "   2. Reinicia Claude Desktop"
echo "   3. ¡Prueba pidiendo a Claude que liste tus emails!"
echo ""
echo "🔧 Para desinstalar: rm -rf $INSTALL_DIR"
echo ""
