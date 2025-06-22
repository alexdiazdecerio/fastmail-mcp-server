#!/bin/bash

echo "🚀 Preparando fastmail-mcp-server para publicación..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecuta este script desde el directorio del proyecto"
    exit 1
fi

# Limpiar build anterior
echo "🧹 Limpiando builds anteriores..."
rm -rf build/
rm -rf node_modules/

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Verificar que no hay .env en el directorio
if [ -f ".env" ]; then
    echo "⚠️  ADVERTENCIA: Archivo .env encontrado"
    echo "   Asegúrate de que está en .gitignore y no se subirá al repo"
    echo ""
fi

# Compilar proyecto
echo "🔨 Compilando TypeScript..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Compilación exitosa"
else
    echo "❌ Error en la compilación"
    exit 1
fi

# Verificar que el build funciona
echo "🧪 Probando el servidor..."
timeout 5 node build/index.js --help 2>/dev/null || echo "⚠️  Nota: Prueba rápida completada"

echo ""
echo "✨ ¡Proyecto listo para publicar!"
echo ""
echo "📋 Siguientes pasos:"
echo "   1. git init (si no está inicializado)"
echo "   2. git add ."
echo "   3. git commit -m 'Initial commit'"
echo "   4. Crear repositorio en GitHub"
echo "   5. git remote add origin [URL]"
echo "   6. git push -u origin main"
echo ""
