#!/bin/bash

# Script de instalación automatizada para CyberGuard
echo "Iniciando instalación de CyberGuard..."

# 1. Verificar dependencias básicas
command -v node >/dev/null 2>&1 || { echo >&2 "Node.js no está instalado. Por favor instálalo primero."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo >&2 "npm no está instalado. Por favor instálalo primero."; exit 1; }
command -v git >/dev/null 2>&1 || { echo >&2 "git no está instalado. Por favor instálalo primero."; exit 1; }

# 2. Instalar dependencias del proyecto
echo "Instalando dependencias de Node.js..."
npm install

# 3. Configurar variables de entorno
if [ ! -f .env ]; then
    echo "Creando archivo .env base..."
    echo "DATABASE_URL=postgres://usuario:password@localhost:5432/cyberguard" > .env
    echo "TELEGRAM_BOT_TOKEN=tu_token_aqui" >> .env
    echo "SESSION_SECRET=un_secreto_aleatorio" >> .env
    echo "Configuración inicial creada. Por favor, edita el archivo .env con tus credenciales reales."
fi

# 4. Preparar la base de datos (requiere PostgreSQL corriendo)
echo "Sincronizando esquema de base de datos..."
npx drizzle-kit push

# 5. Compilar el frontend
echo "Compilando frontend..."
npm run build

echo "Instalación completada con éxito."
echo "Para iniciar la aplicación en modo desarrollo usa: npm run dev"
